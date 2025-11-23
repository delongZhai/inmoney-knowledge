# Derived Computations to Migrate from Frontend to API

**Related to**: [Current Roadmap - Initiative 3: API Migration Checklist](./current.md#3-conversational-research-interface)

This document details all frontend derived computations that should be moved to `inmoney-api` for:
1. Agent/MCP consumption
2. Mobile app support
3. Consistent business logic across platforms
4. Performance optimization

---

## Table of Contents

1. [High Priority - Statistical Computations](#1-high-priority---statistical-computations)
2. [High Priority - Financial Metrics](#2-high-priority---financial-metrics)
3. [High Priority - Sentiment & Flow Analysis](#3-high-priority---sentiment--flow-analysis)
4. [High Priority - Strategy Ranking](#4-high-priority---strategy-ranking)
5. [Medium Priority - Watchlist Enrichment](#5-medium-priority---watchlist-enrichment)
6. [Medium Priority - Data Grouping & Aggregation](#6-medium-priority---data-grouping--aggregation)
7. [Medium Priority - Options Activity Processing](#7-medium-priority---options-activity-processing)
8. [Medium Priority - Filter Construction](#8-medium-priority---filter-construction)
9. [Medium Priority - Search Indexing](#9-medium-priority---search-indexing)

---

## 1. High Priority - Statistical Computations

### 1.1 Standard Deviation Threshold Filtering

**Current Location**: `apps/inmoney/src/app/utils/std.ts`

**What it does**:
Calculates mean and standard deviation of a dataset, then returns threshold values based on multipliers (-3 to +3 std).

```typescript
// Current frontend implementation
export function filterValuesOnStdThreshold(
  numbers: number[],
  multipliers: StandardDeviationMultiplier[]
): number[] {
  const mean = meanFn(numbers);
  const std = stdFn(numbers, 'unbiased') as number;

  const threshold = [] as number[];

  for (const multiplier of multipliers) {
    threshold.push(mean + multiplier * std);
  }

  return threshold;
}
```

**Used By**:
- Hot expiration dates calculation (`options-snapshot.selectors.ts:40-68`)
- Options filtering by net premium (`options-snapshot.selectors.ts:81-112`)
- Top options activity filtering (`top-options-activity.component.ts:164-167`)

**Why Move to API**:
- Heavy numerical computation on potentially large datasets
- Used for filtering - server can pre-filter before sending data
- Enables caching of thresholds for frequently accessed data

**Proposed API Endpoint**:
```
GET /api/v1/options/snapshots?symbol=AAPL&exp_date=2024-12-20&std_threshold=1
```

**Response Enhancement**:
```json
{
  "data": [...],
  "metadata": {
    "threshold": 150000,
    "mean": 75000,
    "std": 75000,
    "total_before_filter": 500,
    "total_after_filter": 45
  }
}
```

---

### 1.2 Hot Expiration Dates Calculation

**Current Location**: `apps/inmoney/src/app/state/options-snapshot/options-snapshot.selectors.ts:40-68`

**What it does**:
Identifies expiration dates with unusually high activity by counting occurrences and filtering those above mean + 1 std deviation.

```typescript
// Current frontend implementation
export const selectHotExpDates = createSelector(
  selectAllOptionsSnapshots,
  (snapshots) => {
    // Count occurrence of each exp_date
    const expDateCountMap = new Map<string, number>();
    for (const snapshot of snapshots) {
      expDateCountMap.set(
        snapshot.exp_date!,
        (expDateCountMap.get(snapshot.exp_date!) ?? 0) + 1
      );
    }

    const expDateCounts = Array.from(expDateCountMap.values());
    const [threshold] = filterValuesOnStdThreshold(expDateCounts, [1]);

    // Find exp_dates above threshold
    const hotExpDates = Array.from(expDateCountMap.entries())
      .filter(([, count]) => count > threshold)
      .map(([expDate]) => expDate);

    return hotExpDates;
  }
);
```

**Why Move to API**:
- Aggregation operation better suited for database query
- Can be computed once and cached per symbol
- Reduces data transfer (only send counts, not full snapshots)

**Proposed API Endpoint**:
```
GET /api/v1/options/hot-expirations?symbol=AAPL
```

**Response**:
```json
{
  "hot_expirations": ["2024-12-20", "2025-01-17", "2025-03-21"],
  "expiration_counts": {
    "2024-12-20": 245,
    "2025-01-17": 189,
    "2025-03-21": 167
  },
  "threshold": 120,
  "all_expirations": ["2024-12-13", "2024-12-20", ...]
}
```

---

## 2. High Priority - Financial Metrics

### 2.1 Option Moneyness Calculation

**Current Location**: `apps/inmoney/src/app/utils/moneyness.ts`

**What it does**:
Determines if an option is In-The-Money (ITM), At-The-Money (ATM), or Out-of-The-Money (OTM) based on stock price, strike price, and option type.

```typescript
// Current frontend implementation
export function getMoneyness(
  stockPrice: number,
  strikePrice: number,
  optionType: string,
  atmThreshold = 0.01 // 1% threshold for ATM
): Moneyness {
  const percentDiff = Math.abs(stockPrice - strikePrice) / strikePrice;

  if (percentDiff <= atmThreshold) {
    return 'ATM';
  } else if (
    (/c/i.test(optionType) && stockPrice > strikePrice) ||
    (/p/i.test(optionType) && stockPrice < strikePrice)
  ) {
    return 'ITM';
  } else {
    return 'OTM';
  }
}
```

**Why Move to API**:
- Fundamental financial calculation used across the entire app
- Should be computed at data ingestion time and stored
- Enables filtering by moneyness at database level

**Proposed Schema Change**:
Add `moneyness` field to options/flow records computed on insert/update.

---

### 2.2 Breakeven & Margin of Safety Calculation

**Current Location**: `apps/inmoney/src/app/utils/get-breakeven-or-margin-of-safety.ts`

**What it does**:
Complex calculation determining breakeven price OR margin of safety based on:
- Event type (BuyCall, BuyPut, SellCall, SellPut)
- Option type (call/put)
- ITM/OTM status
- Last price and stock price

```typescript
// Current frontend implementation (simplified)
export function getBreakevenOrMarginOfSafetyPrice(event) {
  const { event_type, type, strike, o_type, last_price, last_stock_price } = event;

  const atm = Math.abs((last_stock_price - strike) / last_stock_price) <= 0.005;
  let is_itm = atm ? true : (type === 'call' ? last_stock_price > strike : last_stock_price < strike);

  let breakeven_price, margin_of_safety;

  if (o_type === 'call') {
    if (event_type === 'BuyCall') {
      breakeven_price = last_price + strike;
    } else if (is_itm) {
      breakeven_price = strike;
    } else {
      margin_of_safety = (strike - last_stock_price) / last_stock_price;
    }
  } else if (o_type === 'put') {
    if (event_type === 'BuyPut' || is_itm) {
      breakeven_price = strike - last_price;
    } else {
      margin_of_safety = (strike - last_stock_price) / last_stock_price;
    }
  }

  return {
    use_breakeven_or_mos,
    breakeven_price,
    breakeven: breakeven_price ? (breakeven_price - last_stock_price) / last_stock_price : undefined,
    margin_of_safety,
  };
}
```

**Why Move to API**:
- Complex business logic that should be standardized
- Users may want to filter by breakeven/margin of safety
- Critical for strategy analysis features

**Proposed Schema Enhancement**:
Add computed fields to option events:
```json
{
  "breakeven_price": 155.50,
  "breakeven_pct": 0.035,
  "margin_of_safety": null,
  "metric_type": "breakeven"
}
```

---

### 2.3 Bid-Ask Spread Calculation

**Current Location**: `apps/inmoney/src/app/utils/bid-ask-spread.pipe.ts`

**What it does**:
```typescript
transform(bidPrice: number, askPrice: number): number {
  if (!askPrice) return 0;
  return ((askPrice - bidPrice) / askPrice) * 100;
}
```

**Why Move to API**:
- Simple but frequently calculated
- Useful for filtering "tight spread" options
- Can be pre-computed in data ingestion

---

## 3. High Priority - Sentiment & Flow Analysis

### 3.1 Net Bullishness Score (Time-Weighted)

**Current Location**: `apps/inmoney/src/app/pages/sentiment-trend-by-symbol/sentiment-trend-by-symbol.component.ts:132-188`

**What it does**:
Calculates a time-weighted net bullishness score for each expiration date by:
1. Deduplicating expiration dates
2. Applying time decay weights (1.2x for recent, 0.5x for old)
3. Applying bullish/bearish multipliers based on event type
4. Aggregating scores per expiration

```typescript
// Current frontend implementation
uniqueExpDates = computed(() => {
  const sentimentData = this.sentimentTrend.value();
  const expDates = [...new Set(sentimentData.map((item) => item.exp_date))];

  return expDates.map((expDate) => {
    let netScore = 0;
    const today = new Date();

    sentimentData
      .filter((item) => item.exp_date === expDate)
      .forEach((item) => {
        const daysAgo = Math.floor((today.getTime() - new Date(item.date_traded).getTime()) / (1000 * 60 * 60 * 24));

        // Time weight decay
        let timeWeight = 1.0;
        if (daysAgo > 30) timeWeight = 0.5;
        else if (daysAgo > 7) timeWeight = 0.8;
        else if (daysAgo <= 1) timeWeight = 1.2;

        // Bullish/bearish multiplier
        let multiplier = 1;
        if (item.event_type === 'BuyCall' || item.event_type === 'SellPut') {
          multiplier = 1; // bullish
        } else if (item.event_type === 'SellCall' || item.event_type === 'BuyPut') {
          multiplier = -1; // bearish
        }

        netScore += item.event_count * multiplier * timeWeight;
      });

    return { expDate, netScore: Math.round(netScore) };
  });
});
```

**Why Move to API**:
- Core sentiment analysis business logic
- Should be consistent across all consumers (web, mobile, MCP)
- Enables AI agents to query sentiment directly
- Time weights and multipliers are domain logic

**Proposed API Endpoint**:
```
GET /api/v1/sentiment/by-symbol?symbol=AAPL&days_back=30
```

**Response**:
```json
{
  "symbol": "AAPL",
  "overall_sentiment": "bullish",
  "net_score": 1250,
  "by_expiration": [
    {
      "exp_date": "2024-12-20",
      "net_score": 450,
      "bullish_events": 120,
      "bearish_events": 45
    }
  ],
  "trend": [
    { "date": "2024-12-01", "score": 85, "event_count": 24 }
  ]
}
```

---

### 3.2 Sector/Industry Net Flow Aggregation

**Current Location**: `apps/inmoney/src/app/pages/net-bullish-flow/net-bullish-flow.component.ts:267-369`

**What it does**:
Transforms raw sector/industry flow data into visualization-ready format:
1. Calculates relative market cap scaling
2. Formats currency values
3. Determines color coding based on bullish/bearish + debit flow
4. Groups by sector and sorts by net bullish inflow

```typescript
// Current frontend implementation
transformedSeries = computed(() => {
  const data = this.netFlows.value();
  const min = Math.min(...data.map((item) => item.net_market_cap));

  const result = data.reduce((acc, item) => {
    const transformed = {
      sector: item.sector,
      industry: item.industry,
      total_events: item.total_events,
      net_market_cap: formatShortFormNumber(item.net_market_cap, 'USD'),
      y: item.net_market_cap / min,  // Relative scaling
      color: '#00C805',
      top_symbols: item.top_symbols,
    };

    // Color logic based on bullish AND debit flow direction
    if (item.net_bullish_inflow_outflow > 0) {
      transformed.color = item.net_debit_inflow_outflow > 0 ? '#00C805' : '#4ade80';
    } else {
      transformed.color = item.net_debit_inflow_outflow > 0 ? '#FF4D4D' : '#FF8080';
    }

    // Group by sector
    if (acc[item.sector]) {
      acc[item.sector].push(transformed);
    } else {
      acc[item.sector] = [transformed];
    }

    return acc;
  }, {});

  // Sort each sector by net bullish flow
  Object.values(result).forEach((items) => {
    items.sort((a, b) => b.raw_net_bullish_inflow_outflow - a.raw_net_bullish_inflow_outflow);
  });

  return result;
});
```

**Why Move to API**:
- Complex aggregation better suited for database
- Color coding logic is business rule
- Sorting/grouping should be API-side for large datasets
- MCP/agents need pre-formatted sector analysis

**Proposed API Endpoint**:
```
GET /api/v1/flow/sector-summary?date=2024-12-01
```

**Response**:
```json
{
  "date": "2024-12-01",
  "by_sector": {
    "Technology": {
      "net_bullish_flow": 125000000,
      "net_debit_flow": 85000000,
      "sentiment": "strong_bullish",
      "industries": [
        {
          "industry": "Semiconductors",
          "net_market_cap": 45000000,
          "net_bullish_flow": 32000000,
          "sentiment": "strong_bullish",
          "top_symbols": ["NVDA", "AMD", "AVGO"]
        }
      ]
    }
  }
}
```

---

## 4. High Priority - Strategy Ranking

### 4.1 Strategy Profit/Loss Profile Sorting

**Current Location**: `apps/inmoney/src/app/state/strategy/strategy.selectors.ts:23-59`

**What it does**:
Ranks strategies by counting positive values in their profit/loss profile breakpoints.

```typescript
// Current frontend implementation
function sortByProfitLossProfile(a: Strategy, b: Strategy) {
  return (
    Object.values(b.perContract.profitLossProfile).filter(
      (breakpoint) => breakpoint > 0
    ).length -
    Object.values(a.perContract.profitLossProfile).filter(
      (breakpoint) => breakpoint > 0
    ).length
  );
}

export const selectGoodStrategies = createSelector(
  selectCurrentPlayingSymbol,
  selectAllStrategies,
  (symbol, strategies) =>
    strategies
      .filter((strategy) =>
        Object.keys(strategy.warnings ?? {}).length === 0 &&
        strategy.symbol === symbol
      )
      .sort(sortByProfitLossProfile)
);

export const selectBadStrategies = createSelector(
  selectCurrentPlayingSymbol,
  selectAllStrategies,
  (symbol, strategies) =>
    strategies
      .filter((strategy) =>
        strategy.warnings &&
        Object.keys(strategy.warnings).length > 0 &&
        strategy.symbol === symbol
      )
      .sort(sortByProfitLossProfile)
);
```

**Why Move to API**:
- Strategy generation happens on API already
- Ranking should be included in response
- Reduces client-side computation for large strategy sets
- Enables filtering by strategy quality on server

**Proposed Response Enhancement**:
```json
{
  "strategies": [
    {
      "id": "...",
      "rank": 1,
      "quality_score": 0.85,
      "positive_breakpoints": 5,
      "warnings": [],
      "perContract": {...}
    }
  ],
  "good_strategies_count": 15,
  "bad_strategies_count": 8
}
```

---

## 5. Medium Priority - Watchlist Enrichment

### 5.1 Watchlist Data Merging

**Current Location**: `apps/inmoney/src/app/components/watchlist/watchlist.component.ts:54-161`

**What it does**:
Three separate operations that should be a single enriched endpoint:
1. Count option events by symbol (with filters)
2. Fetch realtime prices for all watchlist symbols
3. Merge data and calculate derived fields (current_price, in_green)
4. Sort by event count

```typescript
// Current frontend - 3 separate resource calls + computed merge
countBySymbol = resource({...});  // Fetch event counts
watchlistResource = resource({...});  // Merge with prices
watchlist = computed(() => {
  const data = this.watchlistResource.value();
  return data?.map((item) => {
    const current_price = item.extended_hours_quote ?? item.close;
    return {
      ...item,
      current_price,
      in_green: current_price >= item.previous_close,
    };
  }).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
});
```

**Why Move to API**:
- Multiple round trips to client
- Price and event count should be single call
- Sorting should be server-side
- Enable push updates for watchlist

**Proposed API Endpoint**:
```
GET /api/v1/user/watchlist/enriched
```

**Response**:
```json
{
  "items": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc",
      "current_price": 185.50,
      "previous_close": 184.20,
      "in_green": true,
      "change_pct": 0.007,
      "event_count": 45,
      "last_event_time": "2024-12-01T15:32:00Z"
    }
  ],
  "total_events_today": 234
}
```

---

## 6. Medium Priority - Data Grouping & Aggregation

### 6.1 Event Grouping by Name/Symbol/Time

**Current Location**: `apps/inmoney/src/app/pages/explorer/explorer.component.ts:210-267`

**What it does**:
Complex event transformation pipeline:
1. Flatten events array
2. Group events by time
3. Split by session date
4. Sort chronologically
5. Mark session boundaries

```typescript
// Current frontend implementation
events = computed(() => {
  const cachedEvents = [...this.cachedEvents()];

  const eventsWithTime = cachedEvents
    .flatMap(({ name, symbol, events }) => {
      // Group events by time
      const eventsByTime = events.reduce((groups, event) => {
        const time = event.recorded_at;
        if (!groups[time]) groups[time] = [];
        groups[time].push(event);
        return groups;
      }, {});

      return Object.entries(eventsByTime).map(([time, timeEvents]) => ({
        name, symbol, events: timeEvents, time,
      }));
    })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Mark session boundaries
  eventsWithTime.forEach((event, index) => {
    if (index < eventsWithTime.length - 1) {
      const currentDate = event.time.split('T')[0];
      const nextDate = eventsWithTime[index + 1].time.split('T')[0];
      event.sessionEndAfterCurrentEvent = currentDate !== nextDate;
    }
  });

  return eventsWithTime;
});
```

**Why Move to API**:
- Server can return pre-grouped data
- Pagination is more efficient with server grouping
- Session boundaries can be computed in query

**Proposed API Enhancement**:
```
GET /api/v1/options/events?group_by=time&include_session_markers=true
```

---

### 6.2 Generic Group-By Utility

**Current Location**: `apps/inmoney/src/app/utils/group-by.pipe.ts`

**What it does**:
Generic grouping function used throughout the app.

```typescript
export function groupBy<T, K extends string | number>(
  value: T[],
  groupby: string | ((item: T) => K)
): Record<K, T[]> {
  // Groups items by key, then sorts keys
}
```

**Why Move to API**:
- Pattern used for multiple endpoints
- Server-side grouping is more efficient for large datasets
- Can leverage database GROUP BY operations

---

## 7. Medium Priority - Options Activity Processing

### 7.1 Options Activity Transformation

**Current Location**: `apps/inmoney/src/app/pages/top-options-activity/top-options-activity.component.ts:155-250`

**What it does**:
Complex transformation of raw options activity:
1. Calculate std-based premium thresholds
2. Map event types to human-readable labels
3. Determine bullish/bearish indicator
4. Calculate distance to strike (ITM/ATM/OTM)
5. Compute volume/open interest ratio
6. Flag "important" events based on thresholds

```typescript
// Current frontend implementation
activities = computed(() => {
  const premiums = this.topOptionsActivity.value()?.map(item => item.net_premium_transacted);
  const [firstThreshold, secondThreshold] = filterValuesOnStdThreshold(premiums, [0, 1]);

  const data = this.topOptionsActivity.value()!.map((item) => {
    // Event type mapping
    let optionType = '', bullish_bearish_indicator = false;
    switch (item.event_type) {
      case 'BuyCall': optionType = 'Buy Call'; bullish_bearish_indicator = true; break;
      case 'BuyPut': optionType = 'Buy Put'; bullish_bearish_indicator = false; break;
      // ...
    }

    // Distance to strike calculation
    const distanceToStrike = (item.option.strike - item.last_stock_price) / item.last_stock_price;

    // ITM/ATM/OTM determination
    let oaitm: 'ITM' | 'ATM' | 'OTM' = 'ATM';
    if (item.option.o_type === 'call') {
      if (Math.round(distanceToStrike * 100) === 0) oaitm = 'ATM';
      else if (distanceToStrike > 0) oaitm = 'OTM';
      else oaitm = 'ITM';
    }
    // ... similar for puts

    const vol_oi = item.volume / item.open_int;

    return {
      ...item,
      option_type: optionType,
      oaitm,
      important: item.net_premium_transacted > secondThreshold ||
                 (vol_oi > 1 && item.net_premium_transacted > firstThreshold),
      vol_oi,
      bullish_bearish_indicator,
    };
  });

  return data;
});
```

**Why Move to API**:
- Significant business logic
- "Important" flag logic should be consistent
- Enables filtering by importance on server
- Threshold calculation duplicated elsewhere

**Proposed API Response**:
```json
{
  "activities": [
    {
      "id": "...",
      "event_type": "BuyCall",
      "event_type_display": "Buy Call",
      "bullish": true,
      "moneyness": "OTM",
      "distance_to_strike_pct": 0.05,
      "vol_oi_ratio": 2.5,
      "importance": "high",
      "net_premium": 250000
    }
  ],
  "thresholds": {
    "mean": 50000,
    "std_1": 125000
  }
}
```

---

## 8. Medium Priority - Filter Construction

### 8.1 Option Events Filter Assembly

**Current Location**: `apps/inmoney/src/app/state/app.selectors.ts:82-185`

**What it does**:
Combines multiple sources into final filter object:
1. User presets
2. Focus mode state
3. Current playing symbol
4. Watchlist symbols
5. DTE conversion

```typescript
// Current frontend implementation
export const selectOptionEventsFilter = createSelector(
  selectAppUserPresetsOptionEventsFilter,
  selectIsInFocusMode,
  selectCurrentPlayingSymbol,
  selectWatchlist,
  (preset, focusMode, currentPlayingSymbol, watchlist): OptionEventsFilter => {
    const config = preset && isOptionEventsFilterConfig(preset.value)
      ? JSON.parse(preset.value)
      : DEFAULT_OPTION_EVENTS_FILTER_CONFIG;

    const filter = { ...DEFAULT_OPTION_EVENTS_FILTER_CONFIG, ...config };

    let focusOnSymbol = null, watchlistOnly = [];
    if (focusMode && currentPlayingSymbol) focusOnSymbol = currentPlayingSymbol;
    if (watchlist.length > 0 && filter.watchlistFilter) {
      watchlistOnly = watchlist.map(({ symbol }) => symbol);
    }

    const result = {
      volumeThreshold: filter.volumeThreshold,
      volumeOpenInterestRatio: filter.volumeOpenInterestRatio ?? 0,
      cutoffTime: filter.cutoffTime,
    };

    if (focusOnSymbol) result.ticker = focusOnSymbol;
    else if (watchlistOnly.length > 0) result.watchlistOnly = watchlistOnly;

    // ... more filter properties

    if (filter.daysToExpiration) {
      result.expiration = getDTEs(filter.daysToExpiration);
    }

    return result;
  }
);
```

**Why Move to API**:
- Filter logic is complex and should be validated server-side
- DTE conversion is server-timezone sensitive
- Watchlist expansion should happen on server
- Enables filter presets to be stored/shared

**Proposed Approach**:
Pass user intent, let API resolve to concrete filter:
```
POST /api/v1/options/events/query
{
  "preset_id": "my-filter",
  "focus_symbol": "AAPL",
  "use_watchlist": true,
  "dte_range": "7-45"
}
```

---

### 8.2 DTE Range Conversion

**Current Location**: `apps/inmoney/src/app/components/option-events-filter/get-dtes.ts`

**What it does**:
Converts DTE (Days To Expiration) numeric values to date ranges.

```typescript
export function getDTEs(timedelta: number | { lt?: number; gt?: number } | null) {
  if (timedelta === 7) {
    return { lt: endOfDay(addDays(new Date(), 7)) };
  } else if (timedelta === 45) {
    return {
      lt: endOfDay(addDays(new Date(), 45)),
      gt: endOfDay(addDays(new Date(), 7)),
    };
  }
  // ... more ranges
}
```

**Why Move to API**:
- Date calculations depend on server timezone (market hours)
- "Today" should be market date, not user's local date
- Consistency across all clients

---

## 9. Medium Priority - Search Indexing

### 9.1 Full-Text Search Index Building

**Current Location**: `apps/inmoney/src/app/services/search.service.ts:92-177`

**What it does**:
Builds Lunr.js search indexes client-side with field boosting, then searches and sorts by relevance.

```typescript
// Current frontend implementation (main thread fallback)
this.engine = lunr((builder) => {
  builder.ref('id');
  builder.field('symbol');
  builder.field('name');
  builder.field('tags');

  data.forEach((index) => {
    this.indexes.set(`${index.id}`, index);
    builder.add({ ...index });
  });
});

// For OSI (Option Symbol Identifier) search
this.engine2 = lunr((builder) => {
  builder.ref('id');
  builder.field('id', { boost: 10 });
  builder.field('symbol', { boost: 5 });
  builder.field('name', { boost: 8 });
  builder.field('tags', { boost: 3 });
  // ...
});
```

**Why Move to API**:
- Index can be pre-built on server
- Enables proper full-text search (PostgreSQL, Meilisearch, etc.)
- Reduces client memory usage
- Better relevance ranking with server-side ML

**Proposed API Endpoint**:
```
GET /api/v1/search?q=apple&type=symbol
GET /api/v1/search/options?symbol=AAPL&q=2024-12
```

---

## Implementation Priority Matrix

| Computation | Priority | Effort | Impact | Dependencies |
|-------------|----------|--------|--------|--------------|
| Std threshold filtering | High | M | High | None |
| Hot expiration dates | High | S | Medium | Std filtering |
| Moneyness calculation | High | S | High | None (schema change) |
| Breakeven/margin of safety | High | M | High | Moneyness |
| Net bullishness score | High | M | High | None |
| Sector flow aggregation | High | L | High | None |
| Strategy ranking | High | S | Medium | Strategy generation |
| Watchlist enrichment | Medium | M | High | None |
| Event grouping | Medium | M | Medium | None |
| Options activity transform | Medium | L | High | Moneyness, std |
| Filter construction | Medium | M | Medium | DTE conversion |
| DTE conversion | Medium | S | Medium | None |
| Search indexing | Medium | L | Medium | None |

---

## Migration Strategy

### Phase 1: Schema Enrichment
Add computed fields to existing data models:
- `moneyness` (ITM/ATM/OTM)
- `bid_ask_spread_pct`
- `breakeven_price`, `margin_of_safety`

### Phase 2: New Aggregation Endpoints
- `/api/v1/options/hot-expirations`
- `/api/v1/sentiment/by-symbol`
- `/api/v1/flow/sector-summary`
- `/api/v1/user/watchlist/enriched`

### Phase 3: Enhanced Existing Endpoints
- Add `std_threshold` parameter to options queries
- Add `importance` field to activities
- Add `rank` and `quality_score` to strategies

### Phase 4: Deprecate Frontend Computation
- Remove utility functions from frontend
- Update components to use API-provided values
- Remove NgRx selectors that duplicate API logic

---

## Notes

- All computations should be idempotent and cacheable
- Consider WebSocket/SSE for real-time computed values
- Document API changes in OpenAPI spec for SDK regeneration
- Maintain backwards compatibility during migration
