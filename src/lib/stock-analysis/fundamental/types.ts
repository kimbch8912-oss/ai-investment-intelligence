import type { AgentEvidence } from '../../agents/types.ts';
import type { FundamentalSnapshot } from '../../agents/fundamental/types.ts';

export type GrowthState = 'STRONG' | 'IMPROVING' | 'STABLE' | 'WEAKENING' | 'WEAK' | 'UNKNOWN';
export type ProfitabilityState = 'STRONG' | 'HEALTHY' | 'NORMAL' | 'WEAK' | 'DETERIORATING' | 'UNKNOWN';
export type CashFlowState = 'STRONG' | 'HEALTHY' | 'WEAK' | 'NEGATIVE' | 'UNKNOWN';
export type BalanceSheetState = 'STRONG' | 'HEALTHY' | 'NORMAL' | 'LEVERAGED' | 'STRESSED' | 'UNKNOWN';
export type ValuationState = 'EXPENSIVE' | 'FAIR' | 'CHEAP' | 'UNKNOWN';
export type EarningsQualityState = 'HIGH' | 'NORMAL' | 'LOW' | 'UNKNOWN';

export interface FundamentalMetrics { revenueGrowth?: number | null; operatingIncomeGrowth?: number | null; netIncomeGrowth?: number | null; epsGrowth?: number | null; operatingMargin?: number | null; netMargin?: number | null; roe?: number | null; operatingCashFlow?: number | null; freeCashFlow?: number | null; freeCashFlowMargin?: number | null; totalDebt?: number | null; cash?: number | null; debtToEquity?: number | null; netDebt?: number | null; pe?: number | null; pb?: number | null; evEbitda?: number | null; previous?: { operatingMargin?: number | null; netMargin?: number | null; roe?: number | null; }; }
export interface ValuationBenchmark { pe?: number | null; pb?: number | null; evEbitda?: number | null; }
export interface StockFundamentalInput { snapshot: FundamentalSnapshot; metrics: FundamentalMetrics; benchmark?: ValuationBenchmark; }
export interface StockFundamentalContext { growthState: GrowthState; profitabilityState: ProfitabilityState; cashFlowState: CashFlowState; balanceSheetState: BalanceSheetState; valuationState: ValuationState; earningsQualityState: EarningsQualityState; confidence: number | null; evidence: readonly AgentEvidence[]; unknowns: readonly string[]; asOfTime: string; configVersion: string; }
