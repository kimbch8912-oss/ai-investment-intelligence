import type { FundamentalDataSnapshot } from '../../types.ts';
import { date, finite } from './validator.ts';

type Report = Record<string, unknown>;
const report = (payload: unknown): Report => Array.isArray((payload as { annualReports?: unknown[] })?.annualReports) ? ((payload as { annualReports: Report[] }).annualReports[0] ?? {}) : {};
const metric = (overview: Report, name: string) => finite(overview[name]);
const field = (source: Report, name: string) => finite(source[name]);
export function mapAlphaVantageFundamental(overview: Report, incomePayload: unknown, balancePayload: unknown, cashPayload: unknown, retrievedAt: string, asset: { symbol: string; name: string; currency: string | null }): FundamentalDataSnapshot {
  const income = report(incomePayload), balance = report(balancePayload), cashFlow = report(cashPayload);
  const periodEnd = date(income.fiscalDateEnding) ?? date(overview.LatestQuarter) ?? retrievedAt;
  const revenueGrowth = metric(overview, 'QuarterlyRevenueGrowthYOY'); const epsGrowth = metric(overview, 'QuarterlyEarningsGrowthYOY');
  const operatingIncome = field(income, 'operatingIncome'); const netIncome = field(income, 'netIncome'); const revenue = field(income, 'totalRevenue');
  const operatingCashFlow = field(cashFlow, 'operatingCashflow'); const capitalExpenditures = field(cashFlow, 'capitalExpenditures');
  const cash = field(balance, 'cashAndCashEquivalentsAtCarryingValue'); const shortDebt = field(balance, 'shortTermDebt') ?? 0; const longDebt = field(balance, 'longTermDebt') ?? 0;
  const totalDebt = shortDebt + longDebt; const equity = field(balance, 'totalShareholderEquity');
  const metrics = { revenueGrowth, operatingIncomeGrowth: null, netIncomeGrowth: epsGrowth, epsGrowth, operatingMargin: metric(overview, 'OperatingMarginTTM'), netMargin: metric(overview, 'ProfitMargin'), roe: metric(overview, 'ReturnOnEquityTTM'), operatingCashFlow, freeCashFlow: operatingCashFlow !== null && capitalExpenditures !== null ? operatingCashFlow + capitalExpenditures : null, freeCashFlowMargin: null, totalDebt, cash, debtToEquity: totalDebt !== null && equity && equity !== 0 ? totalDebt / equity : null, netDebt: cash !== null ? totalDebt - cash : null, pe: metric(overview, 'TrailingPE') ?? metric(overview, 'PERatio'), pb: metric(overview, 'PriceToBookRatio'), evEbitda: metric(overview, 'EVToEBITDA') };
  const known = Object.values(metrics).filter((value) => value !== null && value !== undefined).length;
  return { snapshot: { asset: { symbol: asset.symbol, name: asset.name, currency: asset.currency ?? 'USD' }, asOfTime: periodEnd, reportingPeriod: { periodEnd }, financials: { revenue, operatingIncome, netIncome }, growth: { revenueGrowth, epsGrowth }, profitability: { operatingMargin: metrics.operatingMargin, netMargin: metrics.netMargin, roe: metrics.roe }, balanceSheet: { cash, totalDebt, equity }, cashFlow: { operatingCashFlow, freeCashFlow: metrics.freeCashFlow }, valuation: { pe: metrics.pe, pb: metrics.pb, evEbitda: metrics.evEbitda }, quality: { coverage: known / 15, confidence: known / 15, status: known >= 10 ? 'COMPLETE' : 'PARTIAL' }, evidence: [], sourceStatus: known >= 10 ? 'READY' : 'PARTIAL', direction: 'UNKNOWN' }, metrics };
}
