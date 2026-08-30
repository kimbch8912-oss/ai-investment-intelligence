import type {
  MarketDataProvider,
  MarketDataRequest,
} from '../../provider-contracts.ts';
import type { MarketDataSnapshot, SourceEnvelope } from '../../types.ts';
import {
  fetchWithTimeout,
  isProviderTimeout,
} from '../../fetch-with-timeout.ts';
import { mapKoreaDaily } from './mapper.ts';
import { validKoreaBars } from './validator.ts';

const now = () => new Date().toISOString();

const fail = (
  code: string,
  message: string,
): SourceEnvelope<MarketDataSnapshot> => ({
  data: null,
  source: 'twelve-data-korea',
  status: 'FAILED',
  freshness: {
    retrievedAt: now(),
    dataAsOfTime: null,
    staleAfter: null,
    freshnessStatus: 'UNKNOWN',
  },
  errors: [
    {
      source: 'twelve-data-korea',
      code,
      message,
      retryable:
        code === 'PROVIDER_NETWORK_ERROR' || code === 'PROVIDER_TIMEOUT',
    },
  ],
});

const payloadFailure = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const body = payload as Record<string, unknown>;
  if (typeof body.Information === 'string') {
    return 'PROVIDER_QUOTA';
  }

  if (body.status !== 'error') {
    return null;
  }

  const message = [body.message, body.detail]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  if (/quota|credit|rate limit|api limit/.test(message)) {
    return 'PROVIDER_QUOTA';
  }
  if (/api.?key|auth|unauthori[sz]ed|forbidden|permission/.test(message)) {
    return 'PROVIDER_AUTH_ERROR';
  }

  // Subscription plan and license replies are valid provider responses, not
  // transport failures. No more specific contract code exists for them.
  return 'PROVIDER_RESPONSE_ERROR';
};

export class KoreaMarketDataProvider implements MarketDataProvider {
  readonly id = 'twelve-data-korea';

  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async getMarketData(
    request: MarketDataRequest,
  ): Promise<SourceEnvelope<MarketDataSnapshot>> {
    if (request.asset.country !== 'KR' || request.asset.market !== 'KRX') {
      return fail('UNSUPPORTED_ASSET', 'Only KRX common stocks are supported.');
    }

    const key = process.env.MARKET_DATA_API_KEY;
    if (!key) {
      return fail('MISSING_API_KEY', 'MARKET_DATA_API_KEY is not configured.');
    }

    const query = new URLSearchParams({
      symbol: request.asset.symbol,
      interval: '1day',
      outputsize: '250',
      end_date: request.asOfTime.slice(0, 10),
      timezone: 'UTC',
      adjust: 'all',
    });

    try {
      const response = await fetchWithTimeout(
        `${process.env.MARKET_DATA_BASE_URL ?? 'https://api.twelvedata.com'}/time_series?${query}`,
        {
          headers: { Authorization: `apikey ${key}` },
          cache: 'force-cache',
          next: {
            revalidate: 1800,
            tags: [`korea-market:${request.asset.symbol}`],
          },
        } as RequestInit,
        8_000,
        this.fetcher,
      );

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return fail('PROVIDER_RESPONSE_ERROR', 'Korea market response was malformed.');
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return fail('PROVIDER_AUTH_ERROR', 'Korea market provider rejected the request.');
        }
        if (response.status === 429) {
          return fail('PROVIDER_RATE_LIMIT', 'Korea market provider rate limit reached.');
        }
        return fail('PROVIDER_RESPONSE_ERROR', 'Korea market provider rejected the request.');
      }

      const providerError = payloadFailure(payload);
      if (providerError) {
        return fail(providerError, 'Korea market provider returned an error response.');
      }

      let data: MarketDataSnapshot;
      try {
        data = mapKoreaDaily(payload as never, request.asOfTime);
      } catch {
        return fail('PROVIDER_RESPONSE_ERROR', 'Korea market response was invalid.');
      }

      if (!validKoreaBars(data.ohlcv, request.asOfTime)) {
        return fail('PROVIDER_RESPONSE_ERROR', 'Korea OHLCV validation failed.');
      }

      const asOf = data.ohlcv.at(-1)?.timestamp ?? null;
      return {
        data,
        source: 'twelve-data-korea',
        status: data.ohlcv.length >= 250 ? 'READY' : 'PARTIAL',
        freshness: {
          retrievedAt: now(),
          dataAsOfTime: asOf,
          staleAfter: asOf
            ? new Date(Date.parse(asOf) + 48 * 60 * 60 * 1000).toISOString()
            : null,
          freshnessStatus: 'UNKNOWN',
        },
        errors:
          data.ohlcv.length >= 250
            ? []
            : [
                {
                  source: 'twelve-data-korea',
                  code: 'INSUFFICIENT_HISTORY',
                  message: 'Fewer than 250 daily bars were returned.',
                  retryable: false,
                },
              ],
      };
    } catch (error) {
      return fail(
        isProviderTimeout(error) ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR',
        'Korea market provider request failed.',
      );
    }
  }
}
