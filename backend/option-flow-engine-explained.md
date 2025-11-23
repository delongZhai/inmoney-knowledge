# How We Built Our Own Option Flow Engine

A comprehensive guide explaining how InMoney detects unusual options activity in real-time, from raw market data to actionable trading signals.

---

## Table of Contents

1. [What is an Option Flow Engine?](#1-what-is-an-option-flow-engine)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Data Ingestion Pipeline](#3-data-ingestion-pipeline)
4. [The Labeling System](#4-the-labeling-system)
5. [Scoring Algorithm](#5-scoring-algorithm)
6. [Storage & Retrieval](#6-storage--retrieval)
7. [Key Design Decisions](#7-key-design-decisions)
8. [Challenges & Solutions](#8-challenges--solutions)

---

## 1. What is an Option Flow Engine?

An **Option Flow Engine** monitors real-time options trading activity across the market to identify **unusual** trades that may signal institutional activity or informed trading.

### Why Build One?

- **Institutional traders** often use options to make large directional bets
- **Unusual activity** (high volume, large premiums) can precede significant price moves
- **Retail traders** can benefit from seeing what "smart money" is doing

### What We Detect

- Large premium transactions ($50K+ on a single trade)
- Volume spikes relative to open interest
- Aggressive buying/selling at ask/bid prices
- Unusual activity in specific moneyness zones (ITM, ATM, OTM)

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTION FLOW ENGINE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│   │   SCHEDULER  │────▶│  ORCHESTRATOR │────▶│   DETECTOR   │               │
│   │  (Every min) │     │ (Symbol Mgmt) │     │  (Per Batch) │               │
│   └──────────────┘     └──────────────┘     └──────────────┘               │
│                                                     │                        │
│                              ┌──────────────────────┼──────────────────────┐│
│                              ▼                      ▼                      ▼│
│                     ┌──────────────┐     ┌──────────────┐     ┌──────────┐ │
│                     │ DATA SOURCE  │     │    CACHE     │     │ DATABASE │ │
│                     │(Alpha Vantage)│     │ (Cloudflare) │     │(Supabase)│ │
│                     └──────────────┘     └──────────────┘     └──────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Cloudflare Workers | Serverless compute at edge |
| **Background Jobs** | Cloudflare Workflows | Long-running detection jobs |
| **Cache** | Cloudflare KV | Store previous cycle data |
| **Database** | Supabase (PostgreSQL) | Persist options & events |
| **Data Source** | Alpha Vantage API | Real-time options data |

---

## 3. Data Ingestion Pipeline

### 3.1 Scheduling

We run detection **every minute** during US market hours (9:30 AM - 4:00 PM ET).

```
Cron: "* 13-21 * * mon-fri"  (UTC time)
```

### 3.2 Symbol Selection

Each minute, we select which symbols to scan:

```
Total Capacity: 300 symbols/minute
├── 800 random stocks (sampled)
├── 100 ETFs
└── User watchlist symbols (prioritized, 75% capacity)
```

**Why random sampling?** We can't scan all 8,000+ optionable symbols every minute. Random sampling ensures broad market coverage over time.

### 3.3 Batch Processing

Symbols are processed in **batches of 20** to optimize API calls:

```
300 symbols ÷ 20 per batch = 15 parallel detection jobs
```

### 3.4 Data Fetching

For each symbol, we fetch real-time options data:

```
GET /realtime-options/{symbol}

Response:
{
  "symbol": "AAPL",
  "options": [
    {
      "contractID": "AAPL240119C00150000",
      "expiration": "2024-01-19",
      "strike": 150.00,
      "type": "call",
      "last": 5.25,          // Last traded price
      "bid": 5.20,           // Best bid
      "ask": 5.30,           // Best ask
      "mark": 5.25,          // Mid-point
      "volume": 1500,        // Today's volume
      "open_interest": 5000, // Open interest
      "iv": 0.35,            // Implied volatility
      "delta": 0.65,         // Greeks...
      "gamma": 0.02,
      "theta": -0.15,
      "vega": 0.25
    },
    // ... more contracts
  ]
}
```

### 3.5 Cycle Comparison

To detect **changes**, we compare current data against the previous cycle (cached in KV):

```
Previous Cycle (5 min ago):  volume = 1000
Current Cycle:               volume = 1500
─────────────────────────────────────────
Volume Change:               +500 contracts (new activity!)
```

This comparison is critical - we're not looking at absolute values, but **delta changes** between cycles.

---

## 4. The Labeling System

This is the heart of our engine. We use **12 qualification codes** (U001-U012) to label why an option is "unusual."

### 4.1 Qualification Codes

| Code | Name | Criteria | What It Means |
|------|------|----------|---------------|
| **U001** | High Velocity | `activity_score >= 0.0001` | Rapid trading in short time |
| **U002** | Significant Premium | `premium >= dynamic_threshold` | Large dollar transaction |
| **U003** | High Vol/OI Ratio | `volume / open_interest >= 0.5` | 50%+ of OI traded today |
| **U004** | Volume > OI | `volume > open_interest` | More traded than total positions |
| **U005** | Size Anomaly | `volume >= 3x bid_size or ask_size` | Unusual size vs quotes |
| **U006** | ATM Position | `moneyness within 1%` | At-the-money option |
| **U007** | ITM Position | `moneyness > 1.01` | In-the-money option |
| **U008** | OTM Position | `moneyness < 0.99` | Out-of-the-money option |
| **U009** | Ask-Side Urgency | `last >= ask` | Bought at or above ask (aggressive) |
| **U010** | Bid-Side Urgency | `last <= bid` | Sold at or below bid (aggressive) |
| **U011** | High Volume | `volume >= 1000` | Absolute volume threshold |
| **U012** | ITM Vol/OI | `ITM + vol/oi >= 0.3` | In-the-money with activity |

### 4.2 Moneyness Calculation

**Moneyness** tells us if an option is ITM, ATM, or OTM:

```
For CALLS:  moneyness = stock_price / strike_price
For PUTS:   moneyness = strike_price / stock_price

Examples (stock at $100):
├── Call with $95 strike:  100/95 = 1.05 (ITM)
├── Call with $100 strike: 100/100 = 1.00 (ATM)
└── Call with $105 strike: 100/105 = 0.95 (OTM)
```

### 4.3 Dynamic Premium Threshold

We don't use a fixed dollar threshold. Instead, it **scales with stock price**:

```
threshold = (stock_price / $50) × $10,000

Examples:
├── $50 stock:  $10,000 threshold
├── $100 stock: $20,000 threshold
├── $500 stock: $100,000 threshold
└── $1000 stock: $200,000 threshold
```

**Why?** A $50K trade on a $20 stock is massive. The same $50K on a $500 stock is routine.

### 4.4 Qualification Paths

An option must pass **one of three paths** to qualify as unusual:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      QUALIFICATION DECISION TREE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PATH 1: HIGH VELOCITY TRADING                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  IF high_velocity (U001)                                             │
│     AND (significant_premium (U002)                                  │
│          OR volume_anomaly (U003/U004/U005))                         │
│  → QUALIFIES                                                         │
│                                                                      │
│  PATH 2: AT-THE-MONEY OPTIONS                                        │
│  ─────────────────────────────────────────────────────────────────  │
│  IF at_the_money (U006)                                              │
│     AND significant_premium (U002)                                   │
│     AND volume_anomaly (U003/U004)                                   │
│  → QUALIFIES                                                         │
│                                                                      │
│  PATH 3a: IN-THE-MONEY OPTIONS                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  IF in_the_money (U007)                                              │
│     AND significant_premium (U002)                                   │
│     AND (itm_vol_oi (U012) OR urgency (U009/U010))                   │
│  → QUALIFIES                                                         │
│                                                                      │
│  PATH 3b: OUT-OF-THE-MONEY OPTIONS                                   │
│  ─────────────────────────────────────────────────────────────────  │
│  IF out_of_the_money (U008)                                          │
│     AND volume_anomaly (U003/U004)                                   │
│     AND (significant_premium (U002) OR high_volume (U011))           │
│  → QUALIFIES                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Implementation (Pseudocode)

```python
def qualify(option, stock_price, market_cap):
    codes = []

    # Calculate metrics
    moneyness = calc_moneyness(option.type, stock_price, option.strike)
    premium_threshold = (stock_price / 50) * 10000
    net_premium = option.last * option.volume * 100  # 100 shares per contract
    vol_oi_ratio = option.volume / option.open_interest if option.open_interest > 0 else 0

    # Check each condition
    is_high_velocity = option.activity_score >= 0.0001
    has_significant_premium = net_premium >= premium_threshold
    has_high_vol_oi = vol_oi_ratio >= 0.5
    volume_exceeds_oi = option.volume > option.open_interest
    has_size_anomaly = option.volume >= option.bid_size * 3 or option.volume >= option.ask_size * 3

    is_atm = abs(1 - moneyness) <= 0.01
    is_itm = moneyness > 1.01
    is_otm = moneyness < 0.99

    is_buy_urgent = option.last >= option.ask
    is_sell_urgent = option.last <= option.bid

    has_high_volume = option.volume >= 1000
    has_itm_vol_oi = is_itm and vol_oi_ratio >= 0.3

    # Record codes
    if is_high_velocity: codes.append('U001')
    if has_significant_premium: codes.append('U002')
    if has_high_vol_oi: codes.append('U003')
    if volume_exceeds_oi: codes.append('U004')
    if has_size_anomaly: codes.append('U005')
    if is_atm: codes.append('U006')
    if is_itm: codes.append('U007')
    if is_otm: codes.append('U008')
    if is_buy_urgent: codes.append('U009')
    if is_sell_urgent: codes.append('U010')
    if has_high_volume: codes.append('U011')
    if has_itm_vol_oi: codes.append('U012')

    # Path 1: High Velocity
    if is_high_velocity:
        if has_significant_premium:
            return True, codes
        if has_high_vol_oi or volume_exceeds_oi or has_size_anomaly:
            return True, codes

    # Path 2: ATM
    if is_atm:
        if has_significant_premium and (has_high_vol_oi or volume_exceeds_oi):
            return True, codes

    # Path 3a: ITM
    if is_itm:
        if has_significant_premium and (has_itm_vol_oi or is_buy_urgent or is_sell_urgent):
            return True, codes

    # Path 3b: OTM
    if is_otm:
        if (has_high_vol_oi or volume_exceeds_oi):
            if has_significant_premium or has_high_volume:
                return True, codes

    return False, codes
```

---

## 5. Scoring Algorithm

Once an option qualifies, we calculate a **score** and classify the **event type**.

### 5.1 Score Calculation

The score normalizes premium against market cap:

```
score = (net_premium / market_cap) × 1000

Where:
  net_premium = last_price × volume × 100

Example:
  Stock: AAPL ($3T market cap)
  Option: $5.00 last, 10,000 volume
  Net Premium: $5 × 10,000 × 100 = $5,000,000
  Score: ($5M / $3T) × 1000 = 0.00167

  Stock: XYZ ($1B market cap)
  Option: $2.00 last, 5,000 volume
  Net Premium: $2 × 5,000 × 100 = $1,000,000
  Score: ($1M / $1B) × 1000 = 1.0
```

**Why normalize by market cap?** A $1M trade on Apple is noise. A $1M trade on a $1B company is significant.

### 5.2 Event Type Classification

We classify trades into 6 types based on execution price:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT TYPE CLASSIFICATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bid ◄─────────────────── Mark ───────────────────► Ask         │
│   │                         │                         │          │
│   │    SELL TERRITORY       │     BUY TERRITORY       │          │
│   │                         │                         │          │
│   ▼                         ▼                         ▼          │
│                                                                  │
│  If last <= bid:                                                 │
│     Call → SellCall (bearish)                                    │
│     Put  → SellPut (bullish)                                     │
│                                                                  │
│  If last >= ask:                                                 │
│     Call → BuyCall (bullish)                                     │
│     Put  → BuyPut (bearish)                                      │
│                                                                  │
│  If bid < last < ask:                                            │
│     Closer to ask → Askside (leaning bullish)                    │
│     Closer to bid → Bidside (leaning bearish)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Implementation (Pseudocode)

```python
def classify_event(option):
    spread = option.ask - option.bid
    spread_significant = spread > option.mark * 0.01  # > 1% spread

    # Aggressive execution at edges
    if option.last >= option.ask:
        return 'BuyCall' if option.type == 'call' else 'BuyPut'

    if option.last <= option.bid:
        return 'SellCall' if option.type == 'call' else 'SellPut'

    # Mid-spread execution
    distance_to_ask = option.ask - option.last
    distance_to_bid = option.last - option.bid

    if distance_to_ask < distance_to_bid:
        return 'Askside'  # Leaning buy
    else:
        return 'Bidside'  # Leaning sell
```

### 5.4 Sentiment Mapping

| Event Type | Option Type | Market Sentiment |
|------------|-------------|------------------|
| BuyCall | Call | **Bullish** |
| SellPut | Put | **Bullish** |
| BuyPut | Put | **Bearish** |
| SellCall | Call | **Bearish** |
| Askside | Any | Neutral-Bullish |
| Bidside | Any | Neutral-Bearish |

---

## 6. Storage & Retrieval

### 6.1 Database Schema

We store two main entities:

**Options Table** (Master reference)
```sql
CREATE TABLE options (
  option_id TEXT PRIMARY KEY,  -- "AAPL240119C00150000"
  symbol TEXT NOT NULL,
  exp_date DATE NOT NULL,
  strike NUMERIC NOT NULL,
  o_type TEXT NOT NULL         -- 'call' or 'put'
);
```

**Option Events Table** (Activity log)
```sql
CREATE TABLE option_events (
  id UUID PRIMARY KEY,
  option_id TEXT REFERENCES options(option_id),
  event_type TEXT NOT NULL,           -- BuyCall, SellPut, etc.
  volume INTEGER NOT NULL,
  net_premium_transacted NUMERIC,
  score NUMERIC,
  moneyness NUMERIC,
  qualification_codes TEXT[],         -- ['U001', 'U002', 'U007']
  last_stock_price NUMERIC,
  -- Greeks
  iv NUMERIC,
  delta NUMERIC,
  gamma NUMERIC,
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Data Retention

- **Hot data**: Last 24 hours in materialized view
- **Warm data**: Last 30 days in main table
- **Cold data**: Archived to object storage

### 6.3 Query Patterns

```sql
-- Get bullish flow for a symbol
SELECT * FROM option_events
WHERE symbol = 'AAPL'
  AND event_type IN ('BuyCall', 'SellPut')
  AND recorded_at > NOW() - INTERVAL '1 hour'
ORDER BY score DESC;

-- Get high-premium unusual activity
SELECT * FROM recent_option_events
WHERE net_premium_transacted > 100000
  AND 'U002' = ANY(qualification_codes)
ORDER BY recorded_at DESC
LIMIT 50;
```

---

## 7. Key Design Decisions

### 7.1 Why Cloudflare Workers?

| Requirement | Solution |
|-------------|----------|
| Low latency globally | Edge computing (200+ locations) |
| Runs every minute | Native cron triggers |
| Long-running jobs | Workflows with automatic retries |
| State between cycles | KV cache + Durable Objects |

### 7.2 Why Not Stream Processing?

We considered Kafka/Flink but chose batch processing because:

1. **Data source limitation**: Alpha Vantage provides snapshots, not streams
2. **Cost efficiency**: Cloudflare Workers are cheaper than managed Kafka
3. **Simplicity**: Minute-level granularity is sufficient for our use case

### 7.3 Why 12 Qualification Codes?

We started with 3 simple rules, but found:

- **False positives** from single conditions
- **Context matters**: ITM options behave differently than OTM
- **Composite signals** are more reliable than single metrics

The 12-code system gives us:
- **Transparency**: Users know *why* something flagged
- **Tunability**: Can adjust thresholds per code
- **Debugging**: Easy to trace qualification paths

### 7.4 Why Dynamic Thresholds?

Fixed thresholds fail across market caps:

```
Fixed $50K threshold:
├── On $20 stock: Flags everything (too sensitive)
├── On $100 stock: About right
└── On $500 stock: Misses everything (not sensitive enough)

Dynamic threshold (scales with price):
├── On $20 stock: $4K threshold
├── On $100 stock: $20K threshold
└── On $500 stock: $100K threshold
```

---

## 8. Challenges & Solutions

### 8.1 Rate Limiting

**Problem**: API provider limits us to 75 requests/minute.

**Solution**:
- Batch symbols (20 per request)
- Prioritize high-interest symbols
- Use Durable Objects for rate limiting

### 8.2 Data Staleness

**Problem**: By the time we process, data may be minutes old.

**Solution**:
- Track `elapsed_seconds` on each event
- Filter out stale events (>5 min) for strategy generation
- Show timestamp to users

### 8.3 False Positives

**Problem**: Market makers and arbitrageurs create noise.

**Solution**:
- Require multiple qualification codes
- Score normalization by market cap
- Filter by net premium threshold

### 8.4 Symbol Coverage

**Problem**: Can't scan all 8,000+ symbols every minute.

**Solution**:
- Random sampling ensures coverage over time
- User watchlists get priority (75% capacity)
- Focus on liquid, optionable symbols

---

## Summary

Our Option Flow Engine:

1. **Ingests** real-time options data for 300 symbols/minute
2. **Compares** each cycle against cached previous data
3. **Labels** unusual activity with 12 qualification codes
4. **Scores** options by market-cap-normalized premium
5. **Classifies** event types (BuyCall, SellPut, etc.)
6. **Stores** events in PostgreSQL for analysis
7. **Serves** data to users via API

The key innovations are:
- **Multi-path qualification** (not single-condition triggers)
- **Dynamic thresholds** (scales with stock price)
- **Market-cap normalization** (fair comparison across stocks)
- **Cycle comparison** (detect changes, not absolutes)

This gives us a robust, explainable system for detecting institutional options activity at scale.
