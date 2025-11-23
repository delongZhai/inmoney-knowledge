# Option Flow Engine

The Option Flow Engine is InMoney's core system for detecting unusual options activity, labeling options with qualification codes, and generating trading insights.

## Overview

```mermaid
graph LR
    subgraph "Data Ingestion"
        A[Alpha Vantage API] --> B[GetRealtimeOptions]
        B --> C[Raw Options Data]
    end

    subgraph "Processing"
        C --> D[LeaderboardEntry]
        D --> E{qualify()}
        E -->|Pass| F[calculateScore]
        E -->|Fail| G[Discard]
    end

    subgraph "Storage"
        F --> H[options table]
        F --> I[option_events table]
    end

    subgraph "Analysis"
        I --> J[Strategy Generator]
        I --> K[Trust Score Calculator]
        I --> L[Leaderboard]
    end
```

---

## 1. Data Ingestion

### Source: Alpha Vantage API

Options data is fetched from Alpha Vantage's realtime options endpoint.

**Location**: `src/market-data/functions.ts`

### Data Structure (Raw)

```typescript
interface RealtimeOption {
  symbol: string;              // Underlying ticker (e.g., "AAPL")
  contractID: string;          // OCC format (e.g., "AAPL240119C00150000")
  expiration: string;          // ISO date (e.g., "2024-01-19")
  strike: number;              // Strike price
  type: 'call' | 'put';        // Option type
  last: number;                // Last traded price
  mark: number;                // Mid-point of bid/ask
  bid: number;                 // Best bid
  bid_size: number;            // Bid size (contracts)
  ask: number;                 // Best ask
  ask_size: number;            // Ask size (contracts)
  volume: number;              // Daily volume
  open_interest: number;       // Open interest
  date: string;                // Trade timestamp
  implied_volatility?: number; // IV (when available)
  delta?: number;              // Delta greek
  gamma?: number;              // Gamma greek
  vega?: number;               // Vega greek
  theta?: number;              // Theta greek
  rho?: number;                // Rho greek
}
```

### Ingestion Route

**Location**: `src/routes/get-realtime-options.ts`

```typescript
export class GetRealtimeOptions extends OpenAPIRoute {
  static async request(env: Env, ctx: ExecutionContext, symbol: string) {
    const alphaVantage = getAlphaVantage(env);
    const data = await alphaVantage.getRealtimeOptions(symbol);

    // Validate response with type guard
    if (!isRealtimeOption(data)) {
      throw new Error('Invalid options data');
    }

    return data;
  }
}
```

### Ingestion Workflow

**Location**: `src/workflows/get-next-symbols-for-unusual-options-detection.ts`

The orchestrator workflow:
1. Checks if market is open
2. Fetches 800 random stocks + 100 ETFs
3. Prioritizes symbols on user watchlists (75% capacity)
4. Creates batches of 20 symbols
5. Processes 300 symbols per minute during market hours (13:00-21:00 UTC)

```typescript
export class GetNextSymbolsForUnusualOptionsDetection extends WorkflowEntrypoint<Env, {}> {
  async run(event: WorkflowEvent<{}>, step: WorkflowStep) {
    // Check market status
    const marketOpen = await step.do('Check market', async () => {
      return getCurrentMarketStatus(this.env);
    });

    if (!marketOpen.isOpen) return { skipped: true };

    // Fetch symbols to scan
    const symbols = await step.do('Get symbols', async () => {
      const client = getSupabaseAdmin(this.env);

      // Get random stocks (800) and ETFs (100)
      const { data: stocks } = await client
        .from('market_listings')
        .select('symbol, market_cap')
        .eq('asset_type', 'STOCK')
        .limit(800);

      const { data: etfs } = await client
        .from('market_listings')
        .select('symbol')
        .eq('asset_type', 'ETF')
        .limit(100);

      return [...stocks, ...etfs];
    });

    // Create batches of 20 and trigger detection workflows
    const batches = chunk(symbols, 20);
    for (const batch of batches.slice(0, 15)) { // 300 symbols max
      await this.env.DETECT_UNUSUAL_OPTIONS_V2.create({
        id: crypto.randomUUID(),
        params: {
          symbols: batch.map(s => s.symbol),
          marketCaps: Object.fromEntries(batch.map(s => [s.symbol, s.market_cap]))
        }
      });
    }
  }
}
```

