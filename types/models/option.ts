/**
 * Options-related type definitions
 */

export type OptionType = 'call' | 'put';

export interface OptionGreeks {
  /** Price sensitivity to underlying price */
  delta: number;

  /** Rate of change of delta */
  gamma: number;

  /** Time decay per day */
  theta: number;

  /** Sensitivity to implied volatility */
  vega: number;

  /** Sensitivity to interest rates */
  rho: number;
}

export interface OptionContract {
  /** Unique contract identifier (OCC format) */
  contractId: string;

  /** Underlying ticker symbol */
  symbol: string;

  /** Option type: call or put */
  type: OptionType;

  /** Strike price */
  strike: number;

  /** Expiration date (ISO format) */
  expiration: string;

  /** Bid price */
  bid: number;

  /** Ask price */
  ask: number;

  /** Last traded price */
  last: number;

  /** Trading volume */
  volume: number;

  /** Open interest */
  openInterest: number;

  /** Implied volatility (decimal) */
  impliedVolatility: number;

  /** Option Greeks */
  greeks?: OptionGreeks;

  /** In the money flag */
  inTheMoney?: boolean;
}

export interface OptionsChain {
  /** Underlying ticker symbol */
  symbol: string;

  /** Current underlying price */
  underlyingPrice: number;

  /** Available expiration dates */
  expirations: string[];

  /** Options chains by expiration */
  chains: ExpirationChain[];
}

export interface ExpirationChain {
  /** Expiration date */
  expiration: string;

  /** Days to expiration */
  daysToExpiration: number;

  /** Call options */
  calls: OptionContract[];

  /** Put options */
  puts: OptionContract[];
}

export interface OptionsSnapshot {
  /** Unique snapshot ID */
  id: string;

  /** Underlying ticker symbol */
  symbol: string;

  /** Snapshot timestamp */
  timestamp: string;

  /** Underlying price at snapshot time */
  underlyingPrice: number;

  /** Average implied volatility */
  impliedVolatility: number;

  /** All option contracts in snapshot */
  options: OptionContract[];
}
