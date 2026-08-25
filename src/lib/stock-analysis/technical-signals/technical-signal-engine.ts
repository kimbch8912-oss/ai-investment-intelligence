import type { AgentEvidence } from '../../agents/types.ts';
import type { TechnicalMetric } from '../types.ts';
import { technicalSignalConfig as config } from './config.ts';
import type { LevelPosition, MomentumSignal, RiskSignal, RsiState, TechnicalSignalContext, TrendSignal, VolumeConfirmation } from './types.ts';
import type { TechnicalContext } from '../types.ts';

const value = (metric: TechnicalMetric): number | null => typeof metric.value === 'number' && metric.status === 'VALID' ? metric.value : null;
const levels = (metric: TechnicalMetric): readonly number[] | null => Array.isArray(metric.value) && metric.status === 'VALID' ? metric.value : null;
const available = (metric: TechnicalMetric) => metric.status === 'VALID';
const evidence = (...metrics: TechnicalMetric[]): readonly AgentEvidence[] => metrics.flatMap((metric) => metric.evidence);

function trend(technical: TechnicalContext): { signal: TrendSignal; evidence: readonly AgentEvidence[]; unknown?: string } {
  const metrics = [technical.price, technical.ma20, technical.ma60, technical.ma120]; const [price, ma20, ma60, ma120] = metrics.map(value);
  if ([price, ma20, ma60, ma120].some((item) => item === null)) return { signal: 'UNKNOWN', evidence: evidence(...metrics), unknown: 'trend requires valid price, MA20, MA60, and MA120' };
  if (price! > ma20! && ma20! > ma60! && ma60! > ma120!) return { signal: 'STRONG_UPTREND', evidence: evidence(...metrics) };
  if (price! < ma20! && ma20! < ma60! && ma60! < ma120!) return { signal: 'STRONG_DOWNTREND', evidence: evidence(...metrics) };
  if (price! > ma20! && ma20! > ma60!) return { signal: 'UPTREND', evidence: evidence(...metrics) };
  if (price! < ma20! && ma20! < ma60!) return { signal: 'DOWNTREND', evidence: evidence(...metrics) };
  return { signal: 'NEUTRAL', evidence: evidence(...metrics) };
}
function momentum(technical: TechnicalContext): { signal: MomentumSignal; evidence: readonly AgentEvidence[]; unknown?: string } {
  const metrics = [technical.return5D, technical.return20D]; const [five, twenty] = metrics.map(value);
  if (five === null || twenty === null) return { signal: 'UNKNOWN', evidence: evidence(...metrics), unknown: 'momentum requires valid Return5D and Return20D' };
  if (five >= config.momentum.positiveReturn && twenty >= config.momentum.positiveReturn) return { signal: 'POSITIVE', evidence: evidence(...metrics) };
  if (five <= config.momentum.negativeReturn && twenty <= config.momentum.negativeReturn) return { signal: 'NEGATIVE', evidence: evidence(...metrics) };
  return { signal: 'NEUTRAL', evidence: evidence(...metrics) };
}
function rsi(technical: TechnicalContext): { signal: RsiState; evidence: readonly AgentEvidence[]; unknown?: string } {
  const item = value(technical.rsi14); if (item === null) return { signal: 'UNKNOWN', evidence: evidence(technical.rsi14), unknown: 'RSI state requires valid RSI14' };
  const signal: RsiState = item >= config.rsi.overbought ? 'OVERBOUGHT' : item >= config.rsi.strong ? 'STRONG' : item <= config.rsi.oversold ? 'OVERSOLD' : item <= config.rsi.weak ? 'WEAK' : 'NEUTRAL';
  return { signal, evidence: evidence(technical.rsi14) };
}
function volatility(technical: TechnicalContext): { signal: RiskSignal; evidence: readonly AgentEvidence[]; unknown?: string } {
  const item = value(technical.realizedVolatility); if (item === null) return { signal: 'UNKNOWN', evidence: evidence(technical.realizedVolatility), unknown: 'volatility risk requires valid realized volatility' };
  const signal: RiskSignal = item <= config.volatilityDaily.low ? 'LOW' : item <= config.volatilityDaily.normal ? 'NORMAL' : item <= config.volatilityDaily.elevated ? 'ELEVATED' : 'HIGH';
  return { signal, evidence: evidence(technical.realizedVolatility) };
}
function drawdown(technical: TechnicalContext): { signal: RiskSignal; evidence: readonly AgentEvidence[]; unknown?: string } {
  const item = value(technical.drawdown); if (item === null) return { signal: 'UNKNOWN', evidence: evidence(technical.drawdown), unknown: 'drawdown risk requires valid current drawdown' };
  const signal: RiskSignal = item >= config.drawdown.low ? 'LOW' : item >= config.drawdown.normal ? 'NORMAL' : item >= config.drawdown.elevated ? 'ELEVATED' : 'HIGH';
  return { signal, evidence: evidence(technical.drawdown) };
}
function volume(technical: TechnicalContext): { signal: VolumeConfirmation; evidence: readonly AgentEvidence[]; unknown?: string } {
  const metrics = [technical.return1D, technical.volume, technical.volumeChange, technical.volumeMa20]; const [move, currentVolume, change, average] = metrics.map(value);
  if (move === null || currentVolume === null || change === null || average === null) return { signal: 'UNKNOWN', evidence: evidence(...metrics), unknown: 'volume confirmation requires valid Return1D, volume, volume change, and volume MA20' };
  if (move === 0) return { signal: 'NEUTRAL', evidence: evidence(...metrics) };
  const confirms = change > config.volume.minimumChange && currentVolume >= average;
  if (move > 0 && confirms) return { signal: 'CONFIRMING_UP', evidence: evidence(...metrics) };
  if (move < 0 && confirms) return { signal: 'CONFIRMING_DOWN', evidence: evidence(...metrics) };
  return { signal: 'WEAK_CONFIRMATION', evidence: evidence(...metrics) };
}
function position(technical: TechnicalContext): { signal: LevelPosition; evidence: readonly AgentEvidence[]; unknown?: string } {
  const metrics = [technical.price, technical.supportLevels, technical.resistanceLevels]; const price = value(technical.price), support = levels(technical.supportLevels), resistance = levels(technical.resistanceLevels);
  if (price === null || support === null || resistance === null) return { signal: 'UNKNOWN', evidence: evidence(...metrics), unknown: 'level position requires valid price, support levels, and resistance levels' };
  if (support.length === 0 && resistance.length === 0) return { signal: 'UNKNOWN', evidence: evidence(...metrics), unknown: 'no M5-B support or resistance levels are available' };
  if (resistance.length === 0) return { signal: 'BREAKOUT', evidence: evidence(...metrics) };
  if (support.length === 0) return { signal: 'BREAKDOWN', evidence: evidence(...metrics) };
  const nearestSupport = Math.max(...support), nearestResistance = Math.min(...resistance);
  const supportDistance = Math.abs(price - nearestSupport) / price, resistanceDistance = Math.abs(nearestResistance - price) / price;
  if (supportDistance <= config.levels.proximityRatio && supportDistance <= resistanceDistance) return { signal: 'NEAR_SUPPORT', evidence: evidence(...metrics) };
  if (resistanceDistance <= config.levels.proximityRatio) return { signal: 'NEAR_RESISTANCE', evidence: evidence(...metrics) };
  return { signal: 'BETWEEN_LEVELS', evidence: evidence(...metrics) };
}

