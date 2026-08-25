import { basisPointChange, economicChange, selectVintageAtOrBefore, treasurySpread } from '../calculations/change.ts';
import { drawdown } from '../calculations/drawdown.ts';
import { movingAverage } from '../calculations/moving-average.ts';
import { marketReturn } from '../calculations/returns.ts';
import { realizedVolatility } from '../calculations/volatility.ts';
import { buildEconomicSignal } from '../economic/economic-signal-engine.ts';
import { buildMarketSignal } from '../market/market-signal-engine.ts';
import type { EconomicPoint, MarketPricePoint } from '../types.ts';
const closeTo = (actual: number | null, expected: number, tolerance = 1e-10) => actual !== null && Math.abs(actual - expected) <= tolerance;
const market: MarketPricePoint[] = Array.from({ length: 100 }, (_, index) => ({ assetId: 'QA_ASSET', marketTime: new Date(Date.UTC(2026, 0, index + 1)).toISOString(), close: String(100 + index) }));
const monthly: EconomicPoint[] = ['2025-01-01','2025-02-01','2025-03-01','2025-04-01','2025-05-01','2025-06-01','2025-07-01','2025-08-01','2025-09-01','2025-10-01','2025-11-01','2025-12-01','2026-01-01'].map((observationDate, index) => ({ seriesId: 'QA_CPI', observationDate, value: String(100 + index * 2), vintageAt: '2026-02-01T00:00:00Z' }));
const quarterly: EconomicPoint[] = [['2025-01-01','100'],['2025-04-01','110'],['2025-07-01','115'],['2025-10-01','120'],['2026-01-01','130']].map(([observationDate,value]) => ({ seriesId: 'QA_GDP', observationDate, value, vintageAt: '2026-02-01T00:00:00Z' }));
const revision: EconomicPoint[] = [{ seriesId: 'QA_REVISION', observationDate: '2026-01-01', value: '100', vintageAt: '2026-01-15T00:00:00Z' }, { seriesId: 'QA_REVISION', observationDate: '2026-01-01', value: '105', vintageAt: '2026-02-15T00:00:00Z' }];
const downturn: MarketPricePoint[] = ['100','120','90','110'].map((close,index) => ({ assetId: 'QA_DD', marketTime: `2026-02-0${index + 1}T00:00:00Z`, close }));
function valid(value: { status: string; value: number | null }) { if (value.status !== 'VALID') throw new Error(`invalid calculation: ${JSON.stringify(value)}`); }
function main() {
  const r1 = marketReturn(market, 1); const r5 = marketReturn(market, 5); const r20 = marketReturn(market, 20); valid(r1); valid(r5); valid(r20); if (!closeTo(r1.value, 1 / 198) || !closeTo(r5.value, 5 / 194) || !closeTo(r20.value, 20 / 179)) throw new Error('return QA failed');
  const ma5 = movingAverage(market, 5); const ma20 = movingAverage(market, 20); valid(ma5); valid(ma20); if (!closeTo(ma5.value, 197) || !closeTo(ma20.value, 189.5) || movingAverage(market.slice(0, 20), 60).status !== 'INSUFFICIENT_DATA') throw new Error('moving average QA failed');
  const vol = realizedVolatility(market, 20); const annual = realizedVolatility(market, 20, 252); valid(vol); valid(annual); if (!(vol.value! > 0 && annual.value! > vol.value!)) throw new Error('volatility QA failed');
  const currentDd = drawdown(downturn, 4, 'current_drawdown'); const maxDd = drawdown(downturn, 4, 'max_drawdown'); valid(currentDd); valid(maxDd); if (!closeTo(currentDd.value, 110 / 120 - 1) || !closeTo(maxDd.value, 90 / 120 - 1)) throw new Error('drawdown QA failed');
  const mom = economicChange(monthly, 1, 'mom'); const yoy = economicChange(monthly, 12, 'yoy'); const qoq = economicChange(quarterly, 3, 'qoq'); const qyoy = economicChange(quarterly, 12, 'yoy'); valid(mom); valid(yoy); valid(qoq); valid(qyoy); if (!closeTo(mom.value, 2 / 122) || !closeTo(yoy.value, .24) || !closeTo(qoq.value, 10 / 120) || !closeTo(qyoy.value, .3)) throw new Error('economic calendar QA failed');
  const bp = basisPointChange('4.25','4.35','2026-01-01'); const spread = treasurySpread('4.35','3.95','2026-01-01'); valid(bp); valid(spread); if (!closeTo(bp.value, 10) || !closeTo(spread.value, .4)) throw new Error('rate/spread QA failed');
  const before = selectVintageAtOrBefore(revision, '2026-02-01T00:00:00Z'); const after = selectVintageAtOrBefore(revision, '2026-03-01T00:00:00Z'); if (before[0].value !== '100' || after[0].value !== '105') throw new Error('look-ahead QA failed');
  const snapshot = buildMarketSignal(market, 252); const economic = buildEconomicSignal(monthly, '2026-03-01T00:00:00Z'); if (!snapshot || !economic || snapshot.ma60.status !== 'VALID' || economic.yoy.status !== 'VALID') throw new Error('snapshot QA failed');
  console.log('M2-A fixture signal QA PASS');
}
main();
