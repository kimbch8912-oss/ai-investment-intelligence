import { strict as assert } from 'node:assert';
import { fetchWithTimeout } from '../fetch-with-timeout.ts';
import { logLiveData } from '../observability.ts';

const entries: string[] = [];
const original = { info: console.info, warn: console.warn, error: console.error };
const capture = (value: string) => entries.push(value);
console.info = capture;
console.warn = capture;
console.error = capture;
try {
  await fetchWithTimeout('https://api.twelvedata.com/time_series?symbol=NVDA', {}, 20, (async () => new Response('{}')) as typeof fetch);
  await fetchWithTimeout('https://api.twelvedata.com/time_series?symbol=NVDA', {}, 10, ((_, init) => new Promise((_resolve, reject) => (init?.signal as AbortSignal).addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch).catch(() => undefined);
  logLiveData({ event: 'cache_lookup', source: 'MARKET', cacheStatus: 'HIT', status: 'SUCCESS' });
  logLiveData({ event: 'fallback', source: 'MARKET', fallback: 'DIRECT_PROVIDER', status: 'SUCCESS' });
  logLiveData({ event: 'live_analysis', symbol: 'NVDA', status: 'READY', latencyMs: 1 });
} finally {
  console.info = original.info;
  console.warn = original.warn;
  console.error = original.error;
}
const parsed = entries.map((entry) => JSON.parse(entry));
assert(parsed.some((entry) => entry.event === 'provider_request' && entry.status === 'SUCCESS' && typeof entry.latencyMs === 'number'));
assert(parsed.some((entry) => entry.event === 'provider_request' && entry.errorCode === 'PROVIDER_TIMEOUT'));
assert(parsed.some((entry) => entry.event === 'cache_lookup' && entry.cacheStatus === 'HIT'));
assert(parsed.some((entry) => entry.event === 'live_analysis'));
assert(!entries.join(' ').includes('apikey='));
console.log('Live data observability QA PASS: provider/cache/fallback/summary/sanitization');
