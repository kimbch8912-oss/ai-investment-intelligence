import type { IngestionProvider } from './types.ts';

export interface FixtureMarketRaw { assetId: string; sourceId: string; interval: string; marketTime: string; open?: string; high?: string; low?: string; close?: string; adjustedClose?: string; volume?: string; currency?: string; retrievedAt: string }
export interface FixtureEconomicRaw { seriesId: string; observationDate: string; value?: string; valueText?: string; vintageAt: string; sourcePublishedAt?: string; dataAsOfTime?: string; retrievedAt: string; revisionLabel?: string; metadata?: Record<string, unknown> }

export class FixtureProvider<TInput, TRaw> implements IngestionProvider<TInput, TRaw> {
  readonly code = 'QA_FIXTURE';
  private readonly result: TRaw;
  constructor(result: TRaw) { this.result = result; }
  async fetch(_input: TInput): Promise<TRaw> { return structuredClone(this.result); }
}