---

## 2. Labeling System

### Qualification Codes

Options are labeled with qualification codes (U001-U012) based on multi-criteria analysis.

**Location**: `src/durable-objects/realtime-options-leaderboard/leaderboard-stock-entry.ts`

| Code | Name | Criteria | Description |
|------|------|----------|-------------|
| **U001** | High Velocity | `score_by_minute >= 0.0001` | Rapid trading activity |
| **U002** | Significant Premium | `net_premium >= dynamic_threshold` | Large dollar transaction |
| **U003** | High Vol/OI | `volume / open_interest >= 0.5` | Volume exceeds half of OI |
| **U004** | Volume > OI | `volume > open_interest` | Daily volume exceeds total OI |
| **U005** | Size Anomaly | `volume >= bid_size * 3 OR volume >= ask_size * 3` | Unusual size vs quotes |
| **U006** | ATM Position | `abs(1 - moneyness) <= 0.01` | At-the-money (within 1%) |
| **U007** | ITM Position | `moneyness > 1.01` (calls) / `< 0.99` (puts) | In-the-money |
| **U008** | OTM Position | `moneyness < 0.99` (calls) / `> 1.01` (puts) | Out-of-the-money |
| **U009** | Ask-Side Urgency | `last >= ask` | Bought at or above ask |
| **U010** | Bid-Side Urgency | `last <= bid` | Sold at or below bid |
| **U011** | High Volume | `volume >= 1000` | Absolute volume threshold |
| **U012** | ITM Vol/OI | `volume / open_interest >= 0.3` (ITM only) | ITM volume activity |

### Dynamic Premium Threshold

The premium threshold scales with stock price to normalize across different market caps:

```typescript
function calculatePremiumThreshold(stockPrice: number): number {
  const baseThreshold = 10000; // $10,000
  const basePrice = 50;        // $50 stock
  return (stockPrice / basePrice) * baseThreshold;
}

// Examples:
// $50 stock  -> $10,000 threshold
// $100 stock -> $20,000 threshold
// $500 stock -> $100,000 threshold
```

### Qualification Logic

Three distinct paths for qualification:

