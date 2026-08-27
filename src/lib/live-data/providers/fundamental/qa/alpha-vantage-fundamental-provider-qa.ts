import { strict as assert } from 'node:assert';
import { AlphaVantageFundamentalProvider } from '../alpha-vantage-fundamental-provider.ts';

process.env.ALPHA_VANTAGE_API_KEY = 'fixture-key';
const asset = { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', market: 'NASDAQ', country: 'US', currency: 'USD', timezone: 'America/New_York', identifiers: [] } as const;
const overview = { LatestQuarter: '2026-08-15', QuarterlyRevenueGrowthYOY: '0.2', QuarterlyEarningsGrowthYOY: '0.2', OperatingMarginTTM: '0.5', ProfitMargin: '0.4', ReturnOnEquityTTM: '1', TrailingPE: '30', PriceToBookRatio: '20', EVToEBITDA: '25' };
const reports = (values: Record<string, string>) => ({ annualReports: [{ fiscalDateEnding: '2026-08-15', ...values }] });
const valid = [overview, reports({ operatingIncome: '50', netIncome: '40', totalRevenue: '100' }), reports({ cashAndCashEquivalentsAtCarryingValue: '40', shortTermDebt: '5', longTermDebt: '15', totalShareholderEquity: '100' }), reports({ operatingCashflow: '60', capitalExpenditures: '-10' })];
const fetcher = (payloads: unknown[]) => (async () => new Response(JSON.stringify(payloads.shift()), { status: 200 })) as typeof fetch;
const code = async (payloads: unknown[]) => (await new AlphaVantageFundamentalProvider(fetcher(payloads)).getFundamentalData({ asset, asOfTime: '2026-08-20T00:00:00.000Z' })).errors[0]?.code;
async function main() {
  assert.equal((await new AlphaVantageFundamentalProvider(fetcher([...valid])).getFundamentalData({ asset, asOfTime: '2026-08-20T00:00:00.000Z' })).status, 'READY');
  assert.equal(await code([{ Information: 'quota' }, ...valid]), 'PROVIDER_QUOTA');
  assert.equal(await code([{ Note: 'rate limit' }, ...valid]), 'PROVIDER_RATE_LIMIT');
  assert.equal(await code([{ 'Error Message': 'invalid API call' }, ...valid]), 'PROVIDER_AUTH_ERROR');
  assert.equal(await code([{}, ...valid]), 'PROVIDER_RESPONSE_ERROR');
  const offline = new AlphaVantageFundamentalProvider((async () => { throw new TypeError('network'); }) as typeof fetch); assert.equal((await offline.getFundamentalData({ asset, asOfTime: '2026-08-20T00:00:00.000Z' })).errors[0]?.code, 'PROVIDER_NETWORK_ERROR');
  console.log('Alpha Vantage fundamental provider QA PASS: ready/quota/rate-limit/auth/response/network');
}
main();
