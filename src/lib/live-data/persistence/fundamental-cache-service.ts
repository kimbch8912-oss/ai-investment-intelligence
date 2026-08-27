import type { ResolvedStockAsset } from '../../stock-analysis/types.ts';
import type { FundamentalDataProvider } from '../provider-contracts.ts';
import type { FundamentalDataSnapshot, SourceEnvelope, SourceError } from '../types.ts';
import type { FundamentalMetrics } from '../../stock-analysis/fundamental/types.ts';
import { AlphaVantageFundamentalProvider } from '../providers/fundamental/alpha-vantage-fundamental-provider.ts';
import { FundamentalRepository } from './fundamental-repository.ts';
import { SourceRegistrationRepository } from './source-registration-repository.ts';

export type FundamentalCacheStatus = 'HIT' | 'MISS' | 'REFRESHED' | 'STALE_FALLBACK' | 'EXPIRED' | 'UNAVAILABLE';
export type FundamentalCacheResult = {
  data: FundamentalDataSnapshot | null;
  cacheStatus: FundamentalCacheStatus;
  freshness: 'FRESH' | 'STALE' | 'EXPIRED' | 'UNKNOWN';
  dataAsOfTime: string | null;
  retrievedAt: string | null;
  source: 'ALPHA_VANTAGE';
  errors: readonly SourceError[];
  providerCalls: number;
};

type Repository = Pick<FundamentalRepository, 'findLatestUsableSnapshot' | 'insert'>;
type Registration = Pick<SourceRegistrationRepository, 'ensureAlphaVantage'>;
type CachedRow = Record<string, unknown>;

export const FUNDAMENTAL_CACHE_FRESH_MS = 12 * 60 * 60 * 1000;
export const FUNDAMENTAL_CACHE_EXPIRED_MS = FUNDAMENTAL_CACHE_FRESH_MS * 4;

const number = (value: unknown): number | null => value === null || value === undefined ? null : Number(value);
const isFresh = (row: CachedRow, at: string) => Date.parse(at) - Date.parse(String(row.retrieved_at)) <= FUNDAMENTAL_CACHE_FRESH_MS;
const isExpired = (row: CachedRow, at: string) => Date.parse(at) - Date.parse(String(row.retrieved_at)) > FUNDAMENTAL_CACHE_EXPIRED_MS;

export function fundamentalSnapshotFromRow(row: CachedRow, asset: ResolvedStockAsset): FundamentalDataSnapshot {
  const metrics: FundamentalMetrics = {
    revenueGrowth: number(row.revenue_growth), operatingIncomeGrowth: number(row.operating_income_growth), netIncomeGrowth: number(row.net_income_growth), epsGrowth: number(row.eps_growth),
    operatingMargin: number(row.operating_margin), netMargin: number(row.net_margin), roe: number(row.roe), operatingCashFlow: number(row.operating_cash_flow), freeCashFlow: number(row.free_cash_flow), freeCashFlowMargin: number(row.free_cash_flow_margin),
    cash: number(row.cash), totalDebt: number(row.total_debt), debtToEquity: number(row.debt_to_equity), netDebt: number(row.net_debt), pe: number(row.pe), pb: number(row.pb), evEbitda: number(row.ev_ebitda),
  };
  const evidence = Array.isArray(row.evidence) ? structuredClone(row.evidence) : [];
  const periodEnd = String(row.period_end ?? row.data_as_of);
  return {
    metrics,
    snapshot: {
      asset: { symbol: asset.symbol, name: asset.name, currency: asset.currency ?? 'USD' }, asOfTime: String(row.data_as_of), reportingPeriod: { periodEnd },
      financials: {}, growth: { revenueGrowth: metrics.revenueGrowth, operatingIncomeGrowth: metrics.operatingIncomeGrowth, netIncomeGrowth: metrics.netIncomeGrowth, epsGrowth: metrics.epsGrowth },
      profitability: { operatingMargin: metrics.operatingMargin, netMargin: metrics.netMargin, roe: metrics.roe }, balanceSheet: { cash: metrics.cash, totalDebt: metrics.totalDebt, debtToEquity: metrics.debtToEquity, netDebt: metrics.netDebt },
      cashFlow: { operatingCashFlow: metrics.operatingCashFlow, freeCashFlow: metrics.freeCashFlow, freeCashFlowMargin: metrics.freeCashFlowMargin }, valuation: { pe: metrics.pe, pb: metrics.pb, evEbitda: metrics.evEbitda },
      quality: { coverage: number(row.confidence) ?? 0, confidence: number(row.confidence) ?? 0, status: String(row.data_quality) as 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT' }, evidence: evidence as never[], sourceStatus: 'READY', direction: 'UNKNOWN',
    },
  };
}

export class FundamentalCacheService {
  constructor(private readonly provider: FundamentalDataProvider = new AlphaVantageFundamentalProvider(), private readonly snapshots: Repository = new FundamentalRepository(), private readonly sources: Registration = new SourceRegistrationRepository()) {}

  async get(asset: ResolvedStockAsset, analysisTime: string): Promise<FundamentalCacheResult> {
    const source = await this.sources.ensureAlphaVantage();
    const cached = await this.snapshots.findLatestUsableSnapshot({ assetId: asset.id, sourceId: source.id, analysisTime }) as CachedRow | null;
    if (cached && isFresh(cached, analysisTime)) return this.result(fundamentalSnapshotFromRow(cached, asset), 'HIT', 'FRESH', cached, [], 0);

    const live = await this.provider.getFundamentalData({ asset, asOfTime: analysisTime });
    if (live.data) {
      const retrievedAt = live.freshness.retrievedAt ?? analysisTime;
      await this.snapshots.insert(asset.id, source.id, live.data, retrievedAt);
      return this.result(structuredClone(live.data), cached ? 'REFRESHED' : 'MISS', 'FRESH', { data_as_of: live.data.snapshot.asOfTime, retrieved_at: retrievedAt }, live.errors, 1);
    }
    if (cached && !isExpired(cached, analysisTime)) return this.result(fundamentalSnapshotFromRow(cached, asset), 'STALE_FALLBACK', 'STALE', cached, live.errors, 1);
    return this.result(null, cached ? 'EXPIRED' : 'UNAVAILABLE', cached ? 'EXPIRED' : 'UNKNOWN', cached, live.errors, 1);
  }

  async envelope(asset: ResolvedStockAsset, analysisTime: string): Promise<SourceEnvelope<FundamentalDataSnapshot>> {
    const cached = await this.get(asset, analysisTime);
    return { data: cached.data, source: 'alpha-vantage-fundamental', status: cached.data ? 'READY' : cached.cacheStatus === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAILED', freshness: { retrievedAt: cached.retrievedAt, dataAsOfTime: cached.dataAsOfTime, staleAfter: null, freshnessStatus: cached.freshness }, errors: cached.errors.map(error => ({ ...error })) };
  }

  private result(data: FundamentalDataSnapshot | null, cacheStatus: FundamentalCacheStatus, freshness: FundamentalCacheResult['freshness'], row: CachedRow | null, errors: readonly SourceError[], providerCalls: number): FundamentalCacheResult {
    return { data, cacheStatus, freshness, dataAsOfTime: row?.data_as_of ? String(row.data_as_of) : null, retrievedAt: row?.retrieved_at ? String(row.retrieved_at) : null, source: 'ALPHA_VANTAGE', errors, providerCalls };
  }
}
