import { FixtureProvider, type FixtureEconomicRaw, type FixtureMarketRaw } from '../providers/fixture-provider.ts';
import { normalizeEconomicObservation } from '../normalizers/economic-observation.ts';
import { normalizeMarketPrice } from '../normalizers/market-price.ts';
import { runIngestion } from '../run-ingestion.ts';
import type { IngestionWriter, NormalizedEconomicObservation, NormalizedMarketPrice, WriteResult } from '../types.ts';
import { validateEconomicObservation, validateMarketPrice } from '../validators.ts';

class MemoryMarketWriter implements IngestionWriter<NormalizedMarketPrice> { rows = new Map<string, NormalizedMarketPrice>(); async write(row: NormalizedMarketPrice): Promise<WriteResult> { const key = `${row.assetId}/${row.sourceId}/${row.interval}/${row.marketTime}`; const action = this.rows.has(key) ? 'updated' : 'inserted'; this.rows.set(key, row); return { action }; } }
class MemoryEconomicWriter implements IngestionWriter<NormalizedEconomicObservation> { rows = new Map<string, NormalizedEconomicObservation>(); async write(row: NormalizedEconomicObservation): Promise<WriteResult> { const key = `${row.seriesId}/${row.observationDate}/${row.vintageAt}`; if (this.rows.has(key)) return { action: 'skipped' }; this.rows.set(key, row); return { action: 'inserted' }; } }
const assetId = '11111111-1111-4111-8111-111111111111'; const sourceId = '22222222-2222-4222-8222-222222222222'; const seriesId = '33333333-3333-4333-8333-333333333333';
const market = (close: string): FixtureMarketRaw => ({ assetId, sourceId, interval: '1d', marketTime: '2026-01-02T00:00:00Z', close, currency: 'USD', retrievedAt: '2026-01-03T00:00:00Z' });
const economic = (vintageAt: string, value: string): FixtureEconomicRaw => ({ seriesId, observationDate: '2026-01-01', vintageAt, value, retrievedAt: '2026-01-03T00:00:00Z', metadata: { fixture: true } });

async function main() {
  const marketWriter = new MemoryMarketWriter(); const economicWriter = new MemoryEconomicWriter();
  const dry = await runIngestion({ provider: new FixtureProvider<void, FixtureMarketRaw[]>([market('100')]), input: undefined, normalize: normalizeMarketPrice, validate: validateMarketPrice, writer: marketWriter, dryRun: true }); const marketRowsBeforeWrite: number = marketWriter.rows.size; if (dry.valid !== 1 || marketRowsBeforeWrite !== 0) throw new Error('dry run failed');
  await runIngestion({ provider: new FixtureProvider<void, FixtureMarketRaw[]>([market('100')]), input: undefined, normalize: normalizeMarketPrice, validate: validateMarketPrice, writer: marketWriter });
  await runIngestion({ provider: new FixtureProvider<void, FixtureMarketRaw[]>([market('100')]), input: undefined, normalize: normalizeMarketPrice, validate: validateMarketPrice, writer: marketWriter }); if (marketWriter.rows.size !== 1) throw new Error('market duplicate failed');
  await runIngestion({ provider: new FixtureProvider<void, FixtureMarketRaw[]>([market('101')]), input: undefined, normalize: normalizeMarketPrice, validate: validateMarketPrice, writer: marketWriter }); if (marketWriter.rows.size !== 1 || [...marketWriter.rows.values()][0].close !== '101') throw new Error('market correction failed');
  const invalid = await runIngestion({ provider: new FixtureProvider<void, FixtureMarketRaw[]>([market('-1')]), input: undefined, normalize: normalizeMarketPrice, validate: validateMarketPrice, writer: marketWriter }); if (invalid.rejected.length !== 1 || marketWriter.rows.size !== 1) throw new Error('invalid market failed');
  for (const row of [economic('2026-01-03T00:00:00Z', '100'), economic('2026-01-03T00:00:00Z', '100'), economic('2026-01-04T00:00:00Z', '105')]) await runIngestion({ provider: new FixtureProvider<void, FixtureEconomicRaw[]>([row]), input: undefined, normalize: normalizeEconomicObservation, validate: validateEconomicObservation, writer: economicWriter });
  if (economicWriter.rows.size !== 2) throw new Error('economic vintage failed');
  const reconstructed = [...economicWriter.rows.values()].filter((row) => row.vintageAt <= '2026-01-03T12:00:00Z').sort((a, b) => b.vintageAt.localeCompare(a.vintageAt))[0]; if (reconstructed.value !== '100') throw new Error('historical reconstruction failed');
  console.log('M1-F fixture core QA PASS');
}
main();
