import { strict as assert } from 'node:assert';
import { createServerSupabaseClient } from '../../../supabase/server-client.ts';
import { FundamentalCacheService } from '../fundamental-cache-service.ts';
import { AlphaVantageFundamentalProvider } from '../../providers/fundamental/alpha-vantage-fundamental-provider.ts';
import type { ResolvedStockAsset } from '../../../stock-analysis/types.ts';

async function asset(symbol: string): Promise<ResolvedStockAsset> {
  const db = createServerSupabaseClient();
  const result = await db.from('assets').select('id,symbol,name,exchange,country,currency,timezone').eq('symbol', symbol).eq('country', 'US').maybeSingle();
  if (result.error || !result.data) throw new Error(`ASSET_${symbol}: ${result.error?.message ?? 'not registered'}`);
  return { id: result.data.id, symbol: result.data.symbol!, name: result.data.name, market: result.data.exchange ?? 'NASDAQ', country: result.data.country, currency: result.data.currency, timezone: result.data.timezone, identifiers: [] };
}
async function main() {
  const analysisTime = new Date().toISOString(); const db = createServerSupabaseClient(); const cache = new FundamentalCacheService(new AlphaVantageFundamentalProvider());
  const results: Record<string, unknown> = {};
  for (const symbol of ['NVDA', 'AAPL']) {
    const resolved = await asset(symbol); const before = await db.from('fundamental_snapshots').select('id', { count: 'exact', head: true }).eq('asset_id', resolved.id);
    const cold = await cache.get(resolved, analysisTime); const afterCold = await db.from('fundamental_snapshots').select('id', { count: 'exact', head: true }).eq('asset_id', resolved.id);
    const warm = await cache.get(resolved, analysisTime); const afterWarm = await db.from('fundamental_snapshots').select('id', { count: 'exact', head: true }).eq('asset_id', resolved.id);
    assert.ok(cold.data, `${symbol} cold data unavailable: ${cold.errors.map(error => error.code).join('; ')}`); assert.equal(warm.cacheStatus, 'HIT', `${symbol} warm must hit`); assert.equal(warm.providerCalls, 0, `${symbol} warm provider calls`); assert.equal(afterCold.count, afterWarm.count, `${symbol} warm must not add rows`);
    results[symbol] = { before: before.count ?? 0, cold: cold.cacheStatus, coldProviderCalls: cold.providerCalls, dataAsOfTime: cold.dataAsOfTime, warm: warm.cacheStatus, warmProviderCalls: warm.providerCalls, rows: afterWarm.count ?? 0 };
  }
  const source = await db.from('system_sources').select('id', { count: 'exact' }).eq('code', 'ALPHA_VANTAGE'); const total = await db.from('fundamental_snapshots').select('id', { count: 'exact', head: true });
  assert.equal(source.count, 1, 'ALPHA_VANTAGE source must be idempotent'); console.log(JSON.stringify({ analysisTime, sourceCount: source.count, totalRows: total.count, results }));
}
main();
