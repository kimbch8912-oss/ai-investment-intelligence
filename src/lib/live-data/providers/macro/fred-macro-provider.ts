import { liveCache } from '../../live-cache.ts';
import { fredSeries, type FredObservation, type FredSeriesId, validObservation } from './validator.ts';
import { fetchWithTimeout, isProviderTimeout } from '../../fetch-with-timeout.ts';
const base = () => process.env.FRED_BASE_URL ?? 'https://api.stlouisfed.org/fred/series/observations';
const frequency: Record<FredSeriesId, string> = { FEDFUNDS:'Monthly',DGS2:'Daily',DGS10:'Daily',T10Y2Y:'Daily',CPIAUCSL:'Monthly',CPILFESL:'Monthly',PCEPI:'Monthly',UNRATE:'Monthly',PAYEMS:'Monthly',GDP:'Quarterly',M2SL:'Monthly',VIXCLS:'Daily',SP500:'Daily',NASDAQCOM:'Daily' };
const ttl = (id: FredSeriesId) => ['DGS2','DGS10','T10Y2Y','VIXCLS','SP500','NASDAQCOM'].includes(id) ? 1_800 : id === 'FEDFUNDS' ? 21_600 : 86_400;
const daily = new Set<FredSeriesId>(['DGS2','DGS10','T10Y2Y','VIXCLS','SP500','NASDAQCOM']);
const utcDate = (value: string) => value.slice(0, 10);
const subtractDays = (date: string, days: number) => { const value = new Date(`${date}T00:00:00.000Z`); value.setUTCDate(value.getUTCDate() - days); return value.toISOString().slice(0, 10); };
const requestEndDate = (seriesId: FredSeriesId, analysisTime: string, retrievedAt: string) => daily.has(seriesId) ? [utcDate(analysisTime), subtractDays(utcDate(retrievedAt), liveCache.fredDailyDateSafetyLagDays)].sort()[0] : utcDate(analysisTime);
export type FredMacroSnapshot = { observations: readonly FredObservation[]; errors: readonly string[]; retrievedAt: string };
export class FredMacroProvider {
  async getSeries(seriesId: FredSeriesId, analysisTime: string): Promise<FredMacroSnapshot> {
    const key = process.env.FRED_API_KEY; const retrievedAt = new Date().toISOString();
    if (!key) return { observations: [], errors: ['FRED_KEY_REQUIRED'], retrievedAt };
    try {
      const end = requestEndDate(seriesId, analysisTime, retrievedAt); const vintage: Record<string, string> = daily.has(seriesId) ? { realtime_start: end, realtime_end: end } : { realtime_end: utcDate(analysisTime) }; const query = new URLSearchParams({ series_id: seriesId, api_key: key, file_type: 'json', observation_start: '2020-01-01', observation_end: end, ...vintage }); const response = await fetchWithTimeout(`${base()}?${query}`, { cache: 'force-cache', next: { revalidate: ttl(seriesId), tags: [`fred:${seriesId}:${end}`] } } as RequestInit, 8_000); const payload = await response.json() as { observations?: Array<{ date?: string; value?: string; realtime_end?: string }> }; if (!response.ok || !Array.isArray(payload.observations)) throw Error(seriesId); const observations=payload.observations.map((row) => ({ seriesId, observationDate: String(row.date), value: String(row.value), vintageAt: `${row.realtime_end ?? row.date}T23:59:59.999Z`, retrievedAt, frequency: frequency[seriesId], source: 'FRED' as const, status: 'READY' as const })).filter((row) => validObservation(row, analysisTime)); return { observations, errors: observations.length ? [] : [`${seriesId}_UNAVAILABLE`], retrievedAt };
    } catch (error) { return { observations: [], errors: [isProviderTimeout(error) ? 'PROVIDER_TIMEOUT' : seriesId], retrievedAt }; }
  }
  async getSnapshot(analysisTime: string): Promise<FredMacroSnapshot> {
    const settled = await Promise.all(fredSeries.map(seriesId => this.getSeries(seriesId, analysisTime))); return { observations:settled.flatMap(result => result.observations), errors:settled.flatMap(result => result.errors), retrievedAt:settled[0]?.retrievedAt ?? new Date().toISOString() };
  }
}
