import { runCioAgent } from '../cio/cio-agent.ts';
import { DeterministicCioFixtureClient } from '../cio/fixture-client.ts';
import { buildCioInput } from '../cio/input-builder.ts';
import type { CioAgentOutput, CioFixtureClient, CioInput } from '../cio/types.ts';

const at = '2026-08-20T00:00:00.000Z';
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const evidence = [
  { id: 'market_signal', type: 'CALCULATION' as const, label: 'Market Signal', value: 75 },
  { id: 'macro_signal', type: 'CALCULATION' as const, label: 'Macro Signal', value: 75 },
  { id: 'risk_signal', type: 'CALCULATION' as const, label: 'Risk Signal', value: 20 },
  { id: 'counter_signal', type: 'INFERENCE' as const, label: 'Counter Signal' },
];
function input(regime: string = 'BULL', risk: CioInput['riskContext']['riskLevel'] = 'NORMAL', claims = [{ id: 'global_positive', sourceAgent: 'global_market', claimType: 'INFERENCE' as const, statement: 'Global market is positive.', direction: 'POSITIVE', confidence: 80, evidenceIds: ['market_signal'], asOfTime: at }], devil: CioInput['devilChallengeContext'] = { challengedClaims: [], counterEvidence: [], evidence: [], unknowns: [], status: 'VALID' }): CioInput {
  return { m2AnalysisSnapshot: { composites: { macro: { confidence: 80 }, market: { confidence: 80 }, risk: { riskScore: risk === 'HIGH' ? 80 : 20 }, divergence: { status: 'ALIGNED', direction: 'NONE' } }, stableRegime: { stableRegime: regime, confidence: 80 }, asOfTime: at } as any, claims, riskContext: { riskLevel: risk, confidence: 80, asOfTime: at, market: [evidence[0]], macro: [evidence[1]], data: [evidence[2]] }, devilChallengeContext: devil, availableEvidence: clone(evidence), asOfTime: at };
}
class MutatingFixtureClient implements CioFixtureClient {
  constructor(private readonly mutate: (output: CioAgentOutput) => CioAgentOutput) {}
  generate(context: Parameters<CioFixtureClient['generate']>[0]): CioAgentOutput { return this.mutate(new DeterministicCioFixtureClient().generate(context)); }
}
const run = (value: CioInput, client?: CioFixtureClient) => runCioAgent(value, client);

