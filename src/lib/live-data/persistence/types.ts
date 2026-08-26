import type { OhlcvBar } from '../types.ts'; import type { FredObservation } from '../providers/macro/validator.ts';
export type CachedMarketData = { bars: readonly OhlcvBar[]; latestTradingTime: string | null; freshness: 'FRESH'|'STALE'|'EXPIRED'|'UNKNOWN' };
export type CacheWriteResult = { inserted: number; skipped: number; failed: readonly string[] };
export type CachedEconomicSeries = { observations: readonly FredObservation[]; freshness: 'FRESH'|'STALE'|'EXPIRED'|'UNKNOWN' };
