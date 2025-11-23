# Database

Database schema and patterns for InMoney.

## Database Systems

### Supabase PostgreSQL (Primary)
- User data & authentication
- Options and option events
- Market listings and company data
- Strategies and user content
- Persistent data

### Cloudflare KV (Cache)
- Realtime options cache (5-10 min TTL)
- Rate limiting counters
- Search indexes
- Session data

### Cloudflare R2 (Object Storage)
- Leaderboard JSON snapshots
- Large data exports

---

## Core Schema

### symbols

Master table for all tradeable symbols.

```sql
CREATE TABLE symbols (
  symbol TEXT PRIMARY KEY,
  company_name TEXT,
  asset_type TEXT NOT NULL,          -- 'STOCK', 'ETF'
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  pe_ratio NUMERIC,
  peg_ratio NUMERIC,
  beta NUMERIC,
  dividend_yield NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_symbols_asset_type ON symbols(asset_type);
CREATE INDEX idx_symbols_sector ON symbols(sector);
CREATE INDEX idx_symbols_market_cap ON symbols(market_cap);
```

### market_listings

Available market listings for scanning.

```sql
CREATE TABLE market_listings (
  symbol TEXT PRIMARY KEY REFERENCES symbols(symbol),
  asset_type TEXT NOT NULL,
  exchange TEXT,
  market_cap BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_listings_active ON market_listings(is_active);
CREATE INDEX idx_market_listings_asset_type ON market_listings(asset_type);
```

### company_snapshots

Company fundamental data snapshots.

```sql
CREATE TABLE company_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL REFERENCES symbols(symbol),
  snapshot_date DATE NOT NULL,
  market_cap BIGINT,
  pe_ratio NUMERIC,
  peg_ratio NUMERIC,
  eps NUMERIC,
  revenue BIGINT,
  gross_profit BIGINT,
  ebitda BIGINT,
  beta NUMERIC,
  dividend_yield NUMERIC,
  fifty_two_week_high NUMERIC,
  fifty_two_week_low NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, snapshot_date)
);

CREATE INDEX idx_company_snapshots_symbol ON company_snapshots(symbol);
CREATE INDEX idx_company_snapshots_date ON company_snapshots(snapshot_date);
```

### etf_profiles

ETF-specific profile data.

```sql
CREATE TABLE etf_profiles (
  symbol TEXT PRIMARY KEY REFERENCES symbols(symbol),
  etf_name TEXT,
  asset_class TEXT,
  expense_ratio NUMERIC,
  aum BIGINT,
  inception_date DATE,
  holdings_count INTEGER,
  top_holdings JSONB,
  sector_weights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Options Schema

### options

Master table for option contracts.

```sql
CREATE TABLE options (
  option_id TEXT PRIMARY KEY,        -- OCC format: AAPL240119C00150000
  symbol TEXT NOT NULL REFERENCES symbols(symbol),
  exp_date DATE NOT NULL,
  strike NUMERIC NOT NULL,
  o_type TEXT NOT NULL,              -- 'call' or 'put'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_options_symbol ON options(symbol);
CREATE INDEX idx_options_exp_date ON options(exp_date);
CREATE INDEX idx_options_symbol_exp ON options(symbol, exp_date);
```

### option_events

Individual option activity events (core of Option Flow Engine).

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
  qualification_codes TEXT[],        -- Array of U001-U012 codes
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_option_events_option_id ON option_events(option_id);
CREATE INDEX idx_option_events_recorded_at ON option_events(recorded_at DESC);
CREATE INDEX idx_option_events_event_type ON option_events(event_type);
CREATE INDEX idx_option_events_score ON option_events(score DESC);
```

### recent_option_events (Materialized View)

Fast access to recent events with joined data.

```sql
CREATE MATERIALIZED VIEW recent_option_events AS
SELECT
  oe.id,
  oe.option_id,
  oe.event_type,
  oe.volume,
  oe.net_premium_transacted,
  oe.last_price,
  oe.mark,
  oe.bid,
  oe.ask,
  oe.bid_size,
  oe.ask_size,
  oe.open_int,
  oe.last_stock_price,
  oe.score,
  oe.moneyness,
  oe.elapsed_seconds,
  oe.iv, oe.delta, oe.gamma, oe.vega, oe.theta, oe.rho,
  oe.qualification_codes,
  oe.recorded_at,
  o.symbol,
  o.exp_date,
  o.strike,
  o.o_type,
  s.company_name,
  s.market_cap,
  s.sector,
  s.pe_ratio,
  s.beta
FROM option_events oe
JOIN options o ON oe.option_id = o.option_id
JOIN symbols s ON o.symbol = s.symbol
WHERE oe.recorded_at > NOW() - INTERVAL '24 hours';

CREATE UNIQUE INDEX idx_recent_events_id ON recent_option_events(id);
CREATE INDEX idx_recent_events_symbol ON recent_option_events(symbol);
CREATE INDEX idx_recent_events_recorded_at ON recent_option_events(recorded_at DESC);
CREATE INDEX idx_recent_events_event_type ON recent_option_events(event_type);

-- Refresh every 5 minutes via pg_cron or Supabase scheduled function
```

### unusual_options_leaderboard

Persisted leaderboard snapshots.

```sql
CREATE TABLE unusual_options_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL REFERENCES symbols(symbol),
  asset_type TEXT NOT NULL,
  total_volume INTEGER,
  total_premium NUMERIC,
  call_volume INTEGER,
  put_volume INTEGER,
  call_premium NUMERIC,
  put_premium NUMERIC,
  bullish_score NUMERIC,
  bearish_score NUMERIC,
  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_symbol ON unusual_options_leaderboard(symbol);
CREATE INDEX idx_leaderboard_snapshot ON unusual_options_leaderboard(snapshot_time DESC);
```

### trust_scores

Calculated trust scores for option signals.

```sql
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  filter_payload JSONB NOT NULL,     -- User's filter criteria
  score NUMERIC,
  event_count INTEGER,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
```

---

## User Schema

### profiles (extends auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- 'free', 'pro', 'premium'
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_stripe ON profiles(stripe_customer_id);
```

### stripe_customers

Stripe customer linkage.

```sql
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT NOT NULL UNIQUE,
  subscription_status TEXT,          -- 'active', 'canceled', 'past_due'
  subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);
