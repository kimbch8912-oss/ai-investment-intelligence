import type { AgentError } from '../types.ts';
import { prohibitedRecommendation } from '../macro/validator.ts';
import { CIO_CONFIG } from './config.ts';
import type { CioAgentOutput, CioInputContext, InvestmentStance } from './types.ts';

const stances: InvestmentStance[] = ['STRONGLY_CONSTRUCTIVE', 'CONSTRUCTIVE', 'NEUTRAL', 'DEFENSIVE', 'STRONGLY_DEFENSIVE', 'UNKNOWN'];
export function validateCioOutput(value: unknown, context: CioInputContext): AgentError | null {
  if (!value || typeof value !== 'object') return { code: 'AGENT_OUTPUT_INVALID', message: 'CIO output must be an object.', retryable: false };
  const output = value as Partial<CioAgentOutput>;
  const required: Array<keyof CioAgentOutput> = ['agent','analysisTime','dataAsOfTime','investmentStance','confidence','summary','marketView','macroView','riskView','supportingEvidence','counterEvidence','keyDrivers','keyRisks','agentAgreement','challenges','scenarios','invalidationConditions','monitoringPriorities','unknowns','evidence','status'];
  if (required.some(key => output[key] === undefined) || output.agent !== 'cio' || !stances.includes(output.investmentStance as InvestmentStance)) return { code: 'AGENT_OUTPUT_INVALID', message: 'CIO output is missing required fields.', retryable: false };
  if (!Array.isArray(output.scenarios) || output.scenarios.length > CIO_CONFIG.scenarioMax || output.scenarios.filter(s => s.name === 'BASE').length !== 1 || output.scenarios.filter(s => s.name === 'BULL').length > 1 || output.scenarios.filter(s => s.name === 'BEAR').length > 1 || output.scenarios.some(s => 'probability' in s || !Array.isArray(s.supportingEvidenceIds))) return { code: 'AGENT_OUTPUT_INVALID', message: 'CIO scenarios must be non-probabilistic and limited to one BASE, BULL, and BEAR scenario.', retryable: false };
  const ids = new Set(context.availableEvidence.map(item => item.id));
  if ([...(output.supportingEvidence ?? []), ...(output.counterEvidence ?? []), ...(output.evidence ?? [])].some(item => !ids.has(item.id))) return { code: 'EVIDENCE_MISMATCH', message: 'CIO output referenced evidence outside availableEvidence.', retryable: false };
  if (output.scenarios.some(scenario => scenario.supportingEvidenceIds.some(id => !ids.has(id)))) return { code: 'EVIDENCE_MISMATCH', message: 'Scenario referenced evidence outside availableEvidence.', retryable: false };
  const text = [output.summary, output.marketView, output.macroView, output.riskView, ...(output.keyDrivers ?? []), ...(output.keyRisks ?? [])].join(' ');
  if (prohibitedRecommendation.test(text) || /\b(OVERALL\s+SCORE|PORTFOLIO|ALLOCATION)\b/i.test(text)) return { code: 'AGENT_OUTPUT_INVALID', message: 'Recommendation, allocation, or overall-score language is prohibited.', retryable: false };
  const assetTokens = text.match(/\b[A-Z]{2,5}\b/g) ?? [];
  if (assetTokens.some(token => !['HIGH', 'LOW', 'BULL', 'BEAR'].includes(token))) return { code: 'ASSET_SCOPE_MISMATCH', message: 'CIO output must not introduce an unsupported asset.', retryable: false };
  const scope = new Set(context.availableEvidence.flatMap(evidence => [evidence.id, evidence.label]));
  if ((output.monitoringPriorities ?? []).some(priority => !scope.has(priority))) return { code: 'EVIDENCE_MISMATCH', message: 'Monitoring priorities must be present in the input evidence scope.', retryable: false };
  if ((output.invalidationConditions ?? []).some(condition => !['Stable Regime change', 'Risk Level change', 'Divergence change'].includes(condition))) return { code: 'AGENT_OUTPUT_INVALID', message: 'Invalidation conditions must use the supplied strategic context only.', retryable: false };
  return null;
}
