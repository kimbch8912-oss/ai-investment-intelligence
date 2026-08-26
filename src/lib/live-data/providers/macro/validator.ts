export const fredSeries = ['FEDFUNDS','DGS2','DGS10','T10Y2Y','CPIAUCSL','CPILFESL','PCEPI','UNRATE','PAYEMS','GDP','M2SL','VIXCLS','SP500','NASDAQCOM'] as const;
export type FredSeriesId = typeof fredSeries[number];
export type FredObservation = { seriesId: FredSeriesId; observationDate: string; value: string; vintageAt: string; retrievedAt: string; frequency: string; source: 'FRED'; status: 'READY' | 'FAILED' | 'UNKNOWN' };
export const validObservation = (item: FredObservation, analysisTime: string) => item.observationDate <= analysisTime.slice(0, 10) && item.vintageAt <= analysisTime && item.value !== '.' && Number.isFinite(Number(item.value));
