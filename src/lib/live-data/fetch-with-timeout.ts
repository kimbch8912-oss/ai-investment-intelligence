export class ProviderTimeoutError extends Error { constructor() { super('PROVIDER_TIMEOUT'); } }
export const isProviderTimeout = (error: unknown) => error instanceof ProviderTimeoutError;
export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number, fetcher: typeof fetch = fetch) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetcher(input, { ...init, signal: controller.signal }); }
  catch (error) { if (controller.signal.aborted) throw new ProviderTimeoutError(); throw error; }
  finally { clearTimeout(timer); }
}
