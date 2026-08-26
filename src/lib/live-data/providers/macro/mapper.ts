import type { EconomicPoint, MarketPricePoint } from '../../../signals/types.ts';
import type { FredObservation, FredSeriesId } from './validator.ts';
export const economicPoints = (items: readonly FredObservation[], seriesId: FredSeriesId): EconomicPoint[] => items.filter((item) => item.seriesId === seriesId).map((item) => ({ seriesId, observationDate: item.observationDate, value: item.value, vintageAt: item.vintageAt }));
export const marketPoints = (items: readonly FredObservation[], seriesId: 'SP500' | 'NASDAQCOM'): MarketPricePoint[] => items.filter((item) => item.seriesId === seriesId).map((item) => ({ assetId: seriesId, marketTime: `${item.observationDate}T00:00:00.000Z`, close: item.value }));
