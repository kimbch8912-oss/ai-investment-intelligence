import type { AgentError } from '../types.ts';
import type { CioInput, CioInputContext } from './types.ts';

const err = (message: string): AgentError => ({ code: 'AGENT_INPUT_INVALID', message, retryable: false });
const freeze = <T>(value: T): T => Object.freeze(value);

export function buildCioInput(input: CioInput): { context: CioInputContext } | { error: AgentError } {
  if (!input?.m2AnalysisSnapshot || !input.asOfTime || !input.riskContext) return { error: err('M2 snapshot, risk context, and asOfTime are required.') };
  const devil = input.devilChallengeContext ?? { challengedClaims: [], counterEvidence: [], evidence: [], unknowns: ['Devil review is unavailable.'], status: 'UNKNOWN' };
  const evidenceIds = new Set<string>();
  for (const evidence of input.availableEvidence ?? []) { if (!evidence.id || evidenceIds.has(evidence.id)) return { error: err('availableEvidence IDs must be unique and non-empty.') }; evidenceIds.add(evidence.id); }
  const claimIds = new Set<string>();
  for (const claim of input.claims ?? []) { if (!claim.id || claimIds.has(claim.id)) return { error: err('Claim IDs must be unique and non-empty.') }; claimIds.add(claim.id); if (claim.evidenceIds.some(id => !evidenceIds.has(id))) return { error: err(`Claim ${claim.id} references evidence outside availableEvidence.`) }; }
  for (const challenge of devil.challengedClaims ?? []) { if (!claimIds.has(challenge.claimId)) return { error: err(`Challenge references unknown claim ${challenge.claimId}.`) }; if (challenge.counterEvidenceIds.some(id => !evidenceIds.has(id))) return { error: err(`Challenge for ${challenge.claimId} references evidence outside availableEvidence.`) }; }
  for (const evidence of [...input.riskContext.market, ...input.riskContext.macro, ...(input.riskContext.fundamental ?? []), ...(input.riskContext.events ?? []), ...(input.riskContext.data ?? [])]) if (!evidenceIds.has(evidence.id)) return { error: err('Risk context evidence must be within availableEvidence.') };
  for (const evidence of [...(devil.counterEvidence ?? []), ...(devil.evidence ?? [])]) if (!evidenceIds.has(evidence.id)) return { error: err('Devil challenge evidence must be within availableEvidence.') };
  const context: CioInputContext = freeze({ ...input, claims: freeze([...input.claims]), availableEvidence: freeze([...input.availableEvidence]), devilChallengeContext: freeze({ ...devil, challengedClaims: freeze([...(devil.challengedClaims ?? [])]), counterEvidence: freeze([...(devil.counterEvidence ?? [])]), evidence: freeze([...(devil.evidence ?? [])]), unknowns: freeze([...(devil.unknowns ?? [])]) }) });
  return { context };
}
