import { logLiveData } from './observability.ts';

export class ProviderTimeoutError extends Error {
  constructor() {
    super('PROVIDER_TIMEOUT');
  }
}

export const isProviderTimeout = (error: unknown) =>
  error instanceof ProviderTimeoutError;

const metadata = (input: RequestInfo | URL) => {
  const url = new URL(typeof input === 'string' ? input : input.toString());
  const symbol = url.searchParams.get('symbol') ?? url.searchParams.get('tickers') ?? undefined;
  if (url.hostname.includes('stlouisfed')) return { provider: 'FRED', source: 'MACRO', symbol };
  if (url.hostname.includes('alphavantage')) return { provider: url.searchParams.get('function') === 'NEWS_SENTIMENT' ? 'ALPHA_VANTAGE_NEWS' : 'ALPHA_VANTAGE_FUNDAMENTAL', source: url.searchParams.get('function') === 'NEWS_SENTIMENT' ? 'NEWS' : 'FUNDAMENTAL', symbol };
  if (url.pathname.includes('symbol_search')) return { provider: 'TWELVE_DATA', source: 'SYMBOL_SEARCH', symbol };
  return { provider: 'TWELVE_DATA', source: /^\d{6}$/.test(symbol ?? '') ? 'KOREA_MARKET' : 'MARKET', symbol };
};

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  fetcher: typeof fetch = fetch,
) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const context = metadata(input);
  try {
    const response = await fetcher(input, { ...init, signal: controller.signal });
    logLiveData({ event: 'provider_request', ...context, status: response.ok ? 'SUCCESS' : 'FAILED', errorCode: response.ok ? undefined : `HTTP_${response.status}`, latencyMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const errorCode = controller.signal.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR';
    logLiveData({ event: 'provider_request', ...context, status: 'FAILED', errorCode, latencyMs: Date.now() - startedAt });
    if (controller.signal.aborted) throw new ProviderTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
