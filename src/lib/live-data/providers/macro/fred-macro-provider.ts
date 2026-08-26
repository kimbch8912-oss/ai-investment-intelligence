import { liveCache } from '../../live-cache.ts';
import { fredSeries, type FredObservation, type FredSeriesId, validObservation } from './validator.ts';
const base = () => process.env.FRED_BASE_URL ?? 'https://api.stlouisfed.org/fred/series/observations';
const frequency: Record<FredSeriesId, string> = { FEDFUNDS:'Monthly',DGS2:'Daily',DGS10:'Daily',T10Y2Y:'Daily',CPIAUCSL:'Monthly',CPILFESL:'Monthly',PCEPI:'Monthly',UNRATE:'Monthly',PAYEMS:'Monthly',GDP:'Quarterly',M2SL:'Monthly',VIXCLS:'Daily',SP500:'Daily',NASDAQCOM:'Daily' };
const ttl = (id: FredSeriesId) => ['DGS2','DGS10','T10Y2Y','VIXCLS','SP500','NASDAQCOM'].includes(id) ? 1_800 : id === 'FEDFUNDS' ? 21_600 : 86_400;
export type FredMacroSnapshot = { observations: readonly FredObservation[]; errors: readonly string[]; retrievedAt: string };
export class FredMacroProvider {
  async getSnapshot(analysisTime: string): Promise<FredMacroSnapshot> {
    const key = process.env.FRED_API_KEY; const retrievedAt = new Date().toISOString(); if (!key) return { observations: [], errors: ['FRED_KEY_REQUIRED'], retrievedAt };
    const fetchSeries = async (seriesId: FredSeriesId) => { try { const query = new URLSearchParams({ series_id: seriesId, api_key: key, file_type: 'json', observation_start: '2020-01-01', observation_end: analysisTime.slice(0,10), realtime_end: analysisTime.slice(0,10) }); const response = await fetch(`${base()}?${query}`, { cache: 'force-cache', next: { revalidate: ttl(seriesId), tags: [`fred:${seriesId}`] } }); const payload = await response.json() as { observations?: Array<{ date?: string; value?: string; realtime_end?: string }> }; if (!response.ok || !Array.isArray(payload.observations)) throw Error(seriesId); return payload.observations.map((row) => ({ seriesId, observationDate: String(row.date), value: String(row.value), vintageAt: `${row.realtime_end ?? row.date}T23:59:59.999Z`, retrievedAt, frequency: frequency[seriesId], source: 'FRED' as const, status: 'READY' as const })).filter((row) => validObservation(row, analysisTime)); } catch { throw Error(seriesId); } };
    const settled = await Promise.allSettled(fredSeries.map(fetchSeries)); const observations: FredObservation[] = []; const errors: string[] = []; settled.forEach((result, index) => result.status === 'fulfilled' ? observations.push(...result.value) : errors.push(fredSeries[index])); return { observations, errors, retrievedAt };
  }
}
