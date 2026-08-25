export const marketIntervals = ['1m', '5m', '15m', '1h', '1d', '1w', '1mo'] as const;
export type MarketInterval = (typeof marketIntervals)[number];
export type DecimalString = string;

export interface NormalizedMarketPrice {
  assetId: string;
  sourceId: string;
  interval: MarketInterval;
  marketTime: string;
  open?: DecimalString;
  high?: DecimalString;
  low?: DecimalString;
  close?: DecimalString;
  adjustedClose?: DecimalString;
  volume?: DecimalString;
  currency?: string;
  retrievedAt: string;
}

export interface NormalizedEconomicObservation {
  seriesId: string;
  observationDate: string;
  value?: DecimalString;
  valueText?: string;
  vintageAt: string;
  sourcePublishedAt?: string;
  dataAsOfTime?: string;
  retrievedAt: string;
  revisionLabel?: string;
  metadata: Record<string, unknown>;
}

export type RecordStatus = 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'REJECTED' | 'FAILED';
export interface WriteResult { action: 'inserted' | 'updated' | 'skipped' }
export interface IngestionWriter<T> { write(record: T): Promise<WriteResult> }

export interface RejectedRecord { record: unknown; reason: string }
export interface IngestionSummary<T> {
  provider: string;
  requested: number;
  normalized: number;
  valid: number;
  rejected: RejectedRecord[];
  wouldInsert: number;
  wouldUpdate: number;
  errors: Array<{ code: string; message: string; context: Record<string, unknown> }>;
  written: WriteResult[];
  records: T[];
}

export interface BatchRecordResult<T> {
  index: number;
  status: RecordStatus;
  record?: T;
  error?: { code: string; message: string; retryable: boolean };
}

export interface BatchIngestionSummary<T> {
  runId: string;
  provider: string;
  startedAt: string;
  finishedAt: string;
  runFailed: boolean;
  requested: number;
  normalized: number;
  valid: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  failed: number;
  errors: Array<{ code: string; message: string; context: Record<string, unknown>; retryable: boolean }>;
  records: BatchRecordResult<T>[];
}
