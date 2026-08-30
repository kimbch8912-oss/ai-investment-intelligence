import type {
  AssetDataRequest,
  NewsDataProvider,
} from '../../provider-contracts.ts';
import type { NewsDataSnapshot, SourceEnvelope } from '../../types.ts';
import {
  fetchWithTimeout,
  isProviderTimeout,
} from '../../fetch-with-timeout.ts';
import { mapAlphaVantageNews } from './mapper.ts';

const now = () => new Date().toISOString();

const fail = (
  code: string,
  message: string,
): SourceEnvelope<NewsDataSnapshot> => ({
  data: null,
  source: 'alpha-vantage-news',
  status: 'FAILED',
  freshness: {
    retrievedAt: now(),
    dataAsOfTime: null,
    staleAfter: null,
    freshnessStatus: 'UNKNOWN',
  },
  errors: [
    {
      source: 'alpha-vantage-news',
      code,
      message,
      retryable:
        code === 'PROVIDER_NETWORK_ERROR' || code === 'PROVIDER_TIMEOUT',
    },
  ],
});

class ProviderFailure extends Error {
  constructor(
    readonly code:
      | 'PROVIDER_QUOTA'
      | 'PROVIDER_RATE_LIMIT'
      | 'PROVIDER_AUTH_ERROR'
      | 'PROVIDER_RESPONSE_ERROR',
  ) {
    super(code);
  }
}

const classify = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !Object.keys(payload).length) {
    return new ProviderFailure('PROVIDER_RESPONSE_ERROR');
  }

  const body = payload as Record<string, unknown>;
  if (typeof body.Information === 'string') {
    return new ProviderFailure('PROVIDER_QUOTA');
  }
  if (typeof body.Note === 'string') {
    return new ProviderFailure('PROVIDER_RATE_LIMIT');
  }
  if (typeof body['Error Message'] === 'string') {
    return new ProviderFailure('PROVIDER_AUTH_ERROR');
  }

  return null;
};

export class AlphaVantageNewsProvider implements NewsDataProvider {
  readonly id = 'alpha-vantage-news';

  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async getNewsData(
    request: AssetDataRequest,
  ): Promise<SourceEnvelope<NewsDataSnapshot>> {
    if (
      !['NASDAQ', 'NYSE', 'NYSE American'].includes(request.asset.market) ||
      request.asset.country !== 'US'
    ) {
      return fail('UNSUPPORTED_ASSET', 'Only supported US equities can be loaded.');
    }

    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key) {
      return fail('MISSING_API_KEY', 'ALPHA_VANTAGE_API_KEY is not configured.');
    }

    try {
      const base =
        process.env.ALPHA_VANTAGE_BASE_URL ??
        'https://www.alphavantage.co/query';
      const response = await fetchWithTimeout(
        `${base}?${new URLSearchParams({
          function: 'NEWS_SENTIMENT',
          tickers: request.asset.symbol,
          limit: '10',
          apikey: key,
        })}`,
        {
          cache: 'force-cache',
          next: { revalidate: 1200, tags: [`news:${request.asset.symbol}`] },
        } as RequestInit,
        8_000,
        this.fetcher,
      );

      if (!response.ok) {
        throw new ProviderFailure('PROVIDER_RESPONSE_ERROR');
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ProviderFailure('PROVIDER_RESPONSE_ERROR');
      }

      const issue = classify(payload);
      if (issue) {
        throw issue;
      }

      const retrievedAt = now();
      let data: NewsDataSnapshot;
      try {
        data = mapAlphaVantageNews(
          payload as never,
          retrievedAt,
          request.asOfTime,
          request.asset.symbol,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'LOOK_AHEAD_BLOCKED') {
          throw error;
        }
        throw new ProviderFailure('PROVIDER_RESPONSE_ERROR');
      }

      const asOf = data.documents[0]?.publishedAt ?? null;
      return {
        data,
        source: 'alpha-vantage-news',
        status: data.documents.length ? 'READY' : 'PARTIAL',
        freshness: {
          retrievedAt,
          dataAsOfTime: asOf,
          staleAfter: null,
          freshnessStatus: data.documents.length ? 'FRESH' : 'UNKNOWN',
        },
        errors: [],
      };
    } catch (error) {
      if (error instanceof ProviderFailure) {
        return fail(error.code, error.code);
      }
      if (isProviderTimeout(error)) {
        return fail('PROVIDER_TIMEOUT', 'News provider request timed out.');
      }
      return fail(
        error instanceof Error && error.message === 'LOOK_AHEAD_BLOCKED'
          ? 'LOOK_AHEAD_BLOCKED'
          : 'PROVIDER_NETWORK_ERROR',
        'News provider request or validation failed.',
      );
    }
  }
}
