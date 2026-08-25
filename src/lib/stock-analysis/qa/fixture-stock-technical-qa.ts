import { realizedVolatility } from '../../signals/calculations/volatility.ts';
import { calculateTechnicalContext } from '../technical/technical-engine.ts';
import { rsi14 } from '../technical/rsi.ts';
import type { StockPricePoint } from '../technical/types.ts';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const at = (day: number) => new Date(Date.UTC(2026, 0, day)).toISOString();
const series = (closes: number[]): StockPricePoint[] => closes.map((close, index) => ({ assetId: 'asset-1', interval: '1d', marketTime: at(index + 1), open: String(close), high: String(close + 1), low: String(close - 1), close: String(close), volume: String(1000 + index * 10) }));
const run = (prices: StockPricePoint[], asOfTime = prices.at(-1)!.marketTime) => calculateTechnicalContext({ assetId: 'asset-1', interval: '1d', prices, asOfTime });

const up = run(series(Array.from({ length: 130 }, (_, i) => 100 + i)));
assert((up.return1D.value as number) > 0 && (up.return5D.value as number) > 0 && (up.price.value as number) > (up.ma20.value as number) && (up.price.value as number) > (up.ma60.value as number), 'A uptrend return and MA');
const down = run(series([...Array.from({ length: 100 }, (_, i) => 200 + i), ...Array.from({ length: 30 }, (_, i) => 300 - i * 4)]));
assert((down.return20D.value as number) < 0 && (down.drawdown.value as number) < 0 && (down.maxDrawdown.value as number) < 0, 'B downtrend and drawdown');
const rsiCloses = [44.34,44.09,44.15,43.61,44.33,44.83,45.10,45.42,45.84,46.08,45.89,46.03,45.61,46.28,46.28,46.00,46.03,46.41,46.22,45.64,46.21];
const known = rsi14(series(rsiCloses)); assert(known.status === 'VALID' && Math.abs((known.value as number) - 62.88) < .02, 'C RSI Wilder fixture');
const fixture = series(Array.from({ length: 30 }, (_, i) => 100 + (i % 3) * 2)); const technical = run(fixture);
const m2Vol = realizedVolatility(fixture.map(({ assetId, marketTime, close }) => ({ assetId, marketTime, close })), 20);
assert(technical.realizedVolatility.value === m2Vol.value, 'D volatility reuses M2');
const short = run(series(Array.from({ length: 19 }, (_, i) => 100 + i)));
assert(short.ma20.status === 'INSUFFICIENT_DATA' && short.return20D.status === 'INSUFFICIENT_DATA', 'E missing 20D');
const sixty = run(series(Array.from({ length: 40 }, (_, i) => 100 + i)));
assert(sixty.ma20.status === 'VALID' && sixty.ma60.status === 'UNKNOWN' && sixty.ma120.status === 'UNKNOWN', 'F long MA unknown without blocking others');
assert(technical.volumeMa20.status === 'VALID' && Math.abs((technical.volumeChange.value as number) - 10 / 1280) < 1e-12, 'G volume');
const levels = run([{ assetId:'asset-1',interval:'1d',marketTime:at(1),open:'100',high:'101',low:'99',close:'100',volume:'1' },{ assetId:'asset-1',interval:'1d',marketTime:at(2),open:'102',high:'105',low:'100',close:'102',volume:'1' },{ assetId:'asset-1',interval:'1d',marketTime:at(3),open:'99',high:'101',low:'98',close:'100',volume:'1' },{ assetId:'asset-1',interval:'1d',marketTime:at(4),open:'102',high:'104',low:'100',close:'102',volume:'1' }]);
assert((levels.supportLevels.value as number[]).includes(98) && (levels.resistanceLevels.value as number[]).includes(105), 'H deterministic levels');
const lookahead = series(Array.from({ length: 25 }, (_, i) => 100 + i)); lookahead.push({ ...lookahead.at(-1)!, marketTime: at(26), close: '999', high: '1000', low: '998' }); const before = JSON.stringify(lookahead);
assert(run(lookahead, at(25)).price.value === 124, 'I no look-ahead'); assert(JSON.stringify(lookahead) === before, 'J input immutability');
console.log('M5-B stock technical engine QA PASS');
