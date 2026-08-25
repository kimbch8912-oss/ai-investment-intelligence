import type { FixtureMarketRaw } from '../providers/fixture-provider.ts';
import type { NormalizedMarketPrice } from '../types.ts';

export function normalizeMarketPrice(raw: FixtureMarketRaw): NormalizedMarketPrice {
  return { assetId: raw.assetId, sourceId: raw.sourceId, interval: raw.interval as NormalizedMarketPrice['interval'], marketTime: raw.marketTime, open: raw.open, high: raw.high, low: raw.low, close: raw.close, adjustedClose: raw.adjustedClose, volume: raw.volume, currency: raw.currency, retrievedAt: raw.retrievedAt };
}