```typescript
export class LeaderboardStockEntry {
  private qualificationCodes: string[] = [];

  qualify(): boolean {
    this.qualificationCodes = [];

    // Calculate core metrics
    const isHighVelocity = this.score_by_minute >= 0.0001;        // U001
    const hasSignificantPremium = this.netPremium >= this.premiumThreshold; // U002
    const hasHighVolOI = this.volume / this.openInterest >= 0.5; // U003
    const volumeExceedsOI = this.volume > this.openInterest;     // U004
    const hasSizeAnomaly = this.volume >= this.bidSize * 3 ||
                           this.volume >= this.askSize * 3;      // U005

    // Determine moneyness
    const moneyness = this.type === 'call'
      ? this.stockPrice / this.strike
      : this.strike / this.stockPrice;

    const isATM = Math.abs(1 - moneyness) <= 0.01;  // U006
    const isITM = moneyness > 1.01;                  // U007
    const isOTM = moneyness < 0.99;                  // U008

    // Urgency indicators
    const isBuyUrgent = this.last >= this.ask;      // U009
    const isSellUrgent = this.last <= this.bid;     // U010

    // Volume thresholds
    const hasHighVolume = this.volume >= 1000;      // U011
    const hasITMVolOI = isITM && this.volume / this.openInterest >= 0.3; // U012

    // === QUALIFICATION PATHS ===

    // Path 1: High Velocity Trading
    if (isHighVelocity) {
      this.qualificationCodes.push('U001');
      if (hasSignificantPremium) {
        this.qualificationCodes.push('U002');
        return true;  // High velocity + significant premium
      }
      if (hasHighVolOI || volumeExceedsOI || hasSizeAnomaly) {
        if (hasHighVolOI) this.qualificationCodes.push('U003');
        if (volumeExceedsOI) this.qualificationCodes.push('U004');
        if (hasSizeAnomaly) this.qualificationCodes.push('U005');
        return true;  // High velocity + volume anomaly
      }
    }

    // Path 2: ATM Options
    if (isATM) {
      this.qualificationCodes.push('U006');
      if (hasSignificantPremium && (hasHighVolOI || volumeExceedsOI)) {
        this.qualificationCodes.push('U002');
        if (hasHighVolOI) this.qualificationCodes.push('U003');
        if (volumeExceedsOI) this.qualificationCodes.push('U004');
        return true;  // ATM + premium + volume activity
      }
    }

    // Path 3a: ITM Options
    if (isITM) {
      this.qualificationCodes.push('U007');
      if (hasSignificantPremium) {
        this.qualificationCodes.push('U002');
        if (hasITMVolOI || isBuyUrgent || isSellUrgent) {
          if (hasITMVolOI) this.qualificationCodes.push('U012');
          if (isBuyUrgent) this.qualificationCodes.push('U009');
          if (isSellUrgent) this.qualificationCodes.push('U010');
          return true;  // ITM + premium + activity signal
        }
      }
    }

    // Path 3b: OTM Options
    if (isOTM) {
      this.qualificationCodes.push('U008');
      if (hasHighVolOI || volumeExceedsOI) {
        if (hasHighVolOI) this.qualificationCodes.push('U003');
        if (volumeExceedsOI) this.qualificationCodes.push('U004');
        if (hasSignificantPremium || hasHighVolume) {
          if (hasSignificantPremium) this.qualificationCodes.push('U002');
          if (hasHighVolume) this.qualificationCodes.push('U011');
          return true;  // OTM + volume anomaly + size
        }
      }
    }

    return false;  // Does not qualify
  }
}
```

---

## 3. Scoring System

### Score Calculation

**Location**: `src/durable-objects/realtime-options-leaderboard/leaderboard-stock-entry.ts`

```typescript
calculateScore(): { score: number; eventType: EventType; netPremium: number } {
  // Net Premium = Premium per contract * volume * 100 (contract multiplier)
  const netPremium = this.last * this.volume * 100;

  // Score = Market-cap normalized premium (higher = more significant)
  const score = (netPremium / this.marketCap) * 1000;

  // Determine event type based on trade execution
  const eventType = this.classifyEventType();

  return { score, eventType, netPremium };
}

private classifyEventType(): EventType {
  const spread = this.ask - this.bid;
  const spreadSignificant = spread > this.mark * 0.01;  // > 1% of mark

  if (spreadSignificant) {
    // Wide spread - use position relative to bid/ask
    const distanceToAsk = this.ask - this.last;
    const distanceToBid = this.last - this.bid;

    if (this.last >= this.ask) {
      return this.type === 'call' ? 'BuyCall' : 'BuyPut';
    }
    if (this.last <= this.bid) {
      return this.type === 'call' ? 'SellCall' : 'SellPut';
    }
    if (distanceToAsk < distanceToBid) {
      return this.type === 'call' ? 'Askside' : 'Askside';  // Leaning buy
    }
    return this.type === 'call' ? 'Bidside' : 'Bidside';    // Leaning sell
  }

  // Narrow spread - use position relative to mark
  if (this.last >= this.mark) {
    return this.type === 'call' ? 'BuyCall' : 'BuyPut';
  }
  return this.type === 'call' ? 'SellCall' : 'SellPut';
}
```

