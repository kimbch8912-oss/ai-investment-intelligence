import type { TechnicalContext, TechnicalMetric } from '../types.ts';

export interface StockPricePoint { assetId: string; interval: '1d'; marketTime: string; open: string; high: string; low: string; close: string; volume: string; }
export interface TechnicalEngineInput { assetId: string; interval: '1d'; prices: readonly StockPricePoint[]; asOfTime: string; }
export type TechnicalEngineOutput = TechnicalContext;
export type { TechnicalMetric };
