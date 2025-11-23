/**
 * Strategy-related type definitions
 */

export type StrategyType =
  | 'single'
  | 'spread'
  | 'straddle'
  | 'strangle'
  | 'iron_condor'
  | 'butterfly'
  | 'covered_call'
  | 'protective_put'
  | 'custom';

export type LegType = 'call' | 'put' | 'stock';
export type LegAction = 'buy' | 'sell';

export interface StrategyLeg {
  /** Type of instrument */
  type: LegType;

  /** Buy or sell */
  action: LegAction;

  /** Strike price (options only) */
  strike?: number;

  /** Expiration date (options only) */
  expiration?: string;

  /** Number of contracts or shares */
  quantity: number;

  /** Entry price */
  price?: number;

  /** Contract ID for tracking */
  contractId?: string;
}

export interface Strategy {
  /** Unique identifier */
  id: string;

  /** Owner user ID */
  userId: string;

  /** User-defined name */
  name: string;

  /** Underlying ticker symbol */
  symbol: string;

  /** Strategy type classification */
  type: StrategyType;

  /** Individual legs of the strategy */
  legs: StrategyLeg[];

  /** User notes */
  notes?: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

export interface StrategyAnalysis {
  /** Maximum possible profit */
  maxProfit: number | 'unlimited';

  /** Maximum possible loss */
  maxLoss: number | 'unlimited';

  /** Break-even price(s) */
  breakeven: number[];

  /** Net debit or credit */
  netPremium: number;

  /** Probability of profit (if calculable) */
  probabilityOfProfit?: number;
}

export interface CreateStrategyRequest {
  name: string;
  symbol: string;
  type: StrategyType;
  legs: Omit<StrategyLeg, 'contractId'>[];
  notes?: string;
}

export interface UpdateStrategyRequest {
  name?: string;
  legs?: Omit<StrategyLeg, 'contractId'>[];
  notes?: string;
}
