import type { FixtureEconomicRaw } from '../providers/fixture-provider.ts';
import type { NormalizedEconomicObservation } from '../types.ts';

export function normalizeEconomicObservation(raw: FixtureEconomicRaw): NormalizedEconomicObservation {
  return { seriesId: raw.seriesId, observationDate: raw.observationDate, value: raw.value, valueText: raw.valueText, vintageAt: raw.vintageAt, sourcePublishedAt: raw.sourcePublishedAt, dataAsOfTime: raw.dataAsOfTime, retrievedAt: raw.retrievedAt, revisionLabel: raw.revisionLabel, metadata: raw.metadata ?? {} };
}
