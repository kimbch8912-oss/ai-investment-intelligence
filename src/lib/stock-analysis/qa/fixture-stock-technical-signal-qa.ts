import { createTechnicalSignalContext } from '../technical-signals/technical-signal-engine.ts';
import type { TechnicalContext, TechnicalMetric } from '../types.ts';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const at = '2026-08-25T00:00:00.000Z';
const metric = (value: number | readonly number[] | null, status: TechnicalMetric['status'] = 'VALID'): TechnicalMetric => ({ value, status, asOfTime: at, evidence: value === null ? [] : [{ id: `e:${String(value)}`, type: 'CALCULATION', label: 'fixture' }] });
const fixture = (): TechnicalContext => ({
  status: 'AVAILABLE', confidence: 1, asOfTime: at, evidence: [],
  price: metric(130), volume: metric(120), return1D: metric(.02), return5D: metric(.03), return20D: metric(.04),
  ma20: metric(120), ma60: metric(110), ma120: metric(100), priceVsMa20: metric(.08), priceVsMa60: metric(.18), priceVsMa120: metric(.3),
  rsi14: metric(65), realizedVolatility: metric(.015), drawdown: metric(-.03), maxDrawdown: metric(-.08), volumeChange: metric(.1), volumeMa20: metric(100), supportLevels: metric([120]), resistanceLevels: metric([140]),
});
const run = (edit?: (context: TechnicalContext) => void) => { const context = fixture(); edit?.(context); return createTechnicalSignalContext(context); };

assert(run().trend === 'STRONG_UPTREND', 'strong uptrend');
assert(run((x) => { x.price = metric(90); x.ma20 = metric(100); x.ma60 = metric(110); x.ma120 = metric(120); }).trend === 'STRONG_DOWNTREND', 'downtrend');
assert(run((x) => { x.rsi14 = metric(75); }).rsiState === 'OVERBOUGHT', 'overbought');
assert(run((x) => { x.rsi14 = metric(25); }).rsiState === 'OVERSOLD', 'oversold');
assert(run((x) => { x.realizedVolatility = metric(.04); }).volatilityRisk === 'HIGH', 'high volatility');
assert(run((x) => { x.drawdown = metric(-.25); }).drawdownRisk === 'HIGH', 'high drawdown');
assert(run().volumeConfirmation === 'CONFIRMING_UP', 'volume confirmation');
assert(run((x) => { x.price = metric(121); }).levelPosition === 'NEAR_SUPPORT', 'near support');
assert(run((x) => { x.price = metric(139); }).levelPosition === 'NEAR_RESISTANCE', 'near resistance');
const mixed = run((x) => { x.return5D = metric(.03); x.return20D = metric(-.03); x.rsi14 = metric(50); });
assert(mixed.trend === 'STRONG_UPTREND' && mixed.momentum === 'NEUTRAL' && mixed.rsiState === 'NEUTRAL', 'mixed signals are preserved');
const missing = run((x) => { x.ma120 = metric(null, 'UNKNOWN'); x.return20D = metric(null, 'INSUFFICIENT_DATA'); });
assert(missing.trend === 'UNKNOWN' && missing.momentum === 'UNKNOWN' && missing.unknowns.length >= 2, 'missing data remains unknown');
const input = fixture(); const before = JSON.stringify(input); const output = createTechnicalSignalContext(input);
assert(output.asOfTime === at, 'no look-ahead: uses only M5-B asOfTime'); assert(JSON.stringify(input) === before, 'input immutability');
console.log('M5-C stock technical signal QA PASS');