```

### user_watchlists

User's watched symbols.

```sql
CREATE TABLE user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT 'Default',
  symbols TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON user_watchlists(user_id);
```

### user_preferences

User settings and preferences.

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  default_filters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Market Data Schema

### earnings

Upcoming earnings calendar.

```sql
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL REFERENCES symbols(symbol),
  report_date DATE NOT NULL,
  fiscal_quarter TEXT,
  estimate_eps NUMERIC,
  actual_eps NUMERIC,
  estimate_revenue BIGINT,
  actual_revenue BIGINT,
  report_time TEXT,                  -- 'BMO' (before), 'AMC' (after), 'DMH' (during)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, report_date)
);

CREATE INDEX idx_earnings_date ON earnings(report_date);
CREATE INDEX idx_earnings_symbol ON earnings(symbol);
```

---

## Row Level Security (RLS)

### User Data Policies

```sql
-- Enable RLS on user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Watchlists: Users can only access their own watchlists
CREATE POLICY "Users can view own watchlists"
  ON user_watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists"
  ON user_watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
  ON user_watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
  ON user_watchlists FOR DELETE
  USING (auth.uid() = user_id);
```

### Public Data Policies

```sql
-- Market data is publicly readable
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Symbols are publicly readable"
  ON symbols FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Options are publicly readable"
  ON options FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Option events are publicly readable"
  ON option_events FOR SELECT TO authenticated
  USING (true);
```

---

## Query Patterns

### Using Supabase Client (from Workers)

```typescript
import { getSupabaseAdmin } from '../configs';

// Select with joins
const { data, error } = await getSupabaseAdmin(env)
  .from('recent_option_events')
  .select('*')
  .eq('symbol', 'AAPL')
  .gte('recorded_at', new Date(Date.now() - 3600000).toISOString())
  .order('score', { ascending: false })
  .limit(50);

// Upsert options
await getSupabaseAdmin(env)
  .from('options')
  .upsert(records, { onConflict: 'option_id' });

// Insert events
await getSupabaseAdmin(env)
  .from('option_events')
  .insert(events);

// Complex filtering
const { data } = await getSupabaseAdmin(env)
  .from('recent_option_events')
  .select('*')
  .in('event_type', ['BuyCall', 'SellPut'])
  .gte('net_premium_transacted', 50000)
  .gte('volume', 100)
  .order('recorded_at', { ascending: false });
```

### Option Events Query Builder

```typescript
// src/utils/option-events-filter-handler.ts
export function buildOptionEventsQuery(
  client: SupabaseClient,
  filters: OptionEventFilters
) {
  let query = client.from('recent_option_events').select('*');

  if (filters.symbols?.length) {
    query = query.in('symbol', filters.symbols);
  }
  if (filters.eventTypes?.length) {
    query = query.in('event_type', filters.eventTypes);
  }
  if (filters.minPremium) {
    query = query.gte('net_premium_transacted', filters.minPremium);
  }
  if (filters.minVolume) {
    query = query.gte('volume', filters.minVolume);
  }
  if (filters.minMoneyness) {
    query = query.gte('moneyness', filters.minMoneyness);
  }
  if (filters.maxMoneyness) {
    query = query.lte('moneyness', filters.maxMoneyness);
  }

  return query.order('recorded_at', { ascending: false });
}
```

---

## Migrations

### Location
`supabase/migrations/`

### Commands

```bash
# Create new migration
supabase migration new add_qualification_codes

# Apply migrations locally
supabase db push

# Apply to production
supabase db push --linked

# Generate types from schema
supabase gen types typescript --linked > src/supabase/types_db.ts
```

### Migration Naming Convention
```
YYYYMMDDHHMMSS_description.sql
```

Example:
```
20241115120000_add_option_events_table.sql
20241116090000_add_qualification_codes_column.sql
20241117150000_create_recent_events_view.sql
```

---

## Performance Optimization

### Indexes
- Primary keys on all tables
- Foreign key indexes for joins
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Materialized Views
- `recent_option_events`: Refreshed every 5 minutes
- Pre-joined data for fast API responses

### Caching Strategy
- KV cache for realtime options (5-10 min TTL)
- Edge caching for leaderboard data
- Client-side caching in Angular

### Partitioning (Future)
```sql
-- Consider partitioning option_events by month for scale
CREATE TABLE option_events (
  ...
) PARTITION BY RANGE (recorded_at);

CREATE TABLE option_events_2024_11 PARTITION OF option_events
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
```
