import { createStockFundamentalContext } from '../fundamental/fundamental-context-engine.ts';
import type { StockFundamentalInput } from '../fundamental/types.ts';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const at = '2026-08-25T00:00:00.000Z'; const evidence = [{ id: 'fundamental:fixture', type: 'CALCULATION' as const, label: 'fixture' }];
const base = (): StockFundamentalInput => ({ snapshot: { asset: { symbol: 'NVDA', name: 'NVDA', currency: 'USD' }, asOfTime: at, reportingPeriod: { periodEnd: at }, financials: {}, growth: {}, profitability: {}, balanceSheet: {}, cashFlow: {}, quality: { coverage: 1, confidence: 1, status: 'COMPLETE' }, evidence, sourceStatus: 'FIXTURE', direction: 'UNKNOWN' }, metrics: { revenueGrowth: .25, operatingIncomeGrowth: .30, netIncomeGrowth: .35, epsGrowth: .30, operatingMargin: .25, netMargin: .20, roe: .25, operatingCashFlow: 100, freeCashFlow: 80, freeCashFlowMargin: .15, totalDebt: 20, cash: 100, debtToEquity: .2, netDebt: -80, pe: 30, pb: 5, evEbitda: 20 }, benchmark: { pe: 20, pb: 3, evEbitda: 12 } });
let output = createStockFundamentalContext(base());
assert(output.growthState === 'STRONG', 'A strong growth');
output = createStockFundamentalContext({ ...base(), metrics: { ...base().metrics, revenueGrowth: -.1, operatingIncomeGrowth: -.2, netIncomeGrowth: -.1, epsGrowth: -.1 } });
assert(output.growthState === 'WEAK', 'B weak growth');
assert(createStockFundamentalContext(base()).profitabilityState === 'STRONG', 'C strong profitability');
output = createStockFundamentalContext({ ...base(), metrics: { ...base().metrics, freeCashFlow: -1, freeCashFlowMargin: -.01 } });
assert(output.growthState === 'STRONG' && output.cashFlowState === 'NEGATIVE', 'D growth and cash flow remain independent');
assert(createStockFundamentalContext(base()).balanceSheetState === 'STRONG', 'E strong balance sheet');
output = createStockFundamentalContext({ ...base(), metrics: { ...base().metrics, debtToEquity: 2, netDebt: 200, cash: 100 } });
assert(output.balanceSheetState === 'LEVERAGED', 'F leveraged');
assert(createStockFundamentalContext(base()).valuationState === 'EXPENSIVE', 'G expensive with benchmark');
assert(createStockFundamentalContext({ ...base(), benchmark: undefined }).valuationState === 'UNKNOWN', 'H valuation lacks benchmark');
output = createStockFundamentalContext({ ...base(), metrics: { ...base().metrics, freeCashFlow: -1 } });
assert(output.earningsQualityState === 'LOW', 'I earnings quality mismatch');
output = createStockFundamentalContext({ ...base(), metrics: {} });
assert(output.confidence === null && output.growthState === 'UNKNOWN' && output.cashFlowState === 'UNKNOWN', 'J missing financials');
const input = base(); const before = JSON.stringify(input); output = createStockFundamentalContext(input);
assert(output.evidence.every((item) => input.snapshot.evidence.some((source) => source.id === item.id)), 'K evidence scope'); assert(JSON.stringify(input) === before, 'L input immutability');
console.log('M5-E stock fundamental context QA PASS');
