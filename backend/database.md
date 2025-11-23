# Database Schema

Complete database schema for InMoney, auto-generated from `src/supabase/types_db.ts`.

## Database Systems

| System | Purpose |
|--------|---------|
| **Supabase PostgreSQL** | Primary database for all persistent data |
| **Cloudflare KV** | Caching (realtime options, rate limits, search indexes) |
| **Cloudflare R2** | Object storage (strategy P&L charts, leaderboard snapshots) |

---

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CORE ENTITIES                                                               │
│  ├── symbols              Master ticker reference                           │
│  ├── stocks               Stock-specific fundamentals                        │
│  ├── etfs                 ETF-specific data                                  │
│  └── news                 Market news articles                               │
│                                                                              │
│  OPTIONS DATA                                                                │
│  ├── options              Master option contracts                           │
│  ├── option_events        Detected unusual activity                         │
│  ├── option_dailys        Daily option snapshots                            │
│  ├── unusual_options      Flagged unusual options                           │
│  └── options_puts_calls_ratio  Put/call ratios by symbol                   │
│                                                                              │
│  STRATEGY SYSTEM                                                             │
│  ├── strategy_definitions Strategy templates (40+ types)                    │
│  ├── strategies           User/detected strategies                          │
│  ├── strategy_legs        Individual option legs                            │
│  ├── strategy_detections  Links to detected option events                   │
│  ├── strategy_executions  Trade execution records                           │
│  ├── strategy_alerts      Price/Greeks alerts                               │
│  └── strategy_performance_snapshots  P&L tracking                           │
│                                                                              │
│  USER DATA                                                                   │
│  ├── users                User profiles                                     │
│  ├── customers            Stripe customer linkage                           │
│  ├── subscriptions        Subscription status                               │
│  ├── positions            User holdings                                     │
│  ├── holdings             Legacy holdings                                   │
│  ├── symbols_followed     Watchlist                                         │
│  ├── symbols_preferred_polling  Priority scanning                           │
│  ├── user_presets         Saved filters/settings                            │
│  ├── user_portfolio_targets  Portfolio goals                                │
│  ├── user_limits          Usage limits                                      │
│  └── trust_scores         Signal scoring                                    │
│                                                                              │
│  MARKET DATA                                                                 │
│  ├── earning_events       Earnings calendar                                 │
│  ├── symbol_correlations  Symbol pair correlations                          │
│  ├── symbol_price_series  Historical prices                                 │
│  └── ticker_prices        Real-time prices                                  │
│                                                                              │
│  AUTOMATION                                                                  │
│  ├── automations          User automation rules                             │
│  ├── automation_logs      Automation execution logs                         │
│  └── cron_jobs            System cron jobs                                  │
│                                                                              │
│  BILLING                                                                     │
│  ├── products             Stripe products                                   │
│  ├── prices               Stripe prices                                     │
│  └── subscriptions        User subscriptions                                │
│                                                                              │
│  VIEWS                                                                       │
│  ├── bullish_trades       Bullish unusual options                          │
│  ├── bearish_trades       Bearish unusual options                          │
│  ├── extended_unusual_options  Enriched unusual options                    │
│  └── date_calculations_view  Trading day calculations                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### symbols
Master table for all tradeable tickers.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT PK | Ticker symbol (e.g., "AAPL") |
| `name` | TEXT | Company/ETF name |
| `type` | TEXT | "Stock" or "ETF" |
| `exchange` | TEXT | Exchange (NYSE, NASDAQ, etc.) |
| `currency` | TEXT | Trading currency |
| `region` | TEXT | Market region |
| `active` | BOOLEAN | Is actively traded |
| `created_at` | TIMESTAMPTZ | Record creation |

### stocks
Stock-specific fundamental data.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT PK FK→symbols | Ticker symbol |
| `market_capitalization` | BIGINT | Market cap in dollars |
| `pe_ratio` | NUMERIC | Price-to-earnings ratio |
| `peg_ratio` | NUMERIC | PEG ratio |
| `beta` | NUMERIC | Beta coefficient |
| `sector` | TEXT | Business sector |
| `industry` | TEXT | Industry classification |
| `description` | TEXT | Company description |
| `dividend_yield` | NUMERIC | Dividend yield % |
| `ex_dividend_date` | DATE | Ex-dividend date |
| `week_52_high` | NUMERIC | 52-week high |
| `week_52_low` | NUMERIC | 52-week low |
| `day_50_moving_average` | NUMERIC | 50-day MA |
| `day_200_moving_average` | NUMERIC | 200-day MA |
| `analyst_target_price` | NUMERIC | Analyst target |
| `analyst_rating_*` | INTEGER | Analyst ratings breakdown |
| `updated_at` | TIMESTAMPTZ | Last update |

