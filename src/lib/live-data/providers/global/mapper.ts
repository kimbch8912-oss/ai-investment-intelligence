import type { MarketDataSnapshot, OhlcvBar } from '../../types.ts';
import { validateAndNormalizeOhlcv } from './validator.ts';

type TwelveDataResponse = { code?: number; message?: string; status?: string; meta?: { currency?: string; exchange_timezone?: string }; values?: Array<{ datetime?: string; open?: string; high?: string; low?: string; close?: string; volume?: string }> };
export function mapTwelveDataDaily(response: TwelveDataResponse, analysisTime: string): MarketDataSnapshot {
  if (response.status === 'error' || !Array.isArray(response.values)) throw new Error(response.message ?? 'Twelve Data did not return time series values.');
  const bars: OhlcvBar[] = response.values.map((value) => ({ timestamp: new Date(`${value.datetime}T00:00:00.000Z`).toISOString(), open: Number(value.open), high: Number(value.high), low: Number(value.low), close: Number(value.close), volume: Number(value.volume) }));
  return { ohlcv: validateAndNormalizeOhlcv(bars, analysisTime), currency: response.meta?.currency ?? null, timezone: response.meta?.exchange_timezone ?? null, adjustment: 'ADJUSTED' };
}
