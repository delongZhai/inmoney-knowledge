# Options API

Endpoints for options data.

## Get Options Chain

Retrieve the options chain for a ticker.

### Request

`GET /options/:symbol`

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Stock ticker symbol |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| expiration | string | - | Filter by expiration date (YYYY-MM-DD) |
| type | string | - | Filter by type: "call" or "put" |

### Response

#### Success (200)
```json
{
  "data": {
    "symbol": "AAPL",
    "expirations": ["2024-01-19", "2024-01-26"],
    "chain": [
      {
        "expiration": "2024-01-19",
        "calls": [...],
        "puts": [...]
      }
    ]
  }
}
```

---

## Get Options Snapshot

Get a snapshot of options data for analysis.

### Request

`GET /options/:symbol/snapshot`

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Stock ticker symbol |

### Response

#### Success (200)
```json
{
  "data": {
    "symbol": "AAPL",
    "timestamp": "2024-01-15T16:00:00Z",
    "underlyingPrice": 150.00,
    "impliedVolatility": 0.25,
    "options": [...]
  }
}
```

---

## Get Option Greeks

Get Greeks for specific options contracts.

### Request

`GET /options/:symbol/greeks`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| contracts | string | Comma-separated contract IDs |

### Response

#### Success (200)
```json
{
  "data": [
    {
      "contractId": "AAPL240119C00150000",
      "delta": 0.55,
      "gamma": 0.02,
      "theta": -0.05,
      "vega": 0.15,
      "rho": 0.03
    }
  ]
}
```

---

## Query Option Events

Generic query endpoint for the `recent_option_events` materialized view. All query building is done server-side for security and consistency. The frontend sends query intent, and the API constructs and executes the Supabase query.

### Request

`POST /options/events/query`

#### Request Body

```json
{
  "select": ["column1", "column2"],
  "filters": [
    {
      "column": "string",
      "operator": "eq|neq|gt|gte|lt|lte|in|is|like|ilike",
      "value": "any"
    }
  ],
  "order": {
    "column": "string",
    "ascending": true
  },
  "limit": 100,
  "offset": 0
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| select | string[] | No | * | Columns to return |
| filters | FilterCondition[] | No | - | Array of filter conditions (AND logic) |
| order | OrderConfig | No | - | Sorting configuration |
| limit | number | No | 100 | Max results (1-1000) |
| offset | number | No | 0 | Pagination offset |

#### Supported Operators

- `eq` - Equal
- `neq` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `in` - In array
- `is` - Is null/not null
- `like` - Pattern match (case-sensitive)
- `ilike` - Pattern match (case-insensitive)

### Response

#### Success (200)

```json
{
  "data": [...],
  "metadata": {
    "count": 42,
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}
```

#### Error (400)
```json
{
  "error": "Invalid column in filter: invalid_column_name"
}
```

#### Error (500)
```json
{
  "error": "Query execution failed: ..."
}
```

### Available Columns

**Core Fields**: `id`, `option_id`, `symbol`, `name`

**Option Details**: `o_type`, `strike`, `exp_date`

**Pricing**: `last_price`, `mark`, `bid`, `ask`, `bid_size`, `ask_size`, `bid_ask_spread_pct`

**Volume & Interest**: `volume`, `open_int`, `vol_oi`

**Event Details**: `event_type`, `net_premium_transacted`, `score`, `elapsed_seconds`

**Dates**: `date_traded`, `recorded_at`

**Stock Context**: `last_stock_price`, `moneyness`, `intrinsic_value`, `time_value`

**Fundamentals**: `market_capitalization`, `pe_ratio`, `peg_ratio`, `beta`, `currency`, `exchange`, `type`, `sector`, `region`

**ETF-Specific**: `net_assets`, `leveraged`, `asset_allocate_to_bond`, `asset_allocate_to_cash`, `asset_allocate_to_domestic_equities`, `asset_allocate_to_foreign_equities`

### Examples

#### Simple Filter
```json
{
  "filters": [
    { "column": "symbol", "operator": "eq", "value": "AAPL" },
    { "column": "volume", "operator": "gte", "value": 100 }
  ],
  "order": { "column": "recorded_at", "ascending": false },
  "limit": 50
}
```

#### Date Range with Multiple Filters
```json
{
  "select": ["symbol", "volume", "recorded_at", "event_type"],
  "filters": [
    { "column": "volume", "operator": "gte", "value": 100 },
    { "column": "recorded_at", "operator": "lte", "value": "2025-11-24T16:39:47.190Z" },
    { "column": "recorded_at", "operator": "gte", "value": "2025-11-24T05:00:00.000Z" },
    { "column": "event_type", "operator": "in", "value": ["BuyCall", "BuyPut"] },
    { "column": "net_premium_transacted", "operator": "gte", "value": 500000 }
  ],
  "order": { "column": "recorded_at", "ascending": false },
  "limit": 100
}
```

#### Multiple Symbols with Premium Filter
```json
{
  "filters": [
    { "column": "symbol", "operator": "in", "value": ["AAPL", "TSLA", "NVDA"] },
    { "column": "net_premium_transacted", "operator": "gte", "value": 1000000 },
    { "column": "event_type", "operator": "eq", "value": "BuyCall" }
  ],
  "order": { "column": "net_premium_transacted", "ascending": false },
  "limit": 20
}
```

#### Pattern Search
```json
{
  "select": ["symbol", "name", "volume", "net_premium_transacted"],
  "filters": [
    { "column": "name", "operator": "ilike", "value": "%tech%" },
    { "column": "volume", "operator": "gte", "value": 100 }
  ],
  "limit": 30
}
```

### Security & Limits

- ✅ **Column Whitelist**: Only predefined columns can be queried
- ✅ **Operator Validation**: Only safe operators allowed
- ✅ **Type Checking**: Values must match column types
- ✅ **Max Limit**: 1000 records per query
- ✅ **Server-Side Query Building**: Prevents SQL injection
- ✅ **Service Role Only**: Uses Supabase admin client (bypasses RLS)

### Notes

1. **Multiple Filters on Same Column**: You can apply multiple filters to the same column (e.g., date ranges). They are combined with AND logic.

2. **Array Values**: Use the `in` operator with an array value.

3. **Null Checks**: Use the `is` operator with `null` value.

4. **Pattern Matching**: Use `like` (case-sensitive) or `ilike` (case-insensitive) with wildcards (`%`).

5. **Default Behavior**: No `select` returns all columns, no `order` uses database default, no `limit` returns 100 records.