### etfs
ETF-specific data.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT PK FK→symbols | ETF symbol |
| `net_assets` | BIGINT | Total AUM |
| `net_expense_ratio` | NUMERIC | Expense ratio |
| `portfolio_turnover` | NUMERIC | Turnover rate |
| `dividend_yield` | NUMERIC | Distribution yield |
| `inception_date` | DATE | Fund inception |
| `leveraged` | BOOLEAN | Is leveraged ETF |
| `asset_allocate_to_*` | NUMERIC | Asset allocation % |
| `updated_at` | TIMESTAMPTZ | Last update |

### etf_holdings_allocations
ETF holdings breakdown.

| Column | Type | Description |
|--------|------|-------------|
| `etf_symbol` | TEXT FK→etfs | ETF symbol |
| `symbol` | TEXT FK→symbols | Holding symbol |
| `weight` | NUMERIC | Weight in portfolio % |

### etf_sectors_allocations
ETF sector breakdown.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT FK→etfs | ETF symbol |
| `sector` | TEXT | Sector name |
| `weight` | NUMERIC | Weight % |

---

## Options Tables

### options
Master table for option contracts.

| Column | Type | Description |
|--------|------|-------------|
| `option_id` | TEXT PK | OCC format ID (e.g., "AAPL240119C00150000") |
| `symbol` | TEXT FK→symbols | Underlying symbol |
| `exp_date` | DATE | Expiration date |
| `strike` | NUMERIC | Strike price |
| `o_type` | TEXT | "call" or "put" |

### option_events
Core table for detected unusual options activity.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Event ID |
| `option_id` | TEXT FK→options | Option contract |
| `event_type` | TEXT | BuyCall, SellCall, BuyPut, SellPut, Askside, Bidside |
| `volume` | INTEGER | Trade volume |
| `net_premium_transacted` | NUMERIC | Premium in dollars |
| `last_price` | NUMERIC | Last traded price |
| `mark_price` | NUMERIC | Mid-point price |
| `bid_price` | NUMERIC | Bid price |
| `ask_price` | NUMERIC | Ask price |
| `bid_size` | INTEGER | Bid size |
| `ask_size` | INTEGER | Ask size |
| `open_int` | INTEGER | Open interest |
| `last_stock_price` | NUMERIC | Underlying price |
| `score` | NUMERIC | Unusual score |
| `elapsed_seconds` | INTEGER | Time since event |
| `iv` | NUMERIC | Implied volatility |
| `delta` | NUMERIC | Delta |
| `gamma` | NUMERIC | Gamma |
| `theta` | NUMERIC | Theta |
| `vega` | NUMERIC | Vega |
| `rho` | NUMERIC | Rho |
| `date_traded` | DATE | Trade date |
| `recorded_at` | TIMESTAMPTZ | Detection time |

### option_dailys
Daily option snapshots for historical analysis.

| Column | Type | Description |
|--------|------|-------------|
| `option_id` | TEXT FK→options | Option contract |
| `date_traded` | DATE | Trading date |
| `last_price` | NUMERIC | Closing price |
| `volume` | INTEGER | Daily volume |
| `open_interest` | INTEGER | End-of-day OI |
| `iv` | TEXT | Implied volatility |
| `delta` | NUMERIC | Delta |
| `gamma` | NUMERIC | Gamma |
| `theta` | NUMERIC | Theta |
| `vega` | NUMERIC | Vega |

