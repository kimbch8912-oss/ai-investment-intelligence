import type { IngestionWriter, NormalizedEconomicObservation, WriteResult } from '../types.ts';
import type { SqlExecutor } from './types.ts';

export const economicObservationInsertSql = `INSERT INTO economic_observations (series_id, observation_date, value, value_text, vintage_at, source_published_at, data_as_of_time, retrieved_at, revision_label, metadata)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
ON CONFLICT (series_id, observation_date, vintage_at) DO NOTHING`;

export class EconomicObservationRepository implements IngestionWriter<NormalizedEconomicObservation> {
  private readonly sql: SqlExecutor;
  constructor(sql: SqlExecutor) { this.sql = sql; }
  async write(record: NormalizedEconomicObservation): Promise<WriteResult> {
    const result = await this.sql.execute(economicObservationInsertSql, [record.seriesId, record.observationDate, record.value ?? null, record.valueText ?? null, record.vintageAt, record.sourcePublishedAt ?? null, record.dataAsOfTime ?? null, record.retrievedAt, record.revisionLabel ?? null, JSON.stringify(record.metadata)]);
    return { action: result.rowCount === 0 ? 'skipped' : 'inserted' };
  }
}
