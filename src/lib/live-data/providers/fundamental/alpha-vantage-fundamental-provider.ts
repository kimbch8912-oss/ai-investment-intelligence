import type { FundamentalDataProvider, AssetDataRequest } from '../../provider-contracts.ts';
import type { FundamentalDataSnapshot, SourceEnvelope } from '../../types.ts';
import { mapAlphaVantageFundamental } from './mapper.ts';
import { fetchWithTimeout, isProviderTimeout } from '../../fetch-with-timeout.ts';
const now = () => new Date().toISOString();
const failed = (code: string, message: string): SourceEnvelope<FundamentalDataSnapshot> => ({ data: null, source: 'alpha-vantage-fundamental', status: 'FAILED', freshness: { retrievedAt: now(), dataAsOfTime: null, staleAfter: null, freshnessStatus: 'UNKNOWN' }, errors: [{ source: 'alpha-vantage-fundamental', code, message, retryable: code === 'PROVIDER_NETWORK_ERROR' }] });
class ProviderFailure extends Error { constructor(readonly code: 'PROVIDER_QUOTA'|'PROVIDER_RATE_LIMIT'|'PROVIDER_AUTH_ERROR'|'PROVIDER_RESPONSE_ERROR') { super(code); } }
const payloadFailure = (payload: unknown): ProviderFailure | null => {
  if (!payload || typeof payload !== 'object') return new ProviderFailure('PROVIDER_RESPONSE_ERROR');
  const body = payload as Record<string, unknown>;
  if (Object.keys(body).length === 0) return new ProviderFailure('PROVIDER_RESPONSE_ERROR');
  if (typeof body.Information === 'string') return new ProviderFailure('PROVIDER_QUOTA');
  if (typeof body.Note === 'string') return new ProviderFailure('PROVIDER_RATE_LIMIT');
  if (typeof body['Error Message'] === 'string') return new ProviderFailure('PROVIDER_AUTH_ERROR');
  return null;
};
type Fetcher = typeof fetch;
export class AlphaVantageFundamentalProvider implements FundamentalDataProvider {
  readonly id = 'alpha-vantage-fundamental';
  constructor(private readonly fetcher: Fetcher = fetch) {}
  async getFundamentalData(request: AssetDataRequest): Promise<SourceEnvelope<FundamentalDataSnapshot>> {
    if (!['NASDAQ', 'NYSE', 'NYSE American'].includes(request.asset.market) || request.asset.country !== 'US') return failed('UNSUPPORTED_ASSET', 'Only supported US equities can be loaded.');
    const key = process.env.ALPHA_VANTAGE_API_KEY; if (!key) return failed('MISSING_API_KEY', 'ALPHA_VANTAGE_API_KEY is not configured.');
    try {
      const base = process.env.ALPHA_VANTAGE_BASE_URL ?? 'https://www.alphavantage.co/query';
      const call = async (fn: string) => {
        const response = await fetchWithTimeout(`${base}?${new URLSearchParams({ function: fn, symbol: request.asset.symbol, apikey: key })}`, { cache: 'force-cache', next: { revalidate: 43_200, tags: [`fundamental:${request.asset.symbol}:${fn}`] } } as RequestInit, 10_000, this.fetcher);
        if (!response.ok) throw new ProviderFailure('PROVIDER_RESPONSE_ERROR');
        let payload: unknown; try { payload = await response.json(); } catch { throw new ProviderFailure('PROVIDER_RESPONSE_ERROR'); }
        const failure = payloadFailure(payload); if (failure) throw failure;
        return payload;
      };
      const [overview, income, balance, cash] = await Promise.all(['OVERVIEW', 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW'].map(call));
      const retrievedAt = now(); const data = mapAlphaVantageFundamental(overview as Record<string, unknown>, income, balance, cash, retrievedAt, request.asset); const asOf = data.snapshot.asOfTime;
      if (asOf > request.asOfTime) return failed('LOOK_AHEAD_BLOCKED', 'Fundamental data is later than analysisTime.');
      return { data, source: 'alpha-vantage-fundamental', status: data.snapshot.quality.status === 'COMPLETE' ? 'READY' : 'PARTIAL', freshness: { retrievedAt, dataAsOfTime: asOf, staleAfter: null, freshnessStatus: 'UNKNOWN' }, errors: [] };
    } catch (error) {
      if (error instanceof ProviderFailure) return failed(error.code, error.code === 'PROVIDER_QUOTA' ? 'Provider quota response.' : error.code === 'PROVIDER_RATE_LIMIT' ? 'Provider rate-limit response.' : error.code === 'PROVIDER_AUTH_ERROR' ? 'Provider authentication response.' : 'Provider response is malformed or unsuccessful.');
      return failed(isProviderTimeout(error) ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR', 'Fundamental provider network request failed.');
    }
  }
}
