import { inflationSignal, liquiditySignal, ratesSignal, yieldCurveSignal, growthSignal, economicMomentumSignal } from '../interpretation/macro.ts';
import { momentumSignal } from '../interpretation/momentum.ts';
import { drawdownRiskSignal, volatilityRiskSignal } from '../interpretation/risk.ts';
import { trendSignal } from '../interpretation/trend.ts';
import type { CalculationResult } from '../types.ts';
const calc = (metric: string, value: number | null, status: CalculationResult['status'] = 'VALID'): CalculationResult => ({ metric, value, unit: 'ratio', asOfTime: '2026-01-01T00:00:00Z', lookback: 20, inputCount: 20, status });
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
function main() {
  const strongUp = momentumSignal(calc('return_5d', .06), calc('return_20d', .08), calc('price_vs_ma20', .05)); assert(strongUp.direction === 'STRONG_POSITIVE' && strongUp.status === 'VALID', 'strong momentum');
  const weakUp = momentumSignal(calc('return_5d', .01), calc('return_20d', .005), calc('price_vs_ma20', .003)); assert(weakUp.direction === 'POSITIVE', 'weak momentum');
  const neutral = momentumSignal(calc('return_5d', .001), calc('return_20d', -.001), calc('price_vs_ma20', 0)); assert(neutral.direction === 'NEUTRAL', 'neutral momentum');
  const down = momentumSignal(calc('return_5d', -.05), calc('return_20d', -.08), calc('price_vs_ma20', -.05)); assert(down.direction === 'STRONG_NEGATIVE', 'down momentum');
  const trend = trendSignal(calc('price_vs_ma20', .05), calc('ma20', 110), calc('ma60', 100)); assert(trend.direction === 'STRONG_POSITIVE', 'trend');
  const highVol = volatilityRiskSignal(calc('volatility_20d_daily', .05)); const highDd = drawdownRiskSignal(calc('current_drawdown', -.2), calc('max_drawdown', -.3)); assert(highVol.state === 'HIGH' && highDd.state === 'HIGH', 'risk');
  assert(ratesSignal(calc('dgs2_bp', 25), calc('dgs10_bp', 20)).direction === 'STRONG_POSITIVE', 'rates rising'); assert(ratesSignal(calc('dgs2_bp', 0), calc('dgs10_bp', 1)).direction === 'NEUTRAL', 'rates stable'); assert(ratesSignal(calc('dgs2_bp', -25), calc('dgs10_bp', -20)).direction === 'STRONG_NEGATIVE', 'rates falling');
  const curves: Array<[number,string]> = [[1,'STEEP_POSITIVE'],[.2,'POSITIVE'],[0,'FLAT'],[-.2,'INVERTED'],[-1,'DEEPLY_INVERTED']]; for (const [value,state] of curves) assert(yieldCurveSignal(calc('spread', value)).state === state, `curve ${value}`);
  assert(inflationSignal(calc('mom', .01), calc('prior_mom', .002)).state === 'ACCELERATING', 'inflation'); assert(inflationSignal(calc('mom', .002), calc('prior_mom', .002)).state === 'STABLE', 'inflation stable'); assert(inflationSignal(calc('mom', -.01), calc('prior_mom', .002)).state === 'DECELERATING', 'inflation down');
  assert(growthSignal(calc('qoq', .03), calc('prior_qoq', .01)).state === 'IMPROVING', 'growth'); assert(growthSignal(calc('qoq', -.01), calc('prior_qoq', .01)).state === 'WEAKENING', 'growth weak');
  assert(liquiditySignal(calc('m2_mom', .01), calc('prior_m2_mom', 0)).state === 'EXPANDING', 'liquidity'); assert(liquiditySignal(calc('m2_mom', -.01), calc('prior_m2_mom', 0)).state === 'CONTRACTING', 'liquidity contraction');
  assert(economicMomentumSignal(calc('change', .03), calc('prior_change', .01)).state === 'ACCELERATING', 'economic momentum');
  const unknown = trendSignal(calc('price_vs_ma20', .01), calc('ma20', null, 'INSUFFICIENT_DATA'), calc('ma60', 100)); assert(unknown.direction === 'UNKNOWN' && unknown.strength === null, 'unknown propagation');
  assert(strongUp.evidence.length === 3 && strongUp.configVersion === 'm2b-v1', 'evidence/config'); assert(strongUp.direction !== highVol.direction, 'conflicting signals remain independent');
  console.log('M2-B structured signal QA PASS');
}
main();
