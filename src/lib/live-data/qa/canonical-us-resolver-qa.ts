import { strict as assert } from 'node:assert';
import { resolveUsEquity, type StockSearchResult } from '../stock-asset-resolver.ts';
const canonical = (symbol: string) => ({ id: `asset-${symbol}`, symbol, name: symbol, assetType: 'STOCK', exchange: 'NASDAQ', country: 'US', currency: 'USD', timezone: 'America/New_York', isActive: true });
const provider = (symbol: string, calls: { value: number }) => async (): Promise<readonly StockSearchResult[]> => { calls.value++; return [{ symbol, name: symbol, exchange: 'NASDAQ', country: 'US', currency: 'USD', type: 'Common Stock', providerIdentifier: symbol }]; };
for (const symbol of ['NVDA', 'AAPL']) { const calls = { value: 0 }; const result = await resolveUsEquity(symbol, { canonical: { resolveUs: async () => canonical(symbol) }, search: provider(symbol, calls) }); assert.equal(result?.asset.id, `asset-${symbol}`); assert.equal(calls.value, 0); }
{ const calls = { value: 0 }; assert.equal((await resolveUsEquity('MSFT', { canonical: { resolveUs: async () => null }, search: provider('MSFT', calls) }))?.asset.symbol, 'MSFT'); assert.equal(calls.value, 1); }
{ const calls = { value: 0 }; assert.equal((await resolveUsEquity('TSLA', { canonical: { resolveUs: async () => { throw Error('db'); } }, search: provider('TSLA', calls) }))?.asset.symbol, 'TSLA'); assert.equal(calls.value, 1); }
assert.equal(await resolveUsEquity('BTC', { canonical: { resolveUs: async () => null }, search: async () => [] }), null);
console.log('Canonical US resolver QA PASS: NVDA/AAPL hit, miss, DB error fallback, unsupported, provider counts');
