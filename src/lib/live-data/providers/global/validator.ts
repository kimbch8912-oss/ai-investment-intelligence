import type { OhlcvBar } from '../../types.ts';

export class GlobalMarketDataValidationError extends Error {}
export function validateAndNormalizeOhlcv(input: readonly OhlcvBar[], analysisTime: string): OhlcvBar[] {
  const seen = new Set<string>(); const normalized = input.map((bar) => ({ ...bar })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const bar of normalized) {
    if (!Number.isFinite(Date.parse(bar.timestamp))) throw new GlobalMarketDataValidationError('Invalid OHLCV timestamp.');
    if (bar.timestamp > analysisTime) throw new GlobalMarketDataValidationError('LOOK_AHEAD_BLOCKED');
    if (seen.has(bar.timestamp)) throw new GlobalMarketDataValidationError('Duplicate OHLCV timestamp.'); seen.add(bar.timestamp);
    if (![bar.open, bar.high, bar.low, bar.close].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(bar.volume) || bar.volume < 0) throw new GlobalMarketDataValidationError('Invalid OHLCV values.');
    if (bar.high < Math.max(bar.open, bar.close, bar.low) || bar.low > Math.min(bar.open, bar.close, bar.high)) throw new GlobalMarketDataValidationError('Invalid OHLC range.');
  }
  return normalized;
}
