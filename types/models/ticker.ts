/**
 * Ticker-related type definitions
 */

export type TickerType = 'stock' | 'etf' | 'index';

export interface Ticker {
  /** Stock ticker symbol (e.g., "AAPL") */
  symbol: string;

  /** Company or fund name */
  name: string;

  /** Exchange where the ticker is listed */
  exchange: string;

  /** Type of security */
  type: TickerType;

  /** Current price */
  price: number;

  /** Price change from previous close */
  change: number;

  /** Percentage change from previous close */
  changePercent: number;

  /** Trading volume */
  volume: number;

  /** Market capitalization */
  marketCap?: number;

  /** 52-week high */
  high52Week?: number;

  /** 52-week low */
  low52Week?: number;

  /** Previous close price */
  previousClose?: number;

  /** Day's high */
  dayHigh?: number;

  /** Day's low */
  dayLow?: number;
}

export interface TickerSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: TickerType;
}

export interface TickerQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}