### unusual_options
Flagged unusual options (legacy, being replaced by option_events).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Record ID |
| `option_id` | TEXT FK→options | Option contract |
| `symbol` | TEXT FK→symbols | Underlying symbol |
| `strike` | NUMERIC | Strike price |
| `exp_date` | DATE | Expiration |
| `o_type` | TEXT | call/put |
| `option_type` | TEXT | Bullish/Bearish classification |
| `volume` | INTEGER | Volume |
| `open_int` | INTEGER | Open interest |
| `vol_oi` | NUMERIC | Volume/OI ratio |
| `last` | NUMERIC | Last price |
| `bid` | NUMERIC | Bid |
| `ask` | NUMERIC | Ask |
| `mark` | NUMERIC | Mark |
| `price` | NUMERIC | Stock price |
| `net_premium_transacted` | NUMERIC | Premium |
| `delta` | NUMERIC | Delta |
| `iv` | TEXT | IV |
| `date_traded` | DATE | Trade date |
| `time_traded` | TIME | Trade time |

### options_puts_calls_ratio
Historical put/call ratios by symbol.

| Column | Type | Description |
|--------|------|-------------|
| `symbol` | TEXT FK→symbols | Ticker |
| `date_traded` | DATE | Trading date |
| `expiration_date` | DATE | Expiration being tracked |
| `dte` | INTEGER | Days to expiration |
| `calls_volume` | INTEGER | Call volume |
| `puts_volume` | INTEGER | Put volume |
| `calls_open_interest` | INTEGER | Call OI |
| `puts_open_interest` | INTEGER | Put OI |
| `created_at` | TIMESTAMPTZ | Record creation |

---

## Strategy System

### strategy_definitions
Pre-defined strategy templates (40+ types).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Definition ID |
| `name` | TEXT | Strategy name (e.g., "Bull Call Spread") |
| `description` | TEXT | Strategy description |
| `sentiment` | TEXT | bullish, bearish, neutral |
| `risk` | TEXT | limited, unlimited |
| `reward` | TEXT | limited, unlimited |
| `is_multi_leg` | BOOLEAN | Has multiple legs |
| `include_stock_leg` | BOOLEAN | Includes stock position |
| `created_at` | TIMESTAMPTZ | Creation time |

### strategies
User-created or detected strategies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Strategy ID |
| `user_id` | UUID FK→users | Owner (null if detected) |
| `strategy_definition_id` | UUID FK→strategy_definitions | Strategy type |
| `symbol` | TEXT FK→symbols | Underlying |
| `name` | TEXT | Strategy name |
| `source` | ENUM | "user", "detected", "imported" |
| `current_stock_price` | NUMERIC | Entry stock price |
| `entry_date` | DATE | Entry date |
| `exit_date` | DATE | Exit date (if closed) |
| `earliest_exp_date` | DATE | Nearest expiration |
| `final_exp_date` | DATE | Furthest expiration |
| `size` | INTEGER | Position size |
| `is_debit` | BOOLEAN | Net debit position |
| `net_premium` | NUMERIC | Net premium paid/received |
| `total_premium_paid` | NUMERIC | Total paid |
| `total_premium_received` | NUMERIC | Total received |
| `max_expected_profit` | NUMERIC | Max profit |
| `max_expected_loss` | NUMERIC | Max loss |
| `realized_pnl` | NUMERIC | Realized P&L |
| `unrealized_pnl` | NUMERIC | Unrealized P&L |
| `detection_confidence` | NUMERIC | Detection confidence |
| `r2_object_key` | TEXT | R2 key for P&L chart |
| `created_at` | TIMESTAMPTZ | Creation time |

### strategy_legs
Individual legs of a strategy.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Leg ID |
| `strategy_id` | UUID FK→strategies | Parent strategy |
| `option_id` | TEXT FK→options | Option contract |
| `option_event_id` | UUID FK→option_events | Detected event |
| `symbol` | TEXT FK→symbols | Underlying |
| `instrument_type` | ENUM | "option", "stock" |
| `action` | ENUM | "buy", "sell" |
| `leg_position` | TEXT | Position label |
| `size` | INTEGER | Contracts |
| `lot_size` | INTEGER | Multiplier (100) |
| `stock_quantity` | INTEGER | Stock shares (if stock leg) |
| `stock_price` | NUMERIC | Stock price |
| `last_price` | NUMERIC | Option price |
| `mark_price` | NUMERIC | Mark price |
| `bid_price` | NUMERIC | Bid |
| `ask_price` | NUMERIC | Ask |
| `bid_size` | INTEGER | Bid size |
| `ask_size` | INTEGER | Ask size |
| `volume` | INTEGER | Volume |
| `open_int` | INTEGER | Open interest |
| `iv` | NUMERIC | IV |
| `delta` | NUMERIC | Delta |
| `gamma` | NUMERIC | Gamma |
| `theta` | NUMERIC | Theta |
| `vega` | NUMERIC | Vega |
| `rho` | NUMERIC | Rho |
| `created_at` | TIMESTAMPTZ | Creation time |

