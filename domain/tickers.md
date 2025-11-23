# Tickers

How stock tickers work in InMoney.

## Overview

Tickers are the primary entities users track in InMoney. Each ticker represents a publicly traded security.

## Ticker Data Structure

```typescript
interface Ticker {
  symbol: string;        // e.g., "AAPL"
  name: string;          // e.g., "Apple Inc."
  exchange: string;      // e.g., "NASDAQ"
  type: TickerType;      // stock, etf, index
  price: number;         // Current price
  change: number;        // Price change
  changePercent: number; // Percentage change
  volume: number;        // Trading volume
  marketCap: number;     // Market capitalization
  high52Week: number;    // 52-week high
  low52Week: number;     // 52-week low
}

type TickerType = 'stock' | 'etf' | 'index';
```

## Exchanges

| Exchange | Code | Description |
|----------|------|-------------|
| NYSE | NYSE | New York Stock Exchange |
| NASDAQ | NASDAQ | Nasdaq Stock Market |
| AMEX | AMEX | NYSE American |

## Data Refresh

### Real-time Data
- Price updates during market hours
- WebSocket or polling mechanism
- Delayed for free users (if applicable)

### Market Hours
- Pre-market: 4:00 AM - 9:30 AM ET
- Regular: 9:30 AM - 4:00 PM ET
- After-hours: 4:00 PM - 8:00 PM ET

## Ticker Search

Users can search for tickers by:
- Symbol (exact or partial match)
- Company name
- Keywords

## State Management

Tickers are stored in NgRx entity state:

```typescript
interface TickersState extends EntityState<Ticker> {
  selectedSymbol: string | null;
  loading: boolean;
  error: string | null;
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tickers/:symbol` | GET | Get single ticker |
| `/tickers/search` | GET | Search tickers |
| `/tickers/batch` | POST | Get multiple tickers |

## Caching

- Ticker metadata cached for 24 hours
- Price data refreshed based on subscription tier
- Client-side caching for recently viewed tickers
