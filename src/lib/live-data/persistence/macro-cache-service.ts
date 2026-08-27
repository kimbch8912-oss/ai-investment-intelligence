import type { FredMacroProvider } from '../providers/macro/fred-macro-provider.ts';
import { validObservation, type FredObservation, type FredSeriesId } from '../providers/macro/validator.ts';
import { LiveEconomicObservationRepository } from './economic-observation-repository.ts';
import { FredSeriesRegistrationService } from './fred-series-registration-service.ts';

export type MacroCacheStatus = 'HIT'|'MISS'|'REFRESHED'|'STALE_FALLBACK'|'EXPIRED'|'UNAVAILABLE';
export type MacroCacheResult = { observation: readonly FredObservation[]; cacheStatus: MacroCacheStatus; freshness: 'FRESH'|'STALE'|'EXPIRED'|'UNKNOWN'; source: 'FRED'; dataAsOfTime: string|null; vintageAt: string|null; errors: readonly string[]; providerCalls: number };
type Provider = Pick<FredMacroProvider, 'getSeries'>;
type Repository = Pick<LiveEconomicObservationRepository, 'readBySeriesId'|'insert'>;
type Registration = Pick<FredSeriesRegistrationService, 'resolve'>;
const daily = new Set<FredSeriesId>(['DGS2','DGS10','T10Y2Y','VIXCLS','SP500','NASDAQCOM']);
const maxAgeMs = (series: FredSeriesId) => daily.has(series) ? 3 * 86_400_000 : series === 'GDP' ? 130 * 86_400_000 : series === 'FEDFUNDS' ? 45 * 86_400_000 : 62 * 86_400_000;
const expiredAgeMs = (series: FredSeriesId) => maxAgeMs(series) * 4;
const latest = (items: readonly FredObservation[]) => items.at(-1) ?? null;
const age = (item: FredObservation|null, analysisTime: string) => item ? Date.parse(analysisTime) - Date.parse(`${item.observationDate}T23:59:59.999Z`) : Infinity;
const recentlyRetrieved = (items: readonly FredObservation[], series: FredSeriesId, analysisTime: string) => items.some(item => Date.parse(analysisTime) - Date.parse(item.retrievedAt) <= maxAgeMs(series));

export class MacroCacheService {
  constructor(private readonly provider: Provider, private readonly observations: Repository = new LiveEconomicObservationRepository(), private readonly registration: Registration = new FredSeriesRegistrationService()) {}
  async get(series: FredSeriesId, analysisTime: string): Promise<MacroCacheResult> {
    const definition = await this.registration.resolve(series);
    if (!definition) return this.empty('UNAVAILABLE', ['FRED_SERIES_NOT_REGISTERED']);
    const cached = (await this.observations.readBySeriesId(definition.id, series, definition.frequency, analysisTime)).filter(item => validObservation(item, analysisTime));
    const cachedLatest = latest(cached); const cachedAge = age(cachedLatest, analysisTime);
    // A recently retrieved snapshot is fresh for that series' own cadence,
    // even when a monthly or quarterly source has not published a new value.
    if (cached.length && (cachedAge <= maxAgeMs(series) || recentlyRetrieved(cached, series, analysisTime))) return this.result(cached, 'HIT', 'FRESH', [], 0);
    const live = await this.provider.getSeries(series, analysisTime);
    const usable = live.observations.filter(item => validObservation(item, analysisTime));
    if (usable.length) {
      const write = await this.observations.insert(definition.id, usable);
      return this.result(usable, cached.length ? 'REFRESHED' : 'MISS', 'FRESH', [...live.errors, ...write.failed], 1);
    }
    if (cached.length && cachedAge <= expiredAgeMs(series)) return this.result(cached, 'STALE_FALLBACK', 'STALE', live.errors, 1);
    return this.empty(cached.length ? 'EXPIRED' : 'UNAVAILABLE', live.errors, 1);
  }
  async snapshot(series: readonly FredSeriesId[], analysisTime: string): Promise<{ observations: readonly FredObservation[]; results: Readonly<Record<string, MacroCacheResult>> }> {
    const entries = await Promise.all(series.map(async id => [id, await this.get(id, analysisTime)] as const));
    return { observations: entries.flatMap(([, result]) => result.observation), results: Object.fromEntries(entries) };
  }
  private result(observation: readonly FredObservation[], cacheStatus: MacroCacheStatus, freshness: MacroCacheResult['freshness'], errors: readonly string[], providerCalls: number): MacroCacheResult { const item=latest(observation); return {observation,cacheStatus,freshness,source:'FRED',dataAsOfTime:item?.observationDate??null,vintageAt:item?.vintageAt??null,errors,providerCalls}; }
  private empty(cacheStatus: MacroCacheStatus, errors: readonly string[], providerCalls=0): MacroCacheResult { return {observation:[],cacheStatus,freshness:cacheStatus==='EXPIRED'?'EXPIRED':'UNKNOWN',source:'FRED',dataAsOfTime:null,vintageAt:null,errors,providerCalls}; }
}
