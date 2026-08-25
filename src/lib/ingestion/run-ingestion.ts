import { IngestionError } from './errors.ts';
import type { IngestionProvider } from './providers/types.ts';
import type { IngestionSummary, IngestionWriter } from './types.ts';

export async function runIngestion<TInput, TRaw, TRecord>(options: {
  provider: IngestionProvider<TInput, TRaw[]>;
  input: TInput;
  normalize: (raw: TRaw) => TRecord;
  validate: (record: TRecord) => { ok: boolean; reason?: string };
  writer: IngestionWriter<TRecord>;
  dryRun?: boolean;
}): Promise<IngestionSummary<TRecord>> {
  let raw: TRaw[];
  try { raw = await options.provider.fetch(options.input); } catch (error) { throw new IngestionError('PROVIDER_ERROR', 'Provider fetch failed', { provider: options.provider.code, error: error instanceof Error ? error.message : 'unknown' }); }
  const records: TRecord[] = [];
  const rejected: IngestionSummary<TRecord>['rejected'] = [];
  const errors: IngestionSummary<TRecord>['errors'] = [];
  for (const item of raw) {
    try {
      const record = options.normalize(item);
      records.push(record);
      const verdict = options.validate(record);
      if (!verdict.ok) { rejected.push({ record, reason: verdict.reason ?? 'validation failed' }); errors.push({ code: 'VALIDATION_ERROR', message: verdict.reason ?? 'validation failed', context: { provider: options.provider.code } }); }
    } catch (error) { errors.push({ code: 'NORMALIZATION_ERROR', message: error instanceof Error ? error.message : 'normalization failed', context: { provider: options.provider.code } }); }
  }
  const valid = records.filter((record) => !rejected.some((item) => item.record === record));
  const written = options.dryRun ? [] : await Promise.all(valid.map((record) => options.writer.write(record)));
  return { provider: options.provider.code, requested: raw.length, normalized: records.length, valid: valid.length, rejected, wouldInsert: options.dryRun ? valid.length : written.filter((item) => item.action === 'inserted').length, wouldUpdate: options.dryRun ? 0 : written.filter((item) => item.action === 'updated').length, errors, written, records };
}
