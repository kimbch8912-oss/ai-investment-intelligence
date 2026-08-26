import { createStockAnalysisRequest, resolveStockAsset } from '../stock-analysis/stock-analysis-request.ts';
import { createStockFundamentalContext } from '../stock-analysis/fundamental/fundamental-context-engine.ts';
import { createIndustryContext } from '../stock-analysis/industry/industry-context-engine.ts';
import { createTechnicalSignalContext } from '../stock-analysis/technical-signals/technical-signal-engine.ts';
import { calculateTechnicalContext } from '../stock-analysis/technical/technical-engine.ts';
import { marketRouteFor } from '../stock-analysis/stock-context.ts';
import type { AssetIdentifierRecord, AssetRecord, ResolvedStockAsset } from '../stock-analysis/types.ts';
import type { LiveDataProviders } from './provider-contracts.ts';
import type { ExistingPipelineInput, FundamentalDataSnapshot, IndustryDataSnapshot, LiveDataSnapshot, MarketDataSnapshot, SourceEnvelope, SourceError, SourceFreshness, SourceStatus } from './types.ts';

const unknownFreshness = (): SourceFreshness => ({ retrievedAt: null, dataAsOfTime: null, staleAfter: null, freshnessStatus: 'UNKNOWN' });
const unavailable = <T>(source: string): SourceEnvelope<T> => ({ data: null, source, status: 'UNAVAILABLE', freshness: unknownFreshness(), errors: [] });
const failed = <T>(source: string, code: string, message: string): SourceEnvelope<T> => ({ data: null, source, status: 'FAILED', freshness: unknownFreshness(), errors: [{ source, code, message, retryable: false }] });
const statusOf = <T>(envelope: SourceEnvelope<T>, analysisTime: string): SourceEnvelope<T> => {
  const freshness = { ...envelope.freshness, freshnessStatus: envelope.freshness.staleAfter ? (envelope.freshness.staleAfter < analysisTime ? 'STALE' as const : 'FRESH' as const) : envelope.freshness.dataAsOfTime && envelope.freshness.dataAsOfTime < analysisTime ? 'STALE' as const : envelope.freshness.dataAsOfTime ? 'FRESH' as const : 'UNKNOWN' as const };
  if (freshness.dataAsOfTime && freshness.dataAsOfTime > analysisTime) return failed(envelope.source, 'LOOK_AHEAD_BLOCKED', 'Provider dataAsOfTime is later than analysisTime.');
  return { ...envelope, data: envelope.data ? structuredClone(envelope.data) : null, freshness, errors: envelope.errors.map((error) => ({ ...error })) };
};
const validateMarket = (envelope: SourceEnvelope<MarketDataSnapshot>, analysisTime: string) => {
  const checked = statusOf(envelope, analysisTime) as SourceEnvelope<MarketDataSnapshot>;
  return checked.data?.ohlcv.some((bar) => bar.timestamp > analysisTime) ? failed<MarketDataSnapshot>(checked.source, 'LOOK_AHEAD_BLOCKED', 'Market OHLCV contains a timestamp later than analysisTime.') : checked;
};
const coverage = (sources: Readonly<Record<string, SourceEnvelope<unknown>>>) => { const values = Object.entries(sources); const available = values.filter(([, source]) => source.status === 'READY' || source.status === 'PARTIAL').length; return { available, total: values.length, ratio: values.length ? available / values.length : 0, missingSources: values.filter(([, source]) => source.status === 'UNAVAILABLE' || source.status === 'UNKNOWN').map(([name]) => name), failedSources: values.filter(([, source]) => source.status === 'FAILED').map(([name]) => name) }; };
const unknownFundamental = (at: string) => ({ growthState: 'UNKNOWN', profitabilityState: 'UNKNOWN', cashFlowState: 'UNKNOWN', balanceSheetState: 'UNKNOWN', valuationState: 'UNKNOWN', earningsQualityState: 'UNKNOWN', confidence: null, evidence: [], unknowns: ['fundamental source is unavailable'], asOfTime: at, configVersion: 'm5e-v1' } as const);

