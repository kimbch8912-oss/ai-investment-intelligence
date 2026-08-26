export class AlphaVantageFundamentalValidationError extends Error {}
export const finite = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' && value !== 'None' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
export const date = (value: unknown): string | null => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
export function assertNvda(asset: { market: string; symbol: string }) { if (asset.market !== 'NASDAQ' || asset.symbol !== 'NVDA') throw new AlphaVantageFundamentalValidationError('UNSUPPORTED_ASSET'); }
