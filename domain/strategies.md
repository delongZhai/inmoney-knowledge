# Strategies

Trading strategies in InMoney.

## Overview

Strategies are combinations of options and/or stock positions designed to achieve specific risk/reward profiles.

## Data Structure

```typescript
interface Strategy {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  type: StrategyType;
  legs: StrategyLeg[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StrategyLeg {
  type: 'call' | 'put' | 'stock';
  action: 'buy' | 'sell';
  strike?: number;        // Options only
  expiration?: string;    // Options only
  quantity: number;
  price?: number;         // Entry price
}

type StrategyType =
  | 'single'       // Single option
  | 'spread'       // Vertical spread
  | 'straddle'     // Same strike, same exp
  | 'strangle'     // Different strikes
  | 'iron_condor'  // 4-leg neutral
  | 'butterfly'    // 3-strike spread
  | 'custom';      // User-defined
```

## Common Strategies

### Bullish Strategies

#### Long Call
- **Setup**: Buy call
- **Max Profit**: Unlimited
- **Max Loss**: Premium paid
- **Outlook**: Strongly bullish

#### Bull Call Spread
- **Setup**: Buy call + Sell higher call
- **Max Profit**: Difference in strikes - Net debit
- **Max Loss**: Net debit
- **Outlook**: Moderately bullish

#### Covered Call
- **Setup**: Own stock + Sell call
- **Max Profit**: Premium + (Strike - Stock price)
- **Max Loss**: Stock price - Premium
- **Outlook**: Neutral to slightly bullish

### Bearish Strategies

#### Long Put
- **Setup**: Buy put
- **Max Profit**: Strike - Premium
- **Max Loss**: Premium paid
- **Outlook**: Strongly bearish

#### Bear Put Spread
- **Setup**: Buy put + Sell lower put
- **Max Profit**: Difference in strikes - Net debit
- **Max Loss**: Net debit
- **Outlook**: Moderately bearish

### Neutral Strategies

#### Iron Condor
- **Setup**: Sell OTM put + Buy further OTM put + Sell OTM call + Buy further OTM call
- **Max Profit**: Net credit
- **Max Loss**: Width of spread - Net credit
- **Outlook**: Low volatility, range-bound

#### Straddle
- **Setup**: Buy call + Buy put (same strike)
- **Max Profit**: Unlimited
- **Max Loss**: Total premium
- **Outlook**: High volatility expected

#### Strangle
- **Setup**: Buy OTM call + Buy OTM put
- **Max Profit**: Unlimited
- **Max Loss**: Total premium
- **Outlook**: High volatility expected

## Strategy Analysis

### Profit/Loss Diagram
Visual representation of P/L at various underlying prices.

### Break-even Points
Price(s) where the strategy neither profits nor loses.

### Risk Metrics
- Max profit
- Max loss
- Probability of profit
- Expected value

## State Management

```typescript
interface StrategiesState extends EntityState<Strategy> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/strategies` | GET | List user strategies |
| `/strategies` | POST | Create strategy |
| `/strategies/:id` | GET | Get strategy |
| `/strategies/:id` | PUT | Update strategy |
| `/strategies/:id` | DELETE | Delete strategy |
