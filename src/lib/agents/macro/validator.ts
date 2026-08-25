import type { MacroAgentOutput } from './types.ts';
import type { AgentError } from '../types.ts';
export const prohibitedRecommendation = /\bBUY\b|\bSELL\b|매수\s*해야|매도\s*해야|목표주가|수익률\s*보장|비중\s*(확대|축소)|레버리지|몰빵/i;
const fields: Array<keyof MacroAgentOutput> = ['agent','analysisTime','timeHorizon','direction','confidence','summary','positiveFactors','negativeFactors','risks','keyDrivers','marketImplications','evidence','unknowns','sourceSnapshot','status'];
export function validateMacroOutput(value: unknown, allowedEvidenceIds: Set<string>): AgentError | null {
  if (!value || typeof value !== 'object') return { code:'AGENT_OUTPUT_INVALID', message:'Macro output must be an object.', retryable:false };
  const output = value as Partial<MacroAgentOutput>;
  if (fields.some(field => output[field] === undefined) || output.agent !== 'macro' || !Array.isArray(output.evidence)) return { code:'AGENT_OUTPUT_INVALID', message:'Macro output is missing required fields.', retryable:false };
  const text = [output.summary, ...(output.positiveFactors ?? []), ...(output.negativeFactors ?? []), ...(output.risks ?? []), ...(output.keyDrivers ?? []), ...(output.marketImplications ?? [])].join(' ');
  if (prohibitedRecommendation.test(text)) return { code:'AGENT_OUTPUT_INVALID', message:'Investment recommendation language is prohibited.', retryable:false };
  if (output.evidence.some(item => !allowedEvidenceIds.has(item.id))) return { code:'EVIDENCE_MISMATCH', message:'Output referenced evidence outside the M2 snapshot.', retryable:false };
  return null;
}
