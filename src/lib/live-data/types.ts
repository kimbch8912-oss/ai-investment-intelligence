import type { FundamentalSnapshot } from '../agents/fundamental/types.ts';
import type { GlobalMarketOutput } from '../agents/global-market/types.ts';
import type { KoreaMarketOutput } from '../agents/korea-market/types.ts';
import type { MacroAgentOutput } from '../agents/macro/types.ts';
import type { NewsDocument, NewsEvent } from '../agents/news/types.ts';
import type { ResearchDocument } from '../agents/research/types.ts';
import type { FundamentalMetrics, StockFundamentalContext, ValuationBenchmark } from '../stock-analysis/fundamental/types.ts';
import type { IndustryContextInput } from '../stock-analysis/industry/types.ts';
import type { ResolvedStockAsset } from '../stock-analysis/types.ts';

export type SourceMode = 'FIXTURE' | 'LIVE';
export type SourceStatus = 'READY' | 'PARTIAL' | 'FAILED' | 'UNAVAILABLE' | 'UNKNOWN';
export type FreshnessStatus = 'FRESH' | 'STALE' | 'EXPIRED' | 'UNKNOWN';
export interface SourceError { source: string; code: string; message: string; retryable: boolean; }
export interface SourceFreshness { retrievedAt: string | null; dataAsOfTime: string | null; staleAfter: string | null; freshnessStatus: FreshnessStatus; }
export interface SourceEnvelope<T> { data: T | null; source: string; status: SourceStatus; freshness: SourceFreshness; errors: readonly SourceError[]; }
export interface OhlcvBar { timestamp: string; open: number; high: number; low: number; close: number; volume: number; }
export interface MarketDataSnapshot { ohlcv: readonly OhlcvBar[]; currency: string | null; timezone: string | null; adjustment: 'ADJUSTED' | 'UNADJUSTED' | 'UNKNOWN'; }
export interface FundamentalDataSnapshot { snapshot: FundamentalSnapshot; metrics: FundamentalMetrics; benchmark?: ValuationBenchmark; }
export interface IndustryDataSnapshot { context: IndustryContextInput; }
export interface NewsDataSnapshot { documents: readonly NewsDocument[]; events: readonly NewsEvent[]; }
export interface ResearchDataSnapshot { documents: readonly ResearchDocument[]; }
export interface LiveDataCoverage { available: number; total: number; ratio: number; missingSources: readonly string[]; failedSources: readonly string[]; }
export interface LiveDataSnapshot {
  asset: ResolvedStockAsset;
  marketData: SourceEnvelope<MarketDataSnapshot>;
  fundamentalData: SourceEnvelope<FundamentalDataSnapshot>;
  industryData: SourceEnvelope<IndustryDataSnapshot>;
  macroContext: SourceEnvelope<MacroAgentOutput>;
  marketContext: SourceEnvelope<KoreaMarketOutput | GlobalMarketOutput>;
  newsData: SourceEnvelope<NewsDataSnapshot>;
  researchData: SourceEnvelope<ResearchDataSnapshot>;
  sourceStatus: Readonly<Record<string, SourceStatus>>;
  freshness: Readonly<Record<string, SourceFreshness>>;
  coverage: LiveDataCoverage;
  asOfTime: string | null;
  errors: readonly SourceError[];
}
export interface ExistingPipelineInput { technical: import('../stock-analysis/types.ts').TechnicalContext; technicalSignals: import('../stock-analysis/technical-signals/types.ts').TechnicalSignalContext; fundamental: StockFundamentalContext; industry: import('../stock-analysis/types.ts').IndustryContext; }