export interface StockLiveDataOrchestratorInput { asset: AssetRecord; identifiers: readonly AssetIdentifierRecord[]; analysisTime: string; from: string; to: string; providers: LiveDataProviders; macroContext?: SourceEnvelope<import('../agents/macro/types.ts').MacroAgentOutput>; koreaMarketContext?: SourceEnvelope<import('../agents/korea-market/types.ts').KoreaMarketOutput>; globalMarketContext?: SourceEnvelope<import('../agents/global-market/types.ts').GlobalMarketOutput>; }
export interface StockLiveDataOrchestratorOutput { snapshot: LiveDataSnapshot; pipeline: ExistingPipelineInput; request: import('../stock-analysis/types.ts').StockAnalysisRequest; marketRoute: 'KOREA' | 'GLOBAL'; }
export class StockLiveDataOrchestrator {
  async run(input: StockLiveDataOrchestratorInput): Promise<StockLiveDataOrchestratorOutput> {
    let asset: ResolvedStockAsset;
    try { asset = resolveStockAsset(input.asset, input.identifiers); } catch (error) { throw new Error(`Unsupported asset: ${error instanceof Error ? error.message : 'resolution failed'}`); }
    const request = createStockAnalysisRequest(asset, input.analysisTime, input.analysisTime);
    const market = validateMarket(await this.call('market', input.providers.market?.getMarketData({ asset, interval: '1d', from: input.from, to: input.to, asOfTime: input.analysisTime })), input.analysisTime);
    const fundamental = statusOf(await this.call('fundamental', input.providers.fundamental?.getFundamentalData({ asset, asOfTime: input.analysisTime })), input.analysisTime);
    const industry = statusOf(await this.call('industry', input.providers.industry?.getIndustryData({ asset, asOfTime: input.analysisTime })), input.analysisTime);
    const news = statusOf(await this.call('news', input.providers.news?.getNewsData({ asset, asOfTime: input.analysisTime })), input.analysisTime);
    const research = statusOf(await this.call('research', input.providers.research?.getResearchData({ asset, asOfTime: input.analysisTime })), input.analysisTime);
    const macro = statusOf(input.macroContext ?? unavailable<import('../agents/macro/types.ts').MacroAgentOutput>('macro'), input.analysisTime);
    const marketContext = marketRouteFor(asset) === 'KOREA'
      ? statusOf(input.koreaMarketContext ?? unavailable<import('../agents/korea-market/types.ts').KoreaMarketOutput>('korea-market'), input.analysisTime)
      : statusOf(input.globalMarketContext ?? unavailable<import('../agents/global-market/types.ts').GlobalMarketOutput>('global-market'), input.analysisTime);
    const sources = { marketData: market, fundamentalData: fundamental, industryData: industry, macroContext: macro, marketContext, newsData: news, researchData: research };
    const technical = market.data ? calculateTechnicalContext({ assetId: asset.id, interval: '1d', asOfTime: input.analysisTime, prices: market.data.ohlcv.map((bar) => ({ assetId: asset.id, interval: '1d' as const, marketTime: bar.timestamp, open: String(bar.open), high: String(bar.high), low: String(bar.low), close: String(bar.close), volume: String(bar.volume) })) }) : calculateTechnicalContext({ assetId: asset.id, interval: '1d', asOfTime: input.analysisTime, prices: [] });
    const pipeline = { technical, technicalSignals: createTechnicalSignalContext(technical), fundamental: fundamental.data ? createStockFundamentalContext(fundamental.data) : unknownFundamental(input.analysisTime), industry: createIndustryContext(industry.data?.context ?? { industry: null, sector: null, asOfTime: null }) };
    const status = Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, source.status])); const freshness = Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, source.freshness]));
    const snapshot: LiveDataSnapshot = { asset, ...sources, sourceStatus: status, freshness, coverage: coverage(sources), asOfTime: input.analysisTime, errors: Object.values(sources).flatMap((source) => source.errors) };
    return { snapshot, pipeline, request, marketRoute: marketRouteFor(asset) };
  }
  private async call<T>(name: string, operation: Promise<SourceEnvelope<T>> | undefined): Promise<SourceEnvelope<T>> { if (!operation) return unavailable<T>(name); try { return await operation; } catch { return failed<T>(name, 'PROVIDER_FAILURE', `${name} provider failed.`); } }
}
