# Options

Options data structures and concepts in InMoney.

## Overview

Options are derivatives contracts that give the holder the right to buy (call) or sell (put) an underlying asset at a specified price (strike) before a certain date (expiration).

## Data Structures

### Option Contract

```typescript
interface OptionContract {
  contractId: string;       // Unique identifier (OCC format)
  symbol: string;           // Underlying ticker
  type: 'call' | 'put';
  strike: number;
  expiration: string;       // ISO date
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  greeks: OptionGreeks;
}

interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}
```

### Options Chain

```typescript
interface OptionsChain {
  symbol: string;
  underlyingPrice: number;
  expirations: string[];
  chains: ExpirationChain[];
}

interface ExpirationChain {
  expiration: string;
  daysToExpiration: number;
  calls: OptionContract[];
  puts: OptionContract[];
}
```

### Options Snapshot

```typescript
interface OptionsSnapshot {
  id: string;
  symbol: string;
  timestamp: string;
  underlyingPrice: number;
  impliedVolatility: number;
  options: OptionContract[];
}
```

## Contract Identifiers

### OCC Format
Standard options contract symbol format:
```
AAPL  240119C00150000
│     │     │└── Strike price ($150.00)
│     │     └── Option type (C=Call, P=Put)
│     └── Expiration (Jan 19, 2024)
└── Underlying symbol (padded to 6 chars)
```

## Expiration Cycles

### Weekly Options
Expire every Friday.

### Monthly Options
Expire on the third Friday of the month.

### LEAPS
Long-term options with expirations over 1 year.

## Greeks Explained

| Greek | Symbol | Measures | Range |
|-------|--------|----------|-------|
| Delta | Δ | Price sensitivity | -1 to 1 |
| Gamma | Γ | Delta change rate | 0+ |
| Theta | Θ | Time decay | Usually negative |
| Vega | ν | IV sensitivity | 0+ |
| Rho | ρ | Interest rate sensitivity | Varies |

## State Management

Options snapshots stored in NgRx:

```typescript
interface OptionsSnapshotsState extends EntityState<OptionsSnapshot> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/options/:symbol` | GET | Get options chain |
| `/options/:symbol/snapshot` | GET | Get snapshot |
| `/options/:symbol/greeks` | GET | Get Greeks |

## Calculations

### Intrinsic Value
```
Call: max(0, Stock Price - Strike)
Put:  max(0, Strike - Stock Price)
```

### Time Value
```
Option Price - Intrinsic Value
```

### Break-even
```
Call: Strike + Premium
Put:  Strike - Premium
```