function main() {
  let result = run(input()); assert(result.output?.investmentStance === 'CONSTRUCTIVE', 'Broad Constructive expected CONSTRUCTIVE');
  result = run(input('STRONG_BULL', 'LOW')); assert(result.output?.investmentStance === 'STRONGLY_CONSTRUCTIVE', 'Strong Constructive expected STRONGLY_CONSTRUCTIVE');
  const mixed = [{ id: 'macro_negative', sourceAgent: 'macro', claimType: 'INFERENCE' as const, statement: 'Macro is negative.', direction: 'NEGATIVE', confidence: 80, evidenceIds: ['macro_signal'], asOfTime: at }, { id: 'global_positive', sourceAgent: 'global_market', claimType: 'INFERENCE' as const, statement: 'Global market is positive.', direction: 'POSITIVE', confidence: 80, evidenceIds: ['market_signal'], asOfTime: at }];
  result = run(input('BULL', 'ELEVATED', mixed)); assert(result.output?.investmentStance === 'NEUTRAL', 'Mixed Neutral expected NEUTRAL');
  result = run(input('BEAR', 'HIGH')); assert(result.output?.investmentStance === 'DEFENSIVE', 'Defensive expected DEFENSIVE');
  result = run(input('CRISIS', 'HIGH')); assert(result.output?.investmentStance === 'STRONGLY_DEFENSIVE', 'Crisis expected STRONGLY_DEFENSIVE');
  const highChallenge = { challengedClaims: [{ claimId: 'global_positive', challengeType: 'COUNTER', severity: 'HIGH' as const, reason: 'Counter evidence requires review.', counterEvidenceIds: ['counter_signal'] }], counterEvidence: [evidence[3]], evidence: [evidence[3]], unknowns: [], status: 'VALID' };
  result = run(input('CAUTION', 'HIGH', undefined, highChallenge)); assert(result.output?.investmentStance === 'DEFENSIVE' && result.output.marketView.includes('CAUTION'), 'High Risk Rally expected DEFENSIVE while retaining source view');
  assert(run(input('STRONG_BULL', 'LOW')).output?.investmentStance === 'STRONGLY_CONSTRUCTIVE', 'LOW risk cap'); assert(run(input('STRONG_BULL', 'NORMAL')).output?.investmentStance === 'CONSTRUCTIVE', 'NORMAL risk cap'); assert(run(input('STRONG_BULL', 'HIGH')).output?.investmentStance === 'DEFENSIVE', 'HIGH risk cap');
  result = run(input('BULL', 'NORMAL', undefined, highChallenge)); assert(result.output?.investmentStance === 'DEFENSIVE' && result.output.confidence === 80, 'Severe challenge downgrade and confidence cap');
  const disagreement = [
    { id: 'macro_negative', sourceAgent: 'macro', claimType: 'INFERENCE' as const, statement: 'Macro is negative.', direction: 'NEGATIVE', confidence: 80, evidenceIds: ['macro_signal'], asOfTime: at },
    { id: 'global_positive', sourceAgent: 'global_market', claimType: 'INFERENCE' as const, statement: 'Global is positive.', direction: 'POSITIVE', confidence: 80, evidenceIds: ['market_signal'], asOfTime: at },
    { id: 'korea_negative', sourceAgent: 'korea_market', claimType: 'INFERENCE' as const, statement: 'Korea is negative.', direction: 'NEGATIVE', confidence: 80, evidenceIds: ['market_signal'], asOfTime: at },
    { id: 'fundamental_positive', sourceAgent: 'fundamental', claimType: 'INFERENCE' as const, statement: 'Fundamental is positive.', direction: 'POSITIVE', confidence: 80, evidenceIds: ['macro_signal'], asOfTime: at },
  ];
  result = run(input('BULL', 'NORMAL', disagreement)); assert(result.output?.agentAgreement.agreements.length === 4 && result.output.investmentStance === 'CONSTRUCTIVE', 'Agent disagreement preservation without voting');
  result = run(input('BULL', 'NORMAL', [])); assert(result.output?.status === 'PARTIAL' && result.output.agentAgreement.agreements.length === 0, 'No claims partial');
  const noDevil = input(); delete noDevil.devilChallengeContext; result = run(noDevil); assert(result.output?.status === 'PARTIAL' && result.output.unknowns.some(item => item.includes('Devil review')), 'No devil review partial');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, evidence: [...output.evidence, { id: 'VIX_CURRENT', type: 'FACT', label: 'VIX' }] }))); assert(result.errors[0]?.code === 'EVIDENCE_MISMATCH', 'Fabricated evidence guard');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, scenarios: [{ ...output.scenarios[0], probability: 70 }] as any }))); assert(result.errors[0]?.code === 'AGENT_OUTPUT_INVALID', 'Probability guard');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, summary: '지금 주식을 매수해야 한다.' }))); assert(result.errors[0]?.code === 'AGENT_OUTPUT_INVALID', 'Recommendation guard');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, summary: 'NVDA is attractive.' }))); assert(result.errors[0]?.code === 'ASSET_SCOPE_MISMATCH', 'Unsupported asset guard');
  result = run(input()); assert(result.output?.scenarios.length === 1 && result.output.scenarios[0].name === 'BASE' && !('probability' in result.output.scenarios[0]), 'Scenario contract');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, scenarios: [{ ...output.scenarios[0], supportingEvidenceIds: ['NOT_AVAILABLE'] }] }))); assert(result.errors[0]?.code === 'EVIDENCE_MISMATCH', 'Scenario evidence guard');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, invalidationConditions: ['S&P500 -10%'] }))); assert(result.errors[0]?.code === 'AGENT_OUTPUT_INVALID', 'Invalidation scope guard');
  result = run(input(), new MutatingFixtureClient(output => ({ ...output, monitoringPriorities: ['VIX'] }))); assert(result.errors[0]?.code === 'EVIDENCE_MISMATCH', 'Monitoring scope guard');
  assert('context' in buildCioInput(input()), 'Input builder valid scope'); const missingClaimEvidence = input(); missingClaimEvidence.claims[0].evidenceIds = ['MISSING']; assert('error' in buildCioInput(missingClaimEvidence), 'Claim evidence scope'); const missingChallengeClaim = input(); missingChallengeClaim.devilChallengeContext = { ...highChallenge, challengedClaims: [{ ...highChallenge.challengedClaims[0], claimId: 'MISSING' }] }; assert('error' in buildCioInput(missingChallengeClaim), 'Challenge claim scope'); const missingChallengeEvidence = input(); missingChallengeEvidence.devilChallengeContext = { ...highChallenge, challengedClaims: [{ ...highChallenge.challengedClaims[0], counterEvidenceIds: ['MISSING'] }] }; assert('error' in buildCioInput(missingChallengeEvidence), 'Challenge evidence scope');
  const immutable = input(); const before = clone(immutable); run(immutable); assert(JSON.stringify(immutable) === JSON.stringify(before), 'Input immutability');
  result = run(input()); assert(result.runId && result.agent === 'cio' && result.agentVersion === 'm3i-v1' && result.promptVersion === 'cio-agent-v1' && result.status === 'COMPLETED' && result.inputAsOfTime === at && result.startedAt && result.finishedAt && result.output && Array.isArray(result.errors), 'Run envelope');
  const first = run(input()).output; const second = run(input()).output; assert(JSON.stringify({ stance: first?.investmentStance, confidence: first?.confidence, agreement: first?.agentAgreement, scenarios: first?.scenarios, drivers: first?.keyDrivers, risks: first?.keyRisks, unknowns: first?.unknowns, evidence: first?.evidence }) === JSON.stringify({ stance: second?.investmentStance, confidence: second?.confidence, agreement: second?.agentAgreement, scenarios: second?.scenarios, drivers: second?.keyDrivers, risks: second?.keyRisks, unknowns: second?.unknowns, evidence: second?.evidence }), 'Determinism');
  console.log('M3-I CIO agent runtime fixture QA PASS');
}
main();
