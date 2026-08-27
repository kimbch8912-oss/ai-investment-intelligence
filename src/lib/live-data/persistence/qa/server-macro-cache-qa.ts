import { strict as assert } from 'node:assert';
import { createServerSupabaseClient } from '../../../supabase/server-client.ts';
import { FredMacroProvider } from '../../providers/macro/fred-macro-provider.ts';
import { MacroCacheService } from '../macro-cache-service.ts';
import type { FredSeriesId } from '../../providers/macro/validator.ts';

const required: FredSeriesId[] = ['DGS2', 'DGS10', 'T10Y2Y', 'CPIAUCSL', 'UNRATE', 'GDP', 'M2SL'];
async function main() {
  const analysisTime = new Date().toISOString(); const cache = new MacroCacheService(new FredMacroProvider());
  const cold = await Promise.all(required.map(id => cache.get(id, analysisTime)));
  for (const result of cold) assert.ok(result.cacheStatus !== 'UNAVAILABLE' || result.errors.length, 'unavailable status must carry an error');
  const warm = await Promise.all(required.map(id => cache.get(id, analysisTime)));
  const warmProviderCalls = warm.reduce((sum, result) => sum + result.providerCalls, 0);
  const db = createServerSupabaseClient(); const source = await db.from('system_sources').select('id').eq('code', 'FRED').single(); if (source.error) throw source.error;
  const series = await db.from('economic_series').select('id,source_series_id').eq('source_id', source.data.id).in('source_series_id', required); if (series.error) throw series.error;
  const ids = series.data.map(item => item.id); const rows = ids.length ? await db.from('economic_observations').select('series_id', { count: 'exact', head: true }).in('series_id', ids) : { count: 0, error: null }; if (rows.error) throw rows.error;
  console.log(JSON.stringify({ analysisTime, cold: Object.fromEntries(required.map((id, i) => [id, [cold[i]?.cacheStatus, cold[i]?.dataAsOfTime, cold[i]?.vintageAt]])), warm: Object.fromEntries(required.map((id, i) => [id, [warm[i]?.cacheStatus, warm[i]?.dataAsOfTime, warm[i]?.vintageAt]])), warmProviderCalls, economicObservationRows: rows.count ?? 0 }));
  assert.equal(warmProviderCalls, 0, 'warm cache must not call FRED');
}
main();
