import type { CalculationResult, CalculationStatus } from '../types.ts';
export const result = (metric: string, value: number | null, unit: CalculationResult['unit'], asOfTime: string | null, lookback: number, inputCount: number, status: CalculationStatus): CalculationResult => ({ metric, value, unit, asOfTime, lookback, inputCount, status });
