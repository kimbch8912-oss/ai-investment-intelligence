import { drawdown } from '../../signals/calculations/drawdown.ts';
import { movingAverage, priceVsMovingAverage } from '../../signals/calculations/moving-average.ts';
import { marketReturn } from '../../signals/calculations/returns.ts';
import { realizedVolatility } from '../../signals/calculations/volatility.ts';
import type { CalculationResult, MarketPricePoint } from '../../signals/types.ts';
import type { AgentEvidence } from '../../agents/types.ts';
import type { TechnicalContext, TechnicalMetric } from '../types.ts';
import { rsi14 } from './rsi.ts';
import { supportResistance } from './support-resistance.ts';
import type { StockPricePoint, TechnicalEngineInput } from './types.ts';
import { volumeMetrics } from './volume.ts';

export class TechnicalInputError extends Error {}
const calcMetric = (calculation: CalculationResult, unknownWhenInsufficient = false): TechnicalMetric => ({
  value: calculation.value,
  status: unknownWhenInsufficient && calculation.status === 'INSUFFICIENT_DATA' ? 'UNKNOWN' : calculation.status,
  asOfTime: calculation.asOfTime,
  evidence: calculation.value === null ? [] : [{ id: `technical:${calculation.metric}`, type: 'CALCULATION', label: calculation.metric, value: calculation.value }],
});
const directMetric = (id: string, value: number | null, at: string | null, status: TechnicalMetric['status']): TechnicalMetric => ({ value, status, asOfTime: at, evidence: value === null ? [] : [{ id: `technical:${id}`, type: 'CALCULATION', label: id, value }] });
const allEvidence = (metrics: readonly TechnicalMetric[]): readonly AgentEvidence[] => metrics.flatMap((metric) => metric.evidence);

/** Deterministic M5-B calculation boundary. It uses only observations at or before asOfTime. */
export function calculateTechnicalContext(input: TechnicalEngineInput): TechnicalContext {
  if (input.interval !== '1d' || !input.assetId || !input.asOfTime) throw new TechnicalInputError('assetId, 1d interval, and asOfTime are required.');
  if (input.prices.some((point) => point.assetId !== input.assetId || point.interval !== '1d')) throw new TechnicalInputError('Price series must contain only the requested 1d asset.');
  const prices = input.prices.filter((point) => point.marketTime <= input.asOfTime).map((point) => ({ ...point })).sort((a, b) => a.marketTime.localeCompare(b.marketTime));
  const marketPoints: MarketPricePoint[] = prices.map(({ assetId, marketTime, close }) => ({ assetId, marketTime, close }));
  const current = prices.at(-1); const numeric = (text: string | undefined) => text !== undefined && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
  const price = current ? directMetric('price', numeric(current.close), current.marketTime, numeric(current.close) === null ? 'INVALID_INPUT' : 'VALID') : directMetric('price', null, null, 'INSUFFICIENT_DATA');
  const returns = [calcMetric(marketReturn(marketPoints, 1)), calcMetric(marketReturn(marketPoints, 5)), calcMetric(marketReturn(marketPoints, 20))];
  const mas = [calcMetric(movingAverage(marketPoints, 20)), calcMetric(movingAverage(marketPoints, 60), true), calcMetric(movingAverage(marketPoints, 120), true)];
  const priceVs = [calcMetric(priceVsMovingAverage(marketPoints, 20)), calcMetric(priceVsMovingAverage(marketPoints, 60), true), calcMetric(priceVsMovingAverage(marketPoints, 120), true)];
  const volatility = calcMetric(realizedVolatility(marketPoints, 20));
  const currentDrawdown = calcMetric(drawdown(marketPoints, prices.length, 'current_drawdown'));
  const maxDrawdown = calcMetric(drawdown(marketPoints, prices.length, 'max_drawdown'));
  const volume = volumeMetrics(prices); const levels = supportResistance(prices);
  const metrics = [price, volume.volume, ...returns, ...mas, ...priceVs, rsi14(prices), volatility, currentDrawdown, maxDrawdown, volume.volumeChange, volume.volumeMa20, levels.supportLevels, levels.resistanceLevels];
  const validCount = metrics.filter((metric) => metric.status === 'VALID').length;
  return {
    status: validCount === 0 ? 'UNKNOWN' : validCount === metrics.length ? 'AVAILABLE' : 'PARTIAL',
    confidence: validCount === 0 ? null : validCount / metrics.length,
    asOfTime: current?.marketTime ?? null,
    evidence: allEvidence(metrics),
    price, volume: volume.volume, return1D: returns[0], return5D: returns[1], return20D: returns[2],
    ma20: mas[0], ma60: mas[1], ma120: mas[2], priceVsMa20: priceVs[0], priceVsMa60: priceVs[1], priceVsMa120: priceVs[2],
    rsi14: rsi14(prices), realizedVolatility: volatility, drawdown: currentDrawdown, maxDrawdown,
    volumeChange: volume.volumeChange, volumeMa20: volume.volumeMa20, supportLevels: levels.supportLevels, resistanceLevels: levels.resistanceLevels,
  };
}