### Event Types

| Event Type | Description | Sentiment |
|------------|-------------|-----------|
| `BuyCall` | Call bought at/above ask or mark | Bullish |
| `SellCall` | Call sold at/below bid or mark | Bearish |
| `BuyPut` | Put bought at/above ask or mark | Bearish |
| `SellPut` | Put sold at/below bid or mark | Bullish |
| `Askside` | Trade closer to ask (leaning buy) | Neutral-Bullish |
| `Bidside` | Trade closer to bid (leaning sell) | Neutral-Bearish |

---

## 4. Detection Workflow

### DetectUnusualOptionsV2

**Location**: `src/workflows/detect-unusual-options-v2.ts`

```typescript
export class DetectUnusualOptionsV2 extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { symbols, marketCaps } = event.payload;

    // Step 1: Fetch current options data
    const currentData = await step.do('Fetch options', async () => {
      return Promise.all(
        symbols.map(s => GetRealtimeOptions.request(this.env, null, s))
      );
    });

    // Step 2: Get cached previous data for comparison
    const previousData = await step.do('Get cache', async () => {
      const cached = await this.env.REALTIME_OPTIONS_CACHE.get(
        symbols.join(','),
        'json'
      );
      return cached || {};
    });

    // Step 3: Process and qualify options
    const qualifiedOptions = await step.do('Qualify options', async () => {
      const entries: LeaderboardStockEntry[] = [];

      for (const symbolData of currentData) {
        for (const option of symbolData.options) {
          const entry = new LeaderboardStockEntry(
            option,
            marketCaps[symbolData.symbol],
            previousData[option.contractID]
          );

          if (entry.qualify()) {
            entry.calculateScore();
            entries.push(entry);
          }
        }
      }

      // Keep top 1% (minimum 5)
      const topX = computeTopX(entries.length, 5, 0.01);
      return entries
        .sort((a, b) => b.score - a.score)
        .slice(0, topX);
    });

    // Step 4: Update cache
    await step.do('Update cache', async () => {
      const cacheData = {};
      for (const symbolData of currentData) {
        for (const option of symbolData.options) {
          cacheData[option.contractID] = {
            volume: option.volume,
            timestamp: Date.now()
          };
        }
      }
      await this.env.REALTIME_OPTIONS_CACHE.put(
        symbols.join(','),
        JSON.stringify(cacheData),
        { expirationTtl: 600 }  // 10 minutes
      );
    });

    // Step 5: Persist to database
    await step.do('Upsert options', async () => {
      const client = getSupabaseAdmin(this.env);

      // Upsert options master records
      await client.from('options').upsert(
        buildOptionsUpsertRecords(qualifiedOptions),
        { onConflict: 'option_id' }
      );

      // Insert option events
      await client.from('option_events').insert(
        buildOptionEventsInsertPayload(qualifiedOptions)
      );
    });

    // Step 6: Filter to last 5 minutes and generate strategies
    const recentEvents = filterLast5MinutesEvents(qualifiedOptions);

    if (recentEvents.length > 0) {
      await step.do('Generate strategies', async () => {
        const events = mapEntriesToGeneratorEvents(recentEvents);
        await GenerateStrategies.request(this.env, null, events);
      });
    }

    return {
      processed: qualifiedOptions.length,
      strategies: recentEvents.length
    };
  }
}
```

---

## 5. Utility Functions

**Location**: `src/utils/detect-unusual-options.ts`

### computeTopX

Calculates how many options to keep based on percentage with minimum.

```typescript
export function computeTopX(
  totalCount: number,
  minimum: number,
  percentage: number
): number {
  const calculated = Math.ceil(totalCount * percentage);
  return Math.max(minimum, calculated);
}

// Examples:
// computeTopX(1000, 5, 0.01) -> 10 (1% of 1000)
// computeTopX(100, 5, 0.01)  -> 5  (minimum)
// computeTopX(5000, 5, 0.01) -> 50 (1% of 5000)
```