/** Converts an already-calculated M5-B context into deterministic states; no indicator is recalculated. */
export function createTechnicalSignalContext(technical: TechnicalContext): TechnicalSignalContext {
  const trendSignal = trend(technical), momentumSignal = momentum(technical), rsiSignal = rsi(technical), volatilitySignal = volatility(technical), drawdownSignal = drawdown(technical), volumeSignal = volume(technical), positionSignal = position(technical);
  const signals = [trendSignal, momentumSignal, rsiSignal, volatilitySignal, drawdownSignal, volumeSignal, positionSignal];
  const unknowns = signals.flatMap((signal) => signal.unknown ? [signal.unknown] : []);
  const seen = new Set<string>(); const mergedEvidence = signals.flatMap((signal) => signal.evidence).filter((item) => !seen.has(item.id) && !!seen.add(item.id));
  const inputMetrics = [technical.price, technical.ma20, technical.ma60, technical.ma120, technical.return1D, technical.return5D, technical.return20D, technical.rsi14, technical.realizedVolatility, technical.drawdown, technical.volume, technical.volumeChange, technical.volumeMa20, technical.supportLevels, technical.resistanceLevels];
  const confidence = inputMetrics.filter(available).length / inputMetrics.length;
  return { trend: trendSignal.signal, momentum: momentumSignal.signal, rsiState: rsiSignal.signal, volatilityRisk: volatilitySignal.signal, drawdownRisk: drawdownSignal.signal, volumeConfirmation: volumeSignal.signal, levelPosition: positionSignal.signal, confidence: confidence === 0 ? null : confidence, evidence: mergedEvidence, unknowns, asOfTime: technical.asOfTime, configVersion: config.version };
}
