export interface IngestionProvider<TInput, TRaw> {
  readonly code: string;
  fetch(input: TInput): Promise<TRaw>;
}