### calculateMoneyness

```typescript
export function calculateMoneyness(
  type: 'call' | 'put',
  stockPrice: number,
  strike: number
): number {
  if (type === 'call') {
    return stockPrice / strike;
    // > 1 = ITM, < 1 = OTM, ~1 = ATM
  }
  return strike / stockPrice;
  // > 1 = ITM, < 1 = OTM, ~1 = ATM
}
```

### filterLast5MinutesEvents

```typescript
export function filterLast5MinutesEvents(
  entries: LeaderboardEntry[],
  minutes: number = 5
): LeaderboardEntry[] {
  const cutoff = Date.now() - minutes * 60 * 1000;
  return entries.filter(e => new Date(e.recorded_at).getTime() > cutoff);
}
```

### buildOptionsUpsertRecords

```typescript
export function buildOptionsUpsertRecords(
  entries: LeaderboardEntry[]
): OptionsRecord[] {
  return entries.map(e => ({
    option_id: e.contractID,
    symbol: e.symbol,
    exp_date: e.expiration,
    strike: e.strike,
    o_type: e.type
  }));
}
```

### buildOptionEventsInsertPayload

```typescript
export function buildOptionEventsInsertPayload(
  entries: LeaderboardEntry[]
): OptionEventRecord[] {
  return entries.map(e => ({
    option_id: e.contractID,
    event_type: e.eventType,
    volume: e.volume,
    net_premium_transacted: e.netPremium,
    last_price: e.last,
    mark: e.mark,
    bid: e.bid,
    ask: e.ask,
    bid_size: e.bidSize,
    ask_size: e.askSize,
    open_int: e.openInterest,
    last_stock_price: e.stockPrice,
    score: e.score,
    moneyness: e.moneyness,
    iv: e.iv,
    delta: e.delta,
    gamma: e.gamma,
    vega: e.vega,
    theta: e.theta,
    rho: e.rho,
    elapsed_seconds: e.elapsedSeconds,
    recorded_at: new Date().toISOString(),
    qualification_codes: e.qualificationCodes
  }));
}
```

---

## 6. Database Schema

### options Table

Master table for option contracts.

```sql
CREATE TABLE options (
  option_id TEXT PRIMARY KEY,        -- OCC format contract ID
  symbol TEXT NOT NULL REFERENCES symbols(symbol),
  exp_date DATE NOT NULL,
  strike NUMERIC NOT NULL,
  o_type TEXT NOT NULL,              -- 'call' or 'put'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_options_symbol ON options(symbol);
CREATE INDEX idx_options_exp_date ON options(exp_date);
```

### option_events Table

Individual option activity events.

```sql
CREATE TABLE option_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id TEXT NOT NULL REFERENCES options(option_id),
  event_type TEXT NOT NULL,          -- BuyCall, SellCall, BuyPut, SellPut, Askside, Bidside
  volume INTEGER NOT NULL,
  net_premium_transacted NUMERIC,
  last_price NUMERIC,
  mark NUMERIC,
  bid NUMERIC,
  ask NUMERIC,
  bid_size INTEGER,
  ask_size INTEGER,
  open_int INTEGER,
  last_stock_price NUMERIC,
  score NUMERIC,
  moneyness NUMERIC,
  elapsed_seconds INTEGER,
  -- Greeks
  iv NUMERIC,
  delta NUMERIC,
  gamma NUMERIC,
  vega NUMERIC,
  theta NUMERIC,
  rho NUMERIC,
  -- Metadata
  qualification_codes TEXT[],
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_option_events_option_id ON option_events(option_id);
CREATE INDEX idx_option_events_recorded_at ON option_events(recorded_at);
CREATE INDEX idx_option_events_event_type ON option_events(event_type);
```

### recent_option_events View

