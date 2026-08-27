import { strict as assert } from 'node:assert';
import { runM2Pipeline } from '../../../analysis/m2-pipeline.ts';
import { economicPoints, marketPoints } from '../../providers/macro/mapper.ts';
import { MacroCacheService } from '../macro-cache-service.ts';
import type { FredObservation, FredSeriesId } from '../../providers/macro/validator.ts';

const analysis = '2026-08-20T12:00:00.000Z';
const row = (seriesId: FredSeriesId, date: string, value = '100', vintageAt = `${date}T23:59:59.999Z`): FredObservation => ({ seriesId, observationDate: date, value, vintageAt, retrievedAt: analysis, frequency: seriesId === 'GDP' ? 'Quarterly' : seriesId === 'DGS2' || seriesId === 'DGS10' || seriesId === 'T10Y2Y' || seriesId === 'VIXCLS' || seriesId === 'SP500' || seriesId === 'NASDAQCOM' ? 'Daily' : 'Monthly', source: 'FRED', status: 'READY' });
class MemoryRepository {
  rows: Array<FredObservation & { dbSeriesId: string }> = [];
  async readBySeriesId(id: string, series: string, frequency: string, at: string) { const latest = new Map<string, FredObservation>(); for (const item of this.rows.filter(item => item.dbSeriesId === id && item.vintageAt <= at)) { const old = latest.get(item.observationDate); if (!old || old.vintageAt < item.vintageAt) latest.set(item.observationDate, { ...item, seriesId: series as FredSeriesId, frequency }); } return [...latest.values()].sort((a,b) => a.observationDate.localeCompare(b.observationDate)); }
  async insert(id: string, observations: readonly FredObservation[]) { let inserted = 0; for (const item of observations) if (!this.rows.some(old => old.dbSeriesId === id && old.observationDate === item.observationDate && old.vintageAt === item.vintageAt)) { this.rows.push({ ...item, dbSeriesId: id }); inserted++; } return { inserted, skipped: observations.length - inserted, failed: [] as string[] }; }
}
class FixtureProvider { calls = 0; constructor(private response: FredObservation[] = []) {} async getSeries(_series: FredSeriesId, _at: string) { this.calls++; return { observations: this.response, errors: this.response.length ? [] : ['PROVIDER_DOWN'], retrievedAt: analysis }; } }
const registration = { resolve: async (id: FredSeriesId) => ({ id: `id-${id}`, frequency: row(id, '2026-01-01').frequency }) };
const cache = (provider: FixtureProvider, repository: MemoryRepository) => new MacroCacheService(provider as never, repository as never, registration);

async function main() {
  const db = new MemoryRepository(); const provider = new FixtureProvider([row('DGS2', '2026-08-19', '4.2')]); const service = cache(provider, db);
  assert.equal((await service.get('DGS2', analysis)).cacheStatus, 'MISS'); assert.equal(db.rows.length, 1, 'cold fetch writes');
  assert.equal((await service.get('DGS2', analysis)).cacheStatus, 'HIT'); assert.equal(provider.calls, 1, 'warm hit makes no FRED call');
  await db.insert('id-CPIAUCSL', [row('CPIAUCSL', '2026-07-01', '100', '2026-07-15T00:00:00.000Z'), row('CPIAUCSL', '2026-07-01', '101', '2026-08-15T00:00:00.000Z')]);
  const beforeRevision = await db.readBySeriesId('id-CPIAUCSL', 'CPIAUCSL', 'Monthly', '2026-08-01T00:00:00.000Z'); const afterRevision = await db.readBySeriesId('id-CPIAUCSL', 'CPIAUCSL', 'Monthly', analysis);
  assert.equal(beforeRevision[0]?.value, '100'); assert.equal(afterRevision[0]?.value, '101'); assert.equal(db.rows.filter(x => x.dbSeriesId === 'id-CPIAUCSL').length, 2, 'both vintages retained');
  const old = <T extends FredObservation>(item: T): T => ({ ...item, retrievedAt: '2026-01-01T00:00:00.000Z' });
  const staleDb = new MemoryRepository(); await staleDb.insert('id-DGS10', [old(row('DGS10', '2026-08-01', '4.1'))]); const refreshed = await cache(new FixtureProvider([row('DGS10', '2026-08-19', '4.3')]), staleDb).get('DGS10', analysis); assert.equal(refreshed.cacheStatus, 'REFRESHED');
  const fallbackDb = new MemoryRepository(); await fallbackDb.insert('id-CPIAUCSL', [old(row('CPIAUCSL', '2026-05-01'))]); assert.equal((await cache(new FixtureProvider(), fallbackDb).get('CPIAUCSL', analysis)).cacheStatus, 'STALE_FALLBACK');
  const expiredDb = new MemoryRepository(); await expiredDb.insert('id-CPIAUCSL', [old(row('CPIAUCSL', '2025-01-01'))]); assert.equal((await cache(new FixtureProvider(), expiredDb).get('CPIAUCSL', analysis)).cacheStatus, 'EXPIRED');
  assert.equal((await cache(new FixtureProvider([row('UNRATE', '2026-08-01', '.')]), new MemoryRepository()).get('UNRATE', analysis)).cacheStatus, 'UNAVAILABLE', 'missing FRED dot is not stored');
  const market = Array.from({ length: 260 }, (_, i) => row('SP500', `2025-11-${String((i % 28) + 1).padStart(2, '0')}`, String(5000 + i)));
  const monthly = Array.from({ length: 15 }, (_, i) => row('CPIAUCSL', `202${5 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`, String(300 + i)));
  const quarterly = Array.from({ length: 8 }, (_, i) => row('GDP', `202${4 + Math.floor(i / 4)}-${String((i % 4) * 3 + 1).padStart(2, '0')}-01`, String(20000 + i)));
  const liquidity = monthly.map((x, i) => ({ ...x, seriesId: 'M2SL' as const, value: String(21000 + i) }));
  const raw = runM2Pipeline(marketPoints(market, 'SP500'), economicPoints(monthly, 'CPIAUCSL'), economicPoints(quarterly, 'GDP'), economicPoints(liquidity, 'M2SL'), analysis);
  const roundTrip = JSON.parse(JSON.stringify([...market, ...monthly, ...quarterly, ...liquidity])) as FredObservation[];
  const restored = runM2Pipeline(marketPoints(roundTrip, 'SP500'), economicPoints(roundTrip, 'CPIAUCSL'), economicPoints(roundTrip, 'GDP'), economicPoints(roundTrip, 'M2SL'), analysis);
  assert.deepEqual(restored?.composites.macro, raw?.composites.macro); assert.equal(restored?.stableRegime.stableRegime, raw?.stableRegime.stableRegime);
  console.log('Macro cache QA PASS: cold/warm/idempotency/vintage/look-ahead/stale/expired/missing-value/M2 round-trip');
}
main();