### strategy_detections
Links detected strategies to option events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Detection ID |
| `strategy_id` | UUID FK→strategies | Strategy |
| `option_event_id` | UUID FK→option_events | Event |
| `created_at` | TIMESTAMPTZ | Detection time |

### strategy_executions
Trade execution records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Execution ID |
| `strategy_id` | UUID FK→strategies | Strategy |
| `user_id` | UUID FK→users | User |
| `execution_type` | ENUM | "open", "close", "roll" |
| `executed_at` | TIMESTAMPTZ | Execution time |
| `quantity` | INTEGER | Quantity |
| `execution_price` | NUMERIC | Fill price |
| `commission_paid` | NUMERIC | Commission |
| `account_id` | TEXT | Brokerage account |
| `brokerage_order_id` | TEXT | Order ID |
| `position_ids` | TEXT[] | Linked positions |
| `notes` | TEXT | Execution notes |
| `created_at` | TIMESTAMPTZ | Record creation |

### strategy_alerts
Price and Greeks alerts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Alert ID |
| `strategy_id` | UUID FK→strategies | Strategy |
| `user_id` | UUID FK→users | User |
| `alert_type` | TEXT | Alert type |
| `message` | TEXT | Alert message |
| `trigger_condition` | JSONB | Trigger rules |
| `threshold_value` | NUMERIC | Threshold |
| `current_value` | NUMERIC | Current value |
| `is_active` | BOOLEAN | Is active |
| `triggered_at` | TIMESTAMPTZ | Trigger time |
| `acknowledged_at` | TIMESTAMPTZ | Acknowledgment |
| `created_at` | TIMESTAMPTZ | Creation time |

### strategy_performance_snapshots
Daily P&L tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Snapshot ID |
| `execution_id` | UUID FK→strategy_executions | Execution |
| `user_id` | UUID FK→users | User |
| `snapshot_date` | DATE | Snapshot date |
| `current_value` | NUMERIC | Position value |
| `realized_pnl` | NUMERIC | Realized P&L |
| `unrealized_pnl` | NUMERIC | Unrealized P&L |
| `total_return_pct` | NUMERIC | Return % |
| `underlying_price` | NUMERIC | Stock price |
| `implied_volatility` | NUMERIC | IV |
| `total_delta` | NUMERIC | Position delta |
| `total_gamma` | NUMERIC | Position gamma |
| `total_theta` | NUMERIC | Position theta |
| `total_vega` | NUMERIC | Position vega |
| `days_in_trade` | INTEGER | Days held |
| `max_profit_reached` | NUMERIC | High water mark |
| `max_loss_reached` | NUMERIC | Low water mark |
| `created_at` | TIMESTAMPTZ | Creation time |

---

## User Tables