Materialized view for fast querying of recent events.

```sql
CREATE MATERIALIZED VIEW recent_option_events AS
SELECT
  oe.*,
  o.symbol,
  o.exp_date,
  o.strike,
  o.o_type,
  s.company_name,
  s.market_cap,
  s.sector
FROM option_events oe
JOIN options o ON oe.option_id = o.option_id
JOIN symbols s ON o.symbol = s.symbol
WHERE oe.recorded_at > NOW() - INTERVAL '24 hours';

CREATE INDEX idx_recent_events_symbol ON recent_option_events(symbol);
CREATE INDEX idx_recent_events_recorded_at ON recent_option_events(recorded_at);
```

---

## 7. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTION FLOW ENGINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Cron (every minute, market hours)                                          │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────┐                                   │
│  │ GetNextSymbolsForUnusualOptionsDetection │                               │
│  │  - Check market status                │                                   │
│  │  - Select 300 symbols (stocks + ETFs) │                                   │
│  │  - Prioritize watchlist symbols       │                                   │
│  │  - Create batches of 20               │                                   │
│  └──────────────────────────────────────┘                                   │
│         │                                                                    │
│         ▼ (triggers 15 parallel workflows)                                  │
│  ┌──────────────────────────────────────┐                                   │
│  │ DetectUnusualOptionsV2               │                                   │
│  │  1. Fetch realtime options (Alpha Vantage)                               │
│  │  2. Compare with cached previous data │                                   │
│  │  3. Create LeaderboardEntry for each │                                   │
│  │  4. Run qualify() - apply U001-U012  │                                   │
│  │  5. Calculate score and event type   │                                   │
│  │  6. Keep top 1% (min 5)              │                                   │
│  │  7. Update KV cache                   │                                   │
│  │  8. Upsert to options table          │                                   │
│  │  9. Insert to option_events table    │                                   │
│  │  10. Filter last 5 min for strategies│                                   │
│  └──────────────────────────────────────┘                                   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────┐                                   │
│  │ GenerateStrategies                   │                                   │
│  │  - Identify multi-leg combinations   │                                   │
│  │  - Match against 40+ strategy types  │                                   │
│  │  - Calculate P&L profiles            │                                   │
│  └──────────────────────────────────────┘                                   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────┐                                   │
│  │ Database                              │                                   │
│  │  - options: Master contracts         │                                   │
│  │  - option_events: Activity log       │                                   │
│  │  - recent_option_events: 24h view    │                                   │
│  └──────────────────────────────────────┘                                   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────┐                                   │
│  │ Downstream Consumers                  │                                   │
│  │  - Leaderboard API                    │                                   │
│  │  - Trust Score Calculator            │                                   │
│  │  - Insights API                       │                                   │
│  │  - Real-time WebSocket notifications │                                   │
│  └──────────────────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Key Files Reference

| Component | File Path |
|-----------|-----------|
| **Orchestrator Workflow** | `src/workflows/get-next-symbols-for-unusual-options-detection.ts` |
| **Detection Workflow V2** | `src/workflows/detect-unusual-options-v2.ts` |
| **Detection Workflow V1** | `src/workflows/detect-unusual-options.ts` |
| **Leaderboard Entry (Stock)** | `src/durable-objects/realtime-options-leaderboard/leaderboard-stock-entry.ts` |
| **Leaderboard Entry (ETF)** | `src/durable-objects/realtime-options-leaderboard/leaderboard-etf-entry.ts` |
| **Detection Utilities** | `src/utils/detect-unusual-options.ts` |
| **Event Filter Handler** | `src/utils/option-events-filter-handler.ts` |
| **Realtime Options Route** | `src/routes/get-realtime-options.ts` |
| **Strategy Generator** | `src/routes/generate-strategies.ts` |
| **Market Data Functions** | `src/market-data/functions.ts` |
| **Database Types** | `src/supabase/types_db.ts` |
