import type { TechnicalMetric } from '../types.ts';
import type { StockPricePoint } from './types.ts';

const parse = (value: string) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const make = (id: string, value: readonly number[] | null, status: TechnicalMetric['status'], asOfTime: string | null): TechnicalMetric => ({ value, status, asOfTime, evidence: value === null ? [] : [{ id: `technical:${id}`, type: 'CALCULATION', label: id }] });
/** Local extrema over the trailing 20 sessions; return up to three closest valid levels on each side of current close. */
export function supportResistance(points: readonly StockPricePoint[], window = 20): { supportLevels: TechnicalMetric; resistanceLevels: TechnicalMetric } {
  const data = [...points].sort((a, b) => a.marketTime.localeCompare(b.marketTime)).slice(-window); const current = data.at(-1); const at = current?.marketTime ?? null;
  if (data.length < 3 || !current) return { supportLevels: make('support_levels', null, 'INSUFFICIENT_DATA', at), resistanceLevels: make('resistance_levels', null, 'INSUFFICIENT_DATA', at) };
  const close = parse(current.close); const highs = data.map((x) => parse(x.high)); const lows = data.map((x) => parse(x.low));
  if (close === null || highs.some((x) => x === null) || lows.some((x) => x === null)) return { supportLevels: make('support_levels', null, 'INVALID_INPUT', at), resistanceLevels: make('resistance_levels', null, 'INVALID_INPUT', at) };
  const localHighs: number[] = [], localLows: number[] = [];
  for (let i = 1; i < data.length - 1; i += 1) { if (highs[i]! >= highs[i - 1]! && highs[i]! >= highs[i + 1]!) localHighs.push(highs[i]!); if (lows[i]! <= lows[i - 1]! && lows[i]! <= lows[i + 1]!) localLows.push(lows[i]!); }
  const unique = (items: number[]) => [...new Set(items.map((x) => Number(x.toFixed(8))))];
  const supports = unique(localLows.filter((x) => x <= close)).sort((a, b) => b - a).slice(0, 3);
  const resistances = unique(localHighs.filter((x) => x >= close)).sort((a, b) => a - b).slice(0, 3);
  return { supportLevels: make('support_levels', supports, 'VALID', at), resistanceLevels: make('resistance_levels', resistances, 'VALID', at) };
}
