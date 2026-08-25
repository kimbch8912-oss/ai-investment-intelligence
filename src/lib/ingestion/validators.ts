import { marketIntervals, type NormalizedEconomicObservation, type NormalizedMarketPrice } from './types.ts';

export interface ValidationResult { ok: boolean; reason?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const decimal = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const signedDecimal = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const date = /^\d{4}-\d{2}-\d{2}$/;
const timestamp = (value: string) => Number.isFinite(Date.parse(value));

export function validateMarketPrice(record: NormalizedMarketPrice): ValidationResult {
  if (!uuid.test(record.assetId) || !uuid.test(record.sourceId)) return { ok: false, reason: 'assetId and sourceId must be UUIDs' };
  if (!marketIntervals.includes(record.interval)) return { ok: false, reason: 'unsupported interval' };
  if (!timestamp(record.marketTime) || !timestamp(record.retrievedAt)) return { ok: false, reason: 'invalid timestamp' };
  const values = [record.open, record.high, record.low, record.close, record.adjustedClose];
  if (!values.some((value) => value !== undefined)) return { ok: false, reason: 'at least one price is required' };
  if (![...values, record.volume].filter((value): value is string => value !== undefined).some((value) => !decimal.test(value))) return record.currency && !/^[A-Z]{3}$/.test(record.currency) ? { ok: false, reason: 'currency must be ISO-4217 alpha-3 uppercase' } : { ok: true };
  return { ok: false, reason: 'prices and volume must be non-negative decimal strings' };
}

export function validateEconomicObservation(record: NormalizedEconomicObservation): ValidationResult {
  if (!uuid.test(record.seriesId)) return { ok: false, reason: 'seriesId must be a UUID' };
  if (!date.test(record.observationDate)) return { ok: false, reason: 'observationDate must be YYYY-MM-DD' };
  if (!timestamp(record.vintageAt) || !timestamp(record.retrievedAt)) return { ok: false, reason: 'invalid vintageAt or retrievedAt' };
  if (record.value === undefined && !record.valueText) return { ok: false, reason: 'value or valueText is required' };
  if (record.value !== undefined && !signedDecimal.test(record.value)) return { ok: false, reason: 'value must be a decimal string' };
  return { ok: true };
}
