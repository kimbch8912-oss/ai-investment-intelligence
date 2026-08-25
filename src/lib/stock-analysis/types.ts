import type { FundamentalSnapshot } from '../agents/fundamental/types.ts';
import type { GlobalMarketOutput } from '../agents/global-market/types.ts';
import type { KoreaMarketOutput } from '../agents/korea-market/types.ts';
import type { MacroAgentOutput } from '../agents/macro/types.ts';
import type { AgentEvidence } from '../agents/types.ts';

export type StockContextStatus = 'AVAILABLE' | 'PARTIAL' | 'UNKNOWN';
export type StockContextConfidence = number | null;
export type InvestmentView =
  | 'STRONG_INTEREST'
  | 'INTEREST'
  | 'NEUTRAL'
  | 'CAUTION'
  | 'HIGH_RISK'
  | 'UNKNOWN';

/** Read model for the existing M1 assets row; this does not create a stock master. */
export interface AssetRecord {
  id: string;
  symbol: string | null;
  name: string;
  assetType: 'STOCK' | 'ETF' | 'INDEX' | 'BOND' | 'FX' | 'COMMODITY' | 'CRYPTO';
  exchange: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  isActive: boolean;
}

/** Read model for the existing M1 asset_identifiers row. */
export interface AssetIdentifierRecord {
  assetId: string;
  identifierType: string;
  identifierValue: string;
  isActive: boolean;
}

export interface ResolvedStockAsset {
  id: string;
  symbol: string;
  name: string;
  market: string;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  identifiers: readonly AssetIdentifierRecord[];
}

export interface StockAnalysisRequest {
  assetId: string;
  symbol: string;
  market: string;
  analysisTime: string;
  dataAsOfTime: string | null;
}

export interface StockContextBase {
  status: StockContextStatus;
  confidence: StockContextConfidence;
  asOfTime: string | null;
  evidence: readonly AgentEvidence[];
}

export interface UnknownStockContext extends StockContextBase {
  status: 'UNKNOWN';
  confidence: null;
  asOfTime: null;
  evidence: readonly [];
}

export interface PriceContext extends StockContextBase {
  price: number | null;
  volume: number | null;
}

/** Contract only: M5-A does not calculate any of these fields. */
export interface TechnicalContext extends StockContextBase {
  price: TechnicalMetric;
  volume: TechnicalMetric;
  return1D: TechnicalMetric;
  return5D: TechnicalMetric;
  return20D: TechnicalMetric;
  ma20: TechnicalMetric;
  ma60: TechnicalMetric;
  ma120: TechnicalMetric;
  priceVsMa20: TechnicalMetric;
  priceVsMa60: TechnicalMetric;
  priceVsMa120: TechnicalMetric;
  rsi14: TechnicalMetric;
  realizedVolatility: TechnicalMetric;
  drawdown: TechnicalMetric;
  maxDrawdown: TechnicalMetric;
  volumeChange: TechnicalMetric;
  volumeMa20: TechnicalMetric;
  supportLevels: TechnicalMetric;
  resistanceLevels: TechnicalMetric;
}

export type TechnicalMetricStatus = 'VALID' | 'INSUFFICIENT_DATA' | 'INVALID_INPUT' | 'UNKNOWN';
export interface TechnicalMetric { value: number | readonly number[] | null; status: TechnicalMetricStatus; asOfTime: string | null; evidence: readonly AgentEvidence[]; }

export interface FundamentalContext extends StockContextBase {
  snapshot: FundamentalSnapshot | null;
}

export interface IndustryContext extends StockContextBase {
  industry: string | null;
  sector: string | null;
  industryDirection: IndustryDirection;
  industryCycle: IndustryCycle;
  demandState: DemandState;
  supplyState: SupplyState;
  pricingState: PricingState;
  inventoryState: InventoryState;
  capacityState: CapacityState;
  competitiveState: CompetitiveState;
  unknowns: readonly string[];
  configVersion: string;
}

export type IndustryDirection = 'STRONG_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'STRONG_NEGATIVE' | 'UNKNOWN';
export type IndustryCycle = 'EARLY_RECOVERY' | 'EXPANSION' | 'LATE_CYCLE' | 'SLOWDOWN' | 'CONTRACTION' | 'BOTTOMING' | 'UNKNOWN';
export type DemandState = 'ACCELERATING' | 'IMPROVING' | 'STABLE' | 'WEAKENING' | 'CONTRACTING' | 'UNKNOWN';
export type SupplyState = 'TIGHT' | 'BALANCED' | 'LOOSE' | 'OVERSUPPLY' | 'UNKNOWN';
export type PricingState = 'RISING' | 'STABLE' | 'FALLING' | 'UNKNOWN';
export type InventoryState = 'DRAWING' | 'NORMAL' | 'BUILDING' | 'EXCESS' | 'UNKNOWN';
export type CapacityState = 'TIGHT' | 'NORMAL' | 'UNDERUTILIZED' | 'UNKNOWN';
export type CompetitiveState = 'FAVORABLE' | 'NEUTRAL' | 'PRESSURED' | 'UNKNOWN';

export interface KoreaMarketStockContext extends StockContextBase {
  route: 'KOREA';
  market: KoreaMarketOutput | null;
}

export interface GlobalMarketStockContext extends StockContextBase {
  route: 'GLOBAL';
  market: GlobalMarketOutput | null;
}

export type MarketContext = KoreaMarketStockContext | GlobalMarketStockContext | UnknownStockContext;

export interface MacroContext extends StockContextBase {
  macro: MacroAgentOutput | null;
}

export interface NewsContext extends StockContextBase {
  items: readonly unknown[];
  unknowns: readonly string[];
}

export interface ResearchContext extends StockContextBase {
  items: readonly unknown[];
  unknowns: readonly string[];
}

export interface StockContext {
  asset: ResolvedStockAsset;
  priceContext: PriceContext;
  technicalContext: TechnicalContext;
  fundamentalContext: FundamentalContext;
  industryContext: IndustryContext;
  koreaMarketContext: KoreaMarketStockContext | UnknownStockContext;
  globalMarketContext: GlobalMarketStockContext | UnknownStockContext;
  macroContext: MacroContext;
  newsContext: NewsContext;
  researchContext: ResearchContext;
}

/** Future final output. M5-A intentionally provides no aggregation or score. */
export interface StockAnalysisOutput {
  asset: ResolvedStockAsset;
  technical: TechnicalContext;
  fundamental: FundamentalContext;
  industry: IndustryContext;
  macro: MacroContext;
  market: MarketContext;
  news: NewsContext;
  research: ResearchContext;
  risk: UnknownStockContext;
  investmentView: InvestmentView;
  confidence: number | null;
  positiveFactors: readonly string[];
  negativeFactors: readonly string[];
  risks: readonly string[];
  invalidationConditions: readonly string[];
  monitoringPriorities: readonly string[];
  evidence: readonly AgentEvidence[];
  unknowns: readonly string[];
}
