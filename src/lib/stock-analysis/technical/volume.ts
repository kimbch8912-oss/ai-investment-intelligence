import type { TechnicalMetric } from '../types.ts';
import type { StockPricePoint } from './types.ts';

const parse = (value: string) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const result = (id: string, value: number | null, status: TechnicalMetric['status'], asOfTime: string | null): TechnicalMetric => ({ value, status, asOfTime, evidence: value === null ? [] : [{ id: `technical:${id}`, type: 'CALCULATION', label: id, value }] });
export function volumeMetrics(points: readonly StockPricePoint[]): { volume: TechnicalMetric; volumeChange: TechnicalMetric; volumeMa20: TechnicalMetric } {
  const data = [...points].sort((a, b) => a.marketTime.localeCompare(b.marketTime)); const current = data.at(-1); const at = current?.marketTime ?? null;
  const values = data.map((point) => parse(point.volume));
  const volume = current ? result('volume', values.at(-1) ?? null, values.at(-1) === null ? 'INVALID_INPUT' : 'VALID', at) : result('volume', null, 'INSUFFICIENT_DATA', at);
  const previous = values.at(-2), latest = values.at(-1);
  const volumeChange = latest === null || latest === undefined || previous === null || previous === undefined || previous === 0 ? result('volume_change', null, data.length < 2 ? 'INSUFFICIENT_DATA' : 'INVALID_INPUT', at) : result('volume_change', latest / previous - 1, 'VALID', at);
  const sample = values.slice(-20);
  const volumeMa20 = sample.length < 20 ? result('volume_ma20', null, 'INSUFFICIENT_DATA', at) : sample.some((value) => value === null) ? result('volume_ma20', null, 'INVALID_INPUT', at) : result('volume_ma20', (sample as number[]).reduce((sum, value) => sum + value, 0) / 20, 'VALID', at);
  return { volume, volumeChange, volumeMa20 };
}
