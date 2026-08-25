import { IngestionError, type IngestionErrorCode } from './errors.ts';
import type { IngestionProvider } from './providers/types.ts';
import type { BatchIngestionSummary, BatchRecordResult, IngestionWriter, RecordStatus } from './types.ts';

type Validator<T> = (record: T) => { ok: boolean; reason?: string };
const now = () => new Date().toISOString();
const runId = () => crypto.randomUUID();

function classifiedError(error: unknown, fallback: IngestionErrorCode, context: Record<string, unknown>) {
  if (error instanceof IngestionError) return { code: error.code, message: error.message, context: { ...context, ...error.context }, retryable: error.retryable };
  return { code: fallback, message: error instanceof Error ? error.message : 'unexpected failure', context, retryable: false };
}

export async function runBatchIngestion<TInput, TRaw, TRecord>(options: {
  provider: IngestionProvider<TInput, TRaw[]>;
  input: TInput;
  normalize: (raw: TRaw) => TRecord;
  validate: Validator<TRecord>;
  writer: IngestionWriter<TRecord>;
  dryRun?: boolean;
}): Promise<BatchIngestionSummary<TRecord>> {
  const startedAt = now(); const id = runId();
  let raw: TRaw[];
  try { raw = await options.provider.fetch(options.input); } catch (error) {
    const providerError = classifiedError(error, 'PROVIDER_ERROR', { provider: options.provider.code, stage: 'fetch' });
    return { runId: id, provider: options.provider.code, startedAt, finishedAt: now(), runFailed: true, requested: 0, normalized: 0, valid: 0, inserted: 0, updated: 0, skipped: 0, rejected: 0, failed: 1, errors: [providerError], records: [] };
  }
  const records: BatchRecordResult<TRecord>[] = []; const errors: BatchIngestionSummary<TRecord>['errors'] = [];
  let normalized = 0; let valid = 0; let inserted = 0; let updated = 0; let skipped = 0; let rejected = 0; let failed = 0;
  for (const [index, item] of raw.entries()) {
    let record: TRecord;
    try { record = options.normalize(item); normalized += 1; } catch (error) {
      const detail = classifiedError(error, 'NORMALIZATION_ERROR', { provider: options.provider.code, recordIndex: index, stage: 'normalize' });
      records.push({ index, status: 'FAILED', error: detail }); errors.push(detail); failed += 1; continue;
    }
    const verdict = options.validate(record);
    if (!verdict.ok) {
      const detail = { code: 'VALIDATION_ERROR', message: verdict.reason ?? 'validation failed', context: { provider: options.provider.code, recordIndex: index, stage: 'validate' }, retryable: false };
      records.push({ index, status: 'REJECTED', record, error: { code: detail.code, message: detail.message, retryable: false } }); errors.push(detail); rejected += 1; continue;
    }
    valid += 1;
    if (options.dryRun) { records.push({ index, status: 'SKIPPED', record }); skipped += 1; continue; }
    try {
      const result = await options.writer.write(record);
      const status: RecordStatus = result.action === 'inserted' ? 'INSERTED' : result.action === 'updated' ? 'UPDATED' : 'SKIPPED';
      records.push({ index, status, record });
      if (status === 'INSERTED') inserted += 1; else if (status === 'UPDATED') updated += 1; else skipped += 1;
    } catch (error) {
      const detail = classifiedError(error, 'DATABASE_ERROR', { provider: options.provider.code, recordIndex: index, stage: 'write' });
      records.push({ index, status: 'FAILED', record, error: detail }); errors.push(detail); failed += 1;
    }
  }
  return { runId: id, provider: options.provider.code, startedAt, finishedAt: now(), runFailed: false, requested: raw.length, normalized, valid, inserted, updated, skipped, rejected, failed, errors, records };
}
