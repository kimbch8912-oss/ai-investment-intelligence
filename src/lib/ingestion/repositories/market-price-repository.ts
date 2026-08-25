import type { IngestionWriter, NormalizedMarketPrice, WriteResult } from '../types.ts';
import type { SqlExecutor } from './types.ts';

export const marketPriceUpsertSql = `INSERT INTO market_prices (asset_id, source_id, interval, market_time, open, high, low, close, adjusted_close, volume, currency, retrieved_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ON CONFLICT (asset_id, source_id, interval, market_time) DO UPDATE SET
  open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close,
  adjusted_close = EXCLUDED.adjusted_close, volume = EXCLUDED.volume, currency = EXCLUDED.currency,
  retrieved_at = EXCLUDED.retrieved_at, updated_at = now()
WHERE ROW(market_prices.open, market_prices.high, market_prices.low, market_prices.close, market_prices.adjusted_close, market_prices.volume, market_prices.currency, market_prices.retrieved_at)
  IS DISTINCT FROM ROW(EXCLUDED.open, EXCLUDED.high, EXCLUDED.low, EXCLUDED.close, EXCLUDED.adjusted_close, EXCLUDED.volume, EXCLUDED.currency, EXCLUDED.retrieved_at)
RETURNING CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END AS action`;

export class MarketPriceRepository implements IngestionWriter<NormalizedMarketPrice> {
  private readonly sql: SqlExecutor;
  constructor(sql: SqlExecutor) { this.sql = sql; }
  async write(record: NormalizedMarketPrice): Promise<WriteResult> {
    const result = await this.sql.execute(marketPriceUpsertSql, [record.assetId, record.sourceId, record.interval, record.marketTime, record.open ?? null, record.high ?? null, record.low ?? null, record.close ?? null, record.adjustedClose ?? null, record.volume ?? null, record.currency ?? null, record.retrievedAt]);
    return { action: result.rows?.[0]?.action ?? 'skipped' };
  }
}
