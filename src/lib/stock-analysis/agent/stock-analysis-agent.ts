import type { StructuredLlmClient } from '../../agents/llm/types.ts';
import type { StockAnalysisAgentInput, StockAnalysisAgentOutput, StockAnalysisAgentRun } from './types.ts';
import { validateStockAnalysisOutput } from './validator.ts';

/** Calls only the supplied deterministic fixture in M5-F; production LLM wiring is intentionally absent. */
export async function runStockAnalysisAgent(input: StockAnalysisAgentInput, client: StructuredLlmClient): Promise<StockAnalysisAgentRun> {
  if (input.request.assetId !== input.asset.id || input.request.symbol !== input.asset.symbol || input.request.market !== input.asset.market) return { status: 'FAILED', output: null, errors: [{ code: 'ASSET_SCOPE_MISMATCH', message: 'Request and resolved asset differ.', retryable: false }] };
  try { const output = await client.generateStructured<StockAnalysisAgentOutput>({ systemPrompt: 'M5-F deterministic fixture only.', inputPrompt: JSON.stringify(input), context: input }); const error = validateStockAnalysisOutput(input, output); if (error) return { status: 'FAILED', output: null, errors: [error] }; return { status: output.confidence === null ? 'UNKNOWN' : 'COMPLETED', output, errors: [] }; } catch { return { status: 'FAILED', output: null, errors: [{ code: 'LLM_ERROR', message: 'Deterministic fixture client failed.', retryable: false }] }; }
}
