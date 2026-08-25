import { prohibitedRecommendation } from '../../agents/macro/validator.ts';
import type { AgentError } from '../../agents/types.ts';
import type { StockAnalysisAgentInput, StockAnalysisAgentOutput } from './types.ts';

export function validateStockAnalysisOutput(input: StockAnalysisAgentInput, output: StockAnalysisAgentOutput): AgentError | null {
  if (output.asset.id !== input.asset.id || output.asset.id !== input.request.assetId || output.asset.symbol !== input.request.symbol || output.asset.market !== input.request.market) return { code: 'ASSET_SCOPE_MISMATCH', message: 'Output asset is outside the requested stock scope.', retryable: false };
  const allowed = new Set([input.technical.evidence, input.fundamental.evidence, input.industry.evidence, input.macro?.evidence ?? [], input.koreaMarket?.evidence ?? [], input.globalMarket?.evidence ?? [], input.news?.evidence ?? [], input.research?.evidence ?? [], input.risk?.evidence ?? []].flat().map((item) => item.id));
  if (output.evidence.some((item) => !allowed.has(item.id))) return { code: 'EVIDENCE_MISMATCH', message: 'Output contains evidence outside its input allow-list.', retryable: false };
  const text = [output.summary, ...output.positiveFactors, ...output.negativeFactors, ...output.conflictingFactors, ...output.keyRisks].join(' ');
  if (prohibitedRecommendation.test(text)) return { code: 'AGENT_OUTPUT_INVALID', message: 'Investment recommendation language is prohibited.', retryable: false };
  return null;
}
