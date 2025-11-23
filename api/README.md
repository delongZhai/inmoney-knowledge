# API Documentation

Complete API reference for the InMoney API.

## Contents

- [Authentication](./authentication.md) - Auth flows with Supabase
- [Endpoints](./endpoints/) - Endpoint-specific documentation
- [OpenAPI](./openapi/) - OpenAPI specifications

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8787` |
| Preview | `https://preview.api.inmoney.app` |
| Production | `https://api.inmoney.app` |

## Authentication

Protected endpoints require a subscription token:

```
x-subscription-token: <token>
```

See [Authentication](./authentication.md) for details.

---

## API Categories Overview

| Category | Prefix | Endpoints | Description |
|----------|--------|-----------|-------------|
| **Payment** | `/pay/*` | 5 | Stripe checkout, billing |
| **Business Logic** | Various | 15 | Core features |
| **Technical Indicators** | `/indicator/*` | 13 | SMA, EMA, RSI, MACD, etc. |
| **Insights** | `/insights/*` | 4 | Options analytics |
| **AI/LLM** | `/llama/*` | 2 | AI-powered analysis |
| **Realtime** | `/realtime/*` | 6 | WebSocket control |
| **Rate-Limited** | `/ratelimited/*` | 17 | External market data |
| **Helpdesk** | `/helpdesk/*` | 4 | GitHub issues |

**Total: 66 endpoints**

---

## Quick Reference

### Payment Routes
```
POST /pay/verify-subscription
GET  /pay/session-status
POST /pay/link-user-with-stripe
POST /pay/create-checkout-session
POST /pay/redirect-billing-portal
```

### Business Logic Routes
```
GET  /search-indexes
GET  /market-schedule
GET  /market-schedule/current-session
GET  /search-indexes/:symbol/options
GET  /leaderboard/unusual-options/date-calculations
GET  /leaderboard/unusual-options/:preset
POST /leaderboard/unusual-options
POST /strategies/generator
POST /predefined/trade-since
GET  /realtime-options/:symbol
GET  /historical-options/:symbol/puts-calls-ratio
GET  /option-history/:option_id
POST /subscriptions/email/feature-updates
POST /candlesticks/:symbol
POST /schedules/trust-scores
```

### Technical Indicator Routes
```
POST /indicator/technical-summary
GET  /indicator/sma/:symbol
GET  /indicator/ema/:symbol
GET  /indicator/vwap/:symbol
GET  /indicator/macd/:symbol
GET  /indicator/stoch/:symbol
GET  /indicator/rsi/:symbol
GET  /indicator/adx/:symbol
GET  /indicator/cci/:symbol
GET  /indicator/aroon/:symbol
GET  /indicator/bbands/:symbol
GET  /indicator/ad/:symbol
GET  /indicator/obv/:symbol
```

### Insights Routes
```
GET /insights/options/top-symbols-traded-last-x-days
GET /insights/options/sentiment-trend-by-symbol/:symbol
GET /insights/options/net-bullish-flows/:symbol
GET /insights/options/popular-price-lines/:symbol
```

### AI/LLM Routes
```
POST /llama/report/strategic-implications
POST /llama/report/strategic-implications/:symbol
```

### Realtime Routes
```
GET  /realtime/unusual-options/status
POST /realtime/unusual-options/start
POST /realtime/unusual-options/stop
GET  /realtime/unusual-options/offline/status
POST /realtime/unusual-options/offline/start
POST /realtime/unusual-options/offline/stop
```

### Rate-Limited Market Data Routes
```
GET  /ratelimited/market-listings
GET  /ratelimited/market-status
GET  /ratelimited/leaderboard/gainers-losers
GET  /ratelimited/company-snapshot/:symbol
GET  /ratelimited/etf-profile/:symbol
GET  /ratelimited/dividends/:symbol
GET  /ratelimited/splits/:symbol
GET  /ratelimited/timeseries/:symbol
POST /ratelimited/timeseries/:symbol
GET  /ratelimited/timeseries/market-price/:symbol
GET  /ratelimited/market-news
GET  /ratelimited/market-news/:symbol
GET  /ratelimited/realtime-prices
GET  /ratelimited/daily-adjusted/:symbol
GET  /ratelimited/historical-options/:symbol
GET  /ratelimited/treasury-rates
GET  /ratelimited/historical-volatility/:symbol
```

### Helpdesk Routes
```
GET  /helpdesk/issues
GET  /helpdesk/issues/:issueId
POST /helpdesk/issues
POST /helpdesk/issues/:issueId/comments
```

### Webhooks
```
POST /webhooks
```

---

## Key Endpoints

### GET `/realtime-options/:symbol`
Get real-time options chain for a symbol.

**Query Parameters**:
- `contract` (optional): Filter to specific contract

**Response**:
```json
{
  "symbol": "AAPL",
  "options": [{
    "contractID": "AAPL240119C00150000",
    "expiration": "2024-01-19",
    "strike": 150,
    "type": "call",
    "last": 5.25,
    "bid": 5.20,
    "ask": 5.30,
    "mark": 5.25,
    "volume": 1500,
    "open_interest": 5000,
    "iv": 0.35,
    "delta": 0.65,
    "gamma": 0.02,
    "theta": -0.15,
    "vega": 0.25,
    "rho": 0.05
  }]
}
```

### POST `/strategies/generator`
Generate multi-leg strategies from option events.

**Request Body**:
```json
{
  "events": [{
    "option_id": "AAPL240119C00150000",
    "event_type": "BuyCall",
    "volume": 1000,
    "net_premium": 50000,
    "strike": 150,
    "exp_date": "2024-01-19",
    "o_type": "call"
  }],
  "filters": {
    "multiLegOnly": true,
    "strategyNames": ["Bull Call Spread"],
    "sentiment": "bullish"
  }
}
```

**Response**:
```json
{
  "strategies": [{
    "name": "Bull Call Spread",
    "symbol": "AAPL",
    "legs": [
      { "action": "buy", "strike": 150, "type": "call" },
      { "action": "sell", "strike": 160, "type": "call" }
    ],
    "max_profit": 800,
    "max_loss": 200
  }]
}
```

### GET `/leaderboard/unusual-options/:preset`
Get unusual options leaderboard.

**Presets**: `today`, `this-week`, `this-month`, `last-30-days`

**Response**:
```json
{
  "data": [{
    "symbol": "AAPL",
    "total_volume": 50000,
    "total_premium": 5000000,
    "call_volume": 30000,
    "put_volume": 20000,
    "bullish_score": 0.6
  }]
}
```

---

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

## Rate Limiting

| Tier | Requests/minute |
|------|-----------------|
| Free | 30 |
| Pro | 120 |
| Premium | 300 |

Headers:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1705345200
```

---

## WebSocket API

### Connection
```
wss://api.inmoney.app/realtime/unusual-options
```

### Messages

**Subscribe**:
```json
{ "type": "subscribe", "symbols": ["AAPL", "MSFT"] }
```

**Event**:
```json
{
  "type": "unusual_option",
  "data": {
    "symbol": "AAPL",
    "option_id": "AAPL240119C00150000",
    "event_type": "BuyCall",
    "volume": 1000,
    "net_premium": 50000
  }
}
```
