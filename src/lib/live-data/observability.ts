export type LiveDataLogEvent = 'provider_request' | 'cache_lookup' | 'cache_write' | 'fallback' | 'live_analysis';
export type LiveDataLog = {
  event: LiveDataLogEvent;
  symbol?: string | null;
  source?: string;
  provider?: string;
  status?: string;
  cacheStatus?: string;
  errorCode?: string | null;
  latencyMs?: number;
  fallback?: string;
  dataAsOf?: string | null;
};

const write = (level: 'info' | 'warn' | 'error', entry: LiveDataLog) => {
  try {
    console[level](JSON.stringify(entry));
  } catch {
    // Observability must never affect a live analysis result.
  }
};

export const logLiveData = (entry: LiveDataLog) =>
  write(
    entry.event === 'fallback' || entry.status === 'PARTIAL' ? 'warn' : entry.errorCode ? 'error' : 'info',
    entry,
  );
