export type IngestionErrorCode = 'PROVIDER_ERROR' | 'NORMALIZATION_ERROR' | 'VALIDATION_ERROR' | 'RESOLUTION_ERROR' | 'DATABASE_ERROR';

export class IngestionError extends Error {
  readonly code: IngestionErrorCode;
  readonly context: Record<string, unknown>;
  readonly retryable: boolean;
  constructor(
    code: IngestionErrorCode,
    message: string,
    context: Record<string, unknown> = {},
    retryable = false,
  ) { super(message); this.code = code; this.context = context; this.retryable = retryable; }
}
