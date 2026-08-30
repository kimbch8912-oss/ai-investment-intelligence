import type { AssetIdentifierRecord, AssetRecord } from '../stock-analysis/types.ts';
import { liveCache } from './live-cache.ts';
import { AssetRegistrationService } from './persistence/asset-registration-service.ts';
import type { RegisteredAsset } from './persistence/asset-registration-repository.ts';
import { fetchWithTimeout } from './fetch-with-timeout.ts';

export type StockSearchResult = { symbol: string; name: string; exchange: 'NASDAQ' | 'NYSE' | 'NYSE American'; country: 'US'; currency: string; type: 'Common Stock'; providerIdentifier: string };
const exchanges = new Set(['NASDAQ', 'NYSE', 'NYSE American', 'NYSE MKT']);
const normalizeExchange = (exchange: string) => exchange === 'NYSE MKT' ? 'NYSE American' : exchange as StockSearchResult['exchange'];

function normalize(raw: Record<string, unknown>): StockSearchResult | null {
  const symbol = String(raw.symbol ?? '').trim().toUpperCase();
  const exchange = String(raw.exchange ?? raw.mic_code ?? '').trim();
  const country = String(raw.country ?? '').trim().toUpperCase();
  const type = String(raw.type ?? raw.instrument_type ?? '').trim().toLowerCase();
  if (!symbol || !['US', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(country) || !exchanges.has(exchange) || (type && !['common stock', 'stock', 'equity'].includes(type))) return null;
  return { symbol, name: String(raw.name ?? raw.instrument_name ?? symbol), exchange: normalizeExchange(exchange), country: 'US', currency: String(raw.currency ?? 'USD'), type: 'Common Stock', providerIdentifier: symbol };
}

async function fetchSearch(query: string): Promise<readonly StockSearchResult[]> {
  const key = process.env.MARKET_DATA_API_KEY;
  if (!key || !query.trim()) return [];
  const base = process.env.MARKET_DATA_BASE_URL ?? 'https://api.twelvedata.com';
  const url = `${base}/symbol_search?${new URLSearchParams({ symbol: query.trim() })}`;
  try {
    const response = await fetchWithTimeout(url, { headers: { Authorization: `apikey ${key}` }, cache: 'force-cache', next: { revalidate: liveCache.symbolSearchSeconds, tags: [`symbol-search:${query.trim().toUpperCase()}`] } } as RequestInit, 5_000);
    const payload = await response.json() as { data?: unknown[] };
    if (!response.ok || !Array.isArray(payload.data)) return [];
    const seen = new Set<string>();
    return payload.data.map((item) => normalize(item as Record<string, unknown>)).filter((item): item is StockSearchResult => item !== null && !seen.has(item.symbol) && !!seen.add(item.symbol)).slice(0, 10);
  } catch { return []; }
}

export async function searchUsEquities(query: string) { return fetchSearch(query); }
type Resolution = { asset: AssetRecord; identifiers: readonly AssetIdentifierRecord[] };
type ResolverDependencies = { canonical?: Pick<AssetRegistrationService, 'resolveUs'> & Partial<Pick<AssetRegistrationService, 'registerUs'>>; search?: (query: string) => Promise<readonly StockSearchResult[]> };
const fromCanonical = (asset: RegisteredAsset, symbol: string): Resolution | null => {
  const row = asset as RegisteredAsset & { asset_type?: string; is_active?: boolean };
  const assetType = row.assetType ?? row.asset_type;
  const isActive = row.isActive ?? row.is_active;
  if (asset.symbol !== symbol || assetType !== 'STOCK' || asset.country !== 'US' || !isActive || !asset.exchange || !['NASDAQ', 'NYSE', 'NYSE American'].includes(asset.exchange)) return null;
  return { asset: { id: asset.id, symbol: asset.symbol, name: asset.name, assetType: 'STOCK', exchange: asset.exchange, country: asset.country, currency: asset.currency, timezone: asset.timezone, isActive }, identifiers: [{ assetId: asset.id, identifierType: 'TICKER', identifierValue: symbol, isActive: true }] };
};
export async function resolveUsEquity(symbol: string, dependencies: ResolverDependencies = {}): Promise<Resolution | null> {
  const normalized = symbol.trim().toUpperCase();
  if (!/^[A-Z][A-Z.\-]{0,9}$/.test(normalized)) return null;
  const registration = dependencies.canonical ?? new AssetRegistrationService();
  try { const canonical = await registration.resolveUs(normalized); if (canonical) return fromCanonical(canonical, normalized); } catch { /* Provider fallback intentionally preserves resolver availability. */ }
  const result = (await (dependencies.search ?? fetchSearch)(normalized)).find((item) => item.symbol === normalized);
  if (!result) return null;
  if (!registration.registerUs) return null;
  try { const registered = await registration.registerUs({ symbol: result.symbol, name: result.name, exchange: result.exchange, country: 'US', currency: 'USD', providerIdentifier: normalized }); const canonical = fromCanonical(registered, normalized); if (canonical) return canonical; } catch { try { const canonical = await registration.resolveUs(normalized); if (canonical) return fromCanonical(canonical, normalized); } catch { /* Existing provider resolution remains unavailable without canonical storage. */ } }
  const asset: AssetRecord = { id: `twelve-data:${result.providerIdentifier}`, symbol: result.symbol, name: result.name, assetType: 'STOCK', exchange: result.exchange, country: result.country, currency: result.currency, timezone: 'America/New_York', isActive: true };
  return { asset, identifiers: [{ assetId: asset.id, identifierType: 'TICKER', identifierValue: normalized, isActive: true }] };
}
