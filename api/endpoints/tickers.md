# Tickers API

Endpoints for stock ticker data.

## Get Ticker

Retrieve information about a specific ticker.

### Request

`GET /tickers/:symbol`

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Stock ticker symbol (e.g., "AAPL") |

### Response

#### Success (200)
```json
{
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NASDAQ",
    "price": 150.00,
    "change": 2.50,
    "changePercent": 1.69,
    "volume": 50000000,
    "marketCap": 2500000000000
  }
}
```

---

## Search Tickers

Search for tickers by name or symbol.

### Request

`GET /tickers/search`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | required | Search query |
| limit | number | 10 | Max results |

### Response

#### Success (200)
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ"
    }
  ]
}
```

---

## Get Multiple Tickers

Retrieve data for multiple tickers at once.

### Request

`POST /tickers/batch`

#### Request Body
```json
{
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

### Response

#### Success (200)
```json
{
  "data": {
    "AAPL": { ... },
    "GOOGL": { ... },
    "MSFT": { ... }
  }
}
```
