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
