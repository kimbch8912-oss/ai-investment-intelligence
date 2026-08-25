import type { TechnicalMetric } from '../types.ts';
import type { StockPricePoint } from './types.ts';

const number = (value: string) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const metric = (value: number | null, status: TechnicalMetric['status'], asOfTime: string | null): TechnicalMetric => ({ value, status, asOfTime, evidence: value === null ? [] : [{ id: 'technical:rsi14', type: 'CALCULATION', label: 'RSI 14', value }] });

/** Wilder RSI(14): simple averages for the first 14 changes, then recursive Wilder smoothing. */
export function rsi14(points: readonly StockPricePoint[]): TechnicalMetric {
  const sorted = [...points].sort((a, b) => a.marketTime.localeCompare(b.marketTime));
  const current = sorted.at(-1);
  if (sorted.length < 15) return metric(null, 'INSUFFICIENT_DATA', current?.marketTime ?? null);
  const closes = sorted.map((point) => number(point.close));
  if (closes.some((close) => close === null)) return metric(null, 'INVALID_INPUT', current!.marketTime);
  const values = closes as number[];
  let gains = 0, losses = 0;
  for (let i = 1; i <= 14; i += 1) { const change = values[i] - values[i - 1]; gains += Math.max(change, 0); losses += Math.max(-change, 0); }
  let averageGain = gains / 14, averageLoss = losses / 14;
  for (let i = 15; i < values.length; i += 1) { const change = values[i] - values[i - 1]; averageGain = (averageGain * 13 + Math.max(change, 0)) / 14; averageLoss = (averageLoss * 13 + Math.max(-change, 0)) / 14; }
  const value = averageLoss === 0 ? 100 : averageGain === 0 ? 0 : 100 - 100 / (1 + averageGain / averageLoss);
  return metric(value, 'VALID', current!.marketTime);
}
