import { createServerSupabaseClient } from '../../supabase/server-client.ts';
import type { FredObservation } from '../providers/macro/validator.ts';
import type { CacheWriteResult } from './types.ts';

export class LiveEconomicObservationRepository {
  private readonly db = createServerSupabaseClient();
  async read(sourceId: string, series: string, analysisTime: string): Promise<readonly FredObservation[]> {
    const lookup = await this.db.from('economic_series').select('id,frequency').eq('source_id', sourceId).eq('source_series_id', series).maybeSingle();
    if (lookup.error) throw Error(`ECONOMIC_SERIES_READ: ${lookup.error.message}`);
    const definition = lookup.data; if (!definition) return [];
    const result = await this.db.from('economic_observations').select('observation_date,value,vintage_at,retrieved_at').eq('series_id', definition.id).lte('vintage_at', analysisTime).order('observation_date', { ascending: true });
    if (result.error) throw Error(`ECONOMIC_CACHE_READ: ${result.error.message}`);
    return (result.data ?? []).filter((item) => item.value !== null).map((item) => ({ seriesId: series as FredObservation['seriesId'], observationDate: item.observation_date, value: String(item.value), vintageAt: item.vintage_at, retrievedAt: item.retrieved_at, frequency: definition.frequency, source: 'FRED' as const, status: 'READY' as const }));
  }
  async insert(seriesId: string, observations: readonly FredObservation[]): Promise<CacheWriteResult> {
    const rows = observations.map((item) => ({ series_id: seriesId, observation_date: item.observationDate, value: Number(item.value), vintage_at: item.vintageAt, data_as_of_time: item.observationDate, retrieved_at: item.retrievedAt, metadata: { source: item.source, frequency: item.frequency } }));
    if (!rows.length) return { inserted: 0, skipped: 0, failed: [] };
    const result = await this.db.from('economic_observations').upsert(rows, { onConflict: 'series_id,observation_date,vintage_at', ignoreDuplicates: true });
    return result.error ? { inserted: 0, skipped: 0, failed: [result.error.message] } : { inserted: rows.length, skipped: 0, failed: [] };
  }
}