### users
User profiles (extends Supabase auth.users).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | User ID (from auth.users) |
| `full_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile image |
| `billing_address` | JSONB | Billing info |
| `payment_method` | JSONB | Payment details |

### customers
Stripe customer linkage.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK FK→users | User ID |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `product_id` | TEXT | Current product |
| `price_id` | TEXT | Current price |

### subscriptions
Subscription status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Stripe subscription ID |
| `user_id` | UUID FK→users | User |
| `status` | ENUM | active, canceled, past_due, etc. |
| `price_id` | TEXT FK→prices | Price |
| `quantity` | INTEGER | Quantity |
| `current_period_start` | TIMESTAMPTZ | Period start |
| `current_period_end` | TIMESTAMPTZ | Period end |
| `cancel_at_period_end` | BOOLEAN | Will cancel |
| `cancel_at` | TIMESTAMPTZ | Cancel date |
| `canceled_at` | TIMESTAMPTZ | Cancellation date |
| `ended_at` | TIMESTAMPTZ | End date |
| `trial_start` | TIMESTAMPTZ | Trial start |
| `trial_end` | TIMESTAMPTZ | Trial end |
| `metadata` | JSONB | Metadata |
| `livemode` | BOOLEAN | Live mode |
| `created` | TIMESTAMPTZ | Creation time |

### positions
User portfolio positions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Position ID |
| `user_id` | UUID FK→users | User |
| `symbol` | TEXT FK→symbols | Symbol |
| `option_id` | TEXT FK→options | Option (if option) |
| `brokerage` | TEXT | Brokerage name |
| `quantity` | INTEGER | Quantity |
| `average_price` | NUMERIC | Avg cost |
| `realized_profit_loss` | NUMERIC | Realized P&L |
| `unrealized_profit_loss` | NUMERIC | Unrealized P&L |
| `closed` | BOOLEAN | Is closed |
| `closed_at` | TIMESTAMPTZ | Close date |
| `payload` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### symbols_followed
User watchlist.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID FK→users | User |
| `symbol` | TEXT FK→symbols | Symbol |
| `followed` | BOOLEAN | Is following |
| `created_at` | TIMESTAMPTZ | Creation time |

### symbols_preferred_polling
Priority symbols for scanning.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Record ID |
| `user_id` | UUID FK→users | User |
| `symbol` | TEXT FK→symbols | Symbol |
| `created_at` | TIMESTAMPTZ | Creation time |

### user_presets
Saved filter presets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Preset ID |
| `user_id` | UUID FK→users | User |
| `key` | TEXT | Preset category |
| `preset_name` | TEXT | Display name |
| `value` | JSONB | Preset data |
| `selected` | BOOLEAN | Is active |
| `last_updated` | TIMESTAMPTZ | Last update |

### user_portfolio_targets
Portfolio goals and constraints.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID PK FK→users | User |
| `account_type` | TEXT | margin, cash, etc. |
| `buying_power` | NUMERIC | Available BP |
| `cash` | NUMERIC | Cash balance |
| `margin` | NUMERIC | Margin used |
| `max_margin` | NUMERIC | Max margin |
| `max_buy_power` | NUMERIC | Max BP |
| `max_loss` | NUMERIC | Max loss limit |
| `expected_return` | NUMERIC | Target return |
| `net_liquidation_value` | NUMERIC | NLV |
| `excess_liquidity` | NUMERIC | Excess liquidity |
| `created_at` | TIMESTAMPTZ | Creation time |

### trust_scores
Signal scoring results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Score ID |
| `user_id` | UUID FK→users | User |
| `filter_id` | INTEGER FK→user_presets | Filter preset |
| `payload` | TEXT | Filter criteria |
| `digest` | JSONB | Score results |
| `workflow_id` | TEXT | Workflow instance |
| `scheduled_at` | TIMESTAMPTZ | Schedule time |
| `time_completed` | TIMESTAMPTZ | Completion time |
| `created_at` | TIMESTAMPTZ | Creation time |

### trust_score_events
Events linked to trust scores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Event ID |
| `trust_score_id` | UUID FK→trust_scores | Trust score |
| `payload` | JSONB | Event data |
| `created_at` | TIMESTAMPTZ | Creation time |

---

## Market Data Tables

### earning_events
Earnings calendar.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Event ID |
| `symbol` | TEXT FK→symbols | Symbol |
| `earning_date` | DATE | Report date |
| `time` | TEXT | BMO, AMC, DMH |
| `eps_forecast` | NUMERIC | EPS estimate |
| `no_of_ests` | INTEGER | Number of estimates |
| `market_cap` | BIGINT | Market cap |
| `name` | TEXT | Company name |

### news
Market news articles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Article ID |
| `title` | TEXT | Headline |
| `url` | TEXT | Article URL |
| `summary` | TEXT | Summary |
| `source` | TEXT | News source |
| `source_domain` | TEXT | Domain |
| `banner_image` | TEXT | Image URL |
| `authors` | TEXT[] | Authors |
| `time_published` | TIMESTAMPTZ | Publish time |
| `overall_sentiment_score` | NUMERIC | Sentiment score |
| `overall_sentiment_label` | TEXT | Sentiment label |
| `ticker_sentiment` | JSONB | Per-ticker sentiment |
| `topics` | JSONB | Topics |
| `category_within_source` | TEXT | Category |
| `created_at` | TIMESTAMPTZ | Import time |
| `updated_at` | TIMESTAMPTZ | Last update |

### symbol_news
Many-to-many news to symbols.

| Column | Type | Description |
|--------|------|-------------|
| `news_id` | UUID FK→news | Article |
| `symbol` | TEXT FK→symbols | Symbol |

### symbol_correlations
Symbol pair correlations.

| Column | Type | Description |
|--------|------|-------------|
| `symbol_pair` | TEXT PK | "AAPL-MSFT" format |
| `symbol1` | TEXT FK→symbols | First symbol |
| `symbol2` | TEXT FK→symbols | Second symbol |
| `pearson_correlation` | NUMERIC | Pearson coefficient |
| `spearman_correlation` | NUMERIC | Spearman coefficient |
| `kendall_correlation` | NUMERIC | Kendall coefficient |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### symbol_price_series
Historical price data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Series ID |
| `symbol` | TEXT FK→symbols | Symbol |
| `data` | JSONB | Price array |
| `last_updated` | TIMESTAMPTZ | Last update |

### ticker_prices
Real-time price snapshots.

| Column | Type | Description |
|--------|------|-------------|
| `stock_symbol` | TEXT FK→symbols | Stock symbol |
| `option_symbol` | TEXT FK→options | Option symbol |
| `instrument` | ENUM | "stock", "option" |
| `price` | NUMERIC | Current price |
| `payload` | JSONB | Full quote data |
| `at_when` | TIMESTAMPTZ | Quote time |

---

## Billing Tables

### products
Stripe products.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Stripe product ID |
| `name` | TEXT | Product name |
| `description` | TEXT | Description |
| `image` | TEXT | Image URL |
| `active` | BOOLEAN | Is active |
| `metadata` | JSONB | Metadata |
| `livemode` | BOOLEAN | Live mode |

### prices
Stripe prices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Stripe price ID |
| `product_id` | TEXT FK→products | Product |
| `type` | ENUM | "one_time", "recurring" |
| `unit_amount` | INTEGER | Price in cents |
| `currency` | TEXT | Currency code |
| `interval` | ENUM | day, week, month, year |
| `interval_count` | INTEGER | Interval count |
| `trial_period_days` | INTEGER | Trial days |
| `active` | BOOLEAN | Is active |
| `description` | TEXT | Description |
| `metadata` | JSONB | Metadata |
| `livemode` | BOOLEAN | Live mode |

---

## Views

### bullish_trades
Filtered view of bullish unusual options.

### bearish_trades
Filtered view of bearish unusual options.

### extended_unusual_options
Enriched unusual options with direction and category.

### date_calculations_view
Trading day calculations (most recent trading day, week start, etc.)

---

## Enums

```typescript
type automation_status = "pending" | "completed" | "failed"
type automation_trigger = "schedule" | "price" | "event"
type automation_type = "alert" | "trade"
type execution_type = "open" | "close" | "roll" | "adjust"
type function_type = "sma" | "ema" | "rsi" | "macd" | "custom"
type instrument_type = "stock" | "option"
type pricing_plan_interval = "day" | "week" | "month" | "year"
type pricing_type = "one_time" | "recurring"
type serie_type = "technical" | "fundamental" | "custom"
type strategy_source = "user" | "detected" | "imported"
type subscription_status = "trialing" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid" | "paused"
type trade_action = "buy" | "sell"
```

---

## Key Relationships

```
symbols (1) ──────< (M) stocks
symbols (1) ──────< (M) etfs
symbols (1) ──────< (M) options
symbols (1) ──────< (M) strategies
symbols (1) ──────< (M) positions
symbols (1) ──────< (M) symbols_followed
symbols (1) ──────< (M) earning_events

options (1) ──────< (M) option_events
options (1) ──────< (M) option_dailys
options (1) ──────< (M) unusual_options
options (1) ──────< (M) strategy_legs

strategies (1) ──────< (M) strategy_legs
strategies (1) ──────< (M) strategy_detections
strategies (1) ──────< (M) strategy_executions
strategies (1) ──────< (M) strategy_alerts

users (1) ──────< (M) positions
users (1) ──────< (M) strategies
users (1) ──────< (M) symbols_followed
users (1) ──────< (M) user_presets
users (1) ──────< (1) customers
users (1) ──────< (M) subscriptions
```

---

## Migrations

**Location**: `supabase/migrations/`

```bash
# Create migration
supabase migration new add_new_table

# Apply locally
supabase db push

# Generate types
supabase gen types typescript --linked > src/supabase/types_db.ts
```
