import type { MarketDataProvider, MarketDataRequest } from '../../provider-contracts.ts';
import type { MarketDataSnapshot, SourceEnvelope } from '../../types.ts';
import { mapTwelveDataDaily } from './mapper.ts';

const baseUrl = () => process.env.MARKET_DATA_BASE_URL ?? 'https://api.twelvedata.com';
const now = () => new Date().toISOString();
const fail = (code: string, message: string): SourceEnvelope<MarketDataSnapshot> => ({ data: null, source: 'twelve-data', status: 'FAILED', freshness: { retrievedAt: now(), dataAsOfTime: null, staleAfter: null, freshnessStatus: 'UNKNOWN' }, errors: [{ source: 'twelve-data', code, message, retryable: code === 'PROVIDER_NETWORK_ERROR' }] });
export class TwelveDataGlobalMarketProvider implements MarketDataProvider {
  readonly id = 'twelve-data';
  async getMarketData(request: MarketDataRequest): Promise<SourceEnvelope<MarketDataSnapshot>> {
    if (!['NASDAQ', 'NYSE', 'NYSE American'].includes(request.asset.market) || request.asset.country !== 'US') return fail('UNSUPPORTED_ASSET', 'Only supported US equities can be loaded.');
    const apiKey = process.env.MARKET_DATA_API_KEY; if (!apiKey) return fail('MISSING_API_KEY', 'MARKET_DATA_API_KEY is not configured.');
    const query = new URLSearchParams({ symbol: request.asset.symbol, interval: '1day', outputsize: '250', end_date: request.asOfTime.slice(0, 10), timezone: 'UTC', adjust: 'all' });
    try {
      const response = await fetch(`${baseUrl()}/time_series?${query}`, { headers: { Authorization: `apikey ${apiKey}` }, cache: 'force-cache', next: { revalidate: 1_800, tags: [`market:${request.asset.symbol}`] } });
      const payload = await response.json(); if (!response.ok) return fail('PROVIDER_HTTP_ERROR', 'Market provider returned an HTTP error.');
      const data = mapTwelveDataDaily(payload, request.asOfTime); const dataAsOfTime = data.ohlcv.at(-1)?.timestamp ?? null;
      return { data, source: 'twelve-data', status: data.ohlcv.length >= 150 ? 'READY' : 'PARTIAL', freshness: { retrievedAt: now(), dataAsOfTime, staleAfter: dataAsOfTime ? new Date(Date.parse(dataAsOfTime) + 48 * 60 * 60 * 1000).toISOString() : null, freshnessStatus: 'UNKNOWN' }, errors: data.ohlcv.length >= 150 ? [] : [{ source: 'twelve-data', code: 'INSUFFICIENT_HISTORY', message: 'Fewer than 150 daily bars were returned.', retryable: false }] };
    } catch (error) { return fail(error instanceof Error && error.message === 'LOOK_AHEAD_BLOCKED' ? 'LOOK_AHEAD_BLOCKED' : 'PROVIDER_NETWORK_ERROR', 'Market provider request or validation failed.'); }
  }
}
