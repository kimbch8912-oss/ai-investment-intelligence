import { runM2Pipeline } from '../analysis/m2-pipeline.ts';
import { runMacroAgent } from '../agents/macro/macro-agent.ts';
import { DeterministicMacroFixtureClient } from '../agents/macro/fixture-client.ts';
import { runGlobalMarketAgent } from '../agents/global-market/global-market-agent.ts';
import { DeterministicGlobalMarketFixtureClient } from '../agents/global-market/fixture-client.ts';
import type { SourceEnvelope } from './types.ts';
import type { MacroAgentOutput } from '../agents/macro/types.ts';
import type { GlobalMarketOutput } from '../agents/global-market/types.ts';
import { FredMacroProvider } from './providers/macro/fred-macro-provider.ts';
import { fredSeries } from './providers/macro/validator.ts';
import { MacroCacheService } from './persistence/macro-cache-service.ts';
import { economicPoints, marketPoints } from './providers/macro/mapper.ts';

type LiveMacro = { macro: SourceEnvelope<MacroAgentOutput>; global: SourceEnvelope<GlobalMarketOutput>; summary: readonly [string, string][] };
const shared = new Map<string, Promise<LiveMacro>>();
const freshness = (at: string) => ({ retrievedAt: at, dataAsOfTime: at, staleAfter: new Date(Date.parse(at) + 30 * 60 * 1000).toISOString(), freshnessStatus: 'FRESH' as const });

/** One DB-backed snapshot per analysis time is shared by all stock runs. */
export function loadLiveMacroGlobal(analysisTime: string): Promise<LiveMacro> {
  const current = shared.get(analysisTime);
  if (current) return current;
  const task = load(analysisTime);
  shared.set(analysisTime, task);
  return task;
}

async function load(analysisTime: string): Promise<LiveMacro> {
  const cached = await new MacroCacheService(new FredMacroProvider()).snapshot(fredSeries, analysisTime);
  const observations = cached.observations;
  const errors = Object.values(cached.results).flatMap(item => item.errors).map(code => ({ source: 'fred-macro', code, message: `FRED series unavailable: ${code}`, retryable: true }));
  const sp500 = marketPoints(observations, 'SP500'); const nasdaq = marketPoints(observations, 'NASDAQCOM');
  const m2 = runM2Pipeline(sp500.length ? sp500 : nasdaq, economicPoints(observations, 'CPIAUCSL'), economicPoints(observations, 'GDP'), economicPoints(observations, 'M2SL'), analysisTime);
  const empty = <T>(source: string): SourceEnvelope<T> => ({ data: null, source, status: 'FAILED', freshness: { retrievedAt: analysisTime, dataAsOfTime: null, staleAfter: null, freshnessStatus: 'UNKNOWN' }, errors });
  if (!m2) return { macro: empty('fred-macro'), global: empty('fred-global-market'), summary: fredSeries.map(id => [id, cached.results[id]?.cacheStatus ?? 'UNAVAILABLE']) };
  const [macroRun, globalRun] = await Promise.all([runMacroAgent(m2, new DeterministicMacroFixtureClient()), runGlobalMarketAgent(m2, new DeterministicGlobalMarketFixtureClient())]);
  const wrap = <T>(source: string, run: { output: T|null; errors: readonly { code: string; message: string; retryable: boolean }[] }): SourceEnvelope<T> => ({ data: run.output, source, status: run.output ? (errors.length ? 'PARTIAL' : 'READY') : 'FAILED', freshness: freshness(m2.asOfTime ?? analysisTime), errors: [...errors, ...run.errors.map(item => ({ source, ...item }))] });
  return { macro: wrap('fred-macro', macroRun), global: wrap('fred-global-market', globalRun), summary: [['S&P 500', cached.results.SP500?.cacheStatus ?? 'UNAVAILABLE'], ['Nasdaq', cached.results.NASDAQCOM?.cacheStatus ?? 'UNAVAILABLE'], ['VIX', cached.results.VIXCLS?.cacheStatus ?? 'UNAVAILABLE'], ['Fed Funds', cached.results.FEDFUNDS?.cacheStatus ?? 'UNAVAILABLE'], ['2Y / 10Y', cached.results.DGS2?.cacheStatus === 'UNAVAILABLE' || cached.results.DGS10?.cacheStatus === 'UNAVAILABLE' ? 'PARTIAL' : 'READY'], ['Inflation', cached.results.CPIAUCSL?.cacheStatus ?? 'UNAVAILABLE'], ['Growth', cached.results.GDP?.cacheStatus ?? 'UNAVAILABLE'], ['Liquidity', cached.results.M2SL?.cacheStatus ?? 'UNAVAILABLE'], ['Stable Regime', m2.stableRegime.stableRegime]] };
}
