import type { EconomicPoint, MarketPricePoint } from './types.ts';
const decimal = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
export function decimalNumber(value: string): number | null { if (!decimal.test(value)) return null; const result = Number(value); return Number.isFinite(result) ? result : null; }
export function sortMarket(points: MarketPricePoint[]) { return [...points].sort((a, b) => a.marketTime.localeCompare(b.marketTime)); }
export function sortEconomic(points: EconomicPoint[]) { return [...points].sort((a, b) => a.observationDate.localeCompare(b.observationDate)); }
