import { CIO_CONFIG } from './config.ts';
import type { CioAgentOutput, CioFixtureClient, CioInputContext, InvestmentStance } from './types.ts';

const order: InvestmentStance[] = ['STRONGLY_DEFENSIVE', 'DEFENSIVE', 'NEUTRAL', 'CONSTRUCTIVE', 'STRONGLY_CONSTRUCTIVE'];
const bounded = (stance: InvestmentStance, cap: InvestmentStance) => stance === 'UNKNOWN' || cap === 'UNKNOWN' ? 'UNKNOWN' : order[Math.min(order.indexOf(stance), order.indexOf(cap))];
const downgrade = (stance: InvestmentStance, steps: number) => stance === 'UNKNOWN' ? stance : order[Math.max(0, order.indexOf(stance) - steps)];

export class DeterministicCioFixtureClient implements CioFixtureClient {
  generate(context: CioInputContext): CioAgentOutput {
    const base = CIO_CONFIG.baseStanceMapping[context.m2AnalysisSnapshot.stableRegime.stableRegime] ?? 'UNKNOWN';
    const capped = bounded(base, CIO_CONFIG.riskStanceCap[context.riskContext.riskLevel]);
    const challengeSteps = Math.max(0, ...(context.devilChallengeContext.challengedClaims ?? []).map(challenge => CIO_CONFIG.challengeDowngrade[challenge.severity]));
    const investmentStance = context.riskContext.riskLevel === 'HIGH' ? (base === 'STRONGLY_DEFENSIVE' ? base : 'DEFENSIVE') : downgrade(capped, challengeSteps);
    const confidence = Math.min(context.m2AnalysisSnapshot.stableRegime.confidence ?? 0, context.riskContext.confidence, CIO_CONFIG.confidenceCap);
    const unknowns = [...context.devilChallengeContext.unknowns, ...(context.claims.length === 0 ? ['No agent claims were supplied.'] : []), ...(confidence < CIO_CONFIG.minimumConfidence ? ['CIO confidence does not meet the configured minimum.'] : [])];
    const status = investmentStance === 'UNKNOWN' || confidence < CIO_CONFIG.minimumConfidence ? 'UNKNOWN' : unknowns.length ? 'PARTIAL' : 'VALID';
    const supportingEvidence = context.claims.flatMap(claim => context.availableEvidence.filter(evidence => claim.evidenceIds.includes(evidence.id)));
    const counterIds = new Set(context.devilChallengeContext.challengedClaims.flatMap(challenge => challenge.counterEvidenceIds));
    const counterEvidence = context.availableEvidence.filter(evidence => counterIds.has(evidence.id));
    const challenged = new Set(context.devilChallengeContext.challengedClaims.map(challenge => challenge.claimId));
    const scenarioEvidenceIds = supportingEvidence.map(evidence => evidence.id);
    return { agent: 'cio', analysisTime: 'FIXTURE_ANALYSIS_TIME', dataAsOfTime: context.asOfTime, investmentStance, confidence, summary: investmentStance === 'UNKNOWN' ? '현재 입력 근거만으로 전략 환경을 판단하기 어렵다.' : `현재 전략 환경은 ${investmentStance}이다.`, marketView: `Stable regime is ${context.m2AnalysisSnapshot.stableRegime.stableRegime}.`, macroView: 'M2 macro snapshot is retained without recalculation.', riskView: `Risk context is ${context.riskContext.riskLevel}.`, supportingEvidence, counterEvidence, keyDrivers: context.claims.filter(claim => !challenged.has(claim.id)).map(claim => claim.statement), keyRisks: context.devilChallengeContext.challengedClaims.map(challenge => challenge.reason), agentAgreement: { agreements: context.claims.filter(claim => !challenged.has(claim.id)).map(claim => claim.id), disagreements: [...challenged], unresolved: [...context.devilChallengeContext.unknowns] }, challenges: [...context.devilChallengeContext.challengedClaims], scenarios: [{ name: 'BASE', description: 'Current supplied context persists.', triggers: ['Stable Regime change', 'Risk Level change', 'Divergence change'], implications: ['Reassess the strategic environment.'], supportingEvidenceIds: scenarioEvidenceIds }], invalidationConditions: ['Stable Regime change', 'Risk Level change', 'Divergence change'], monitoringPriorities: context.availableEvidence.map(evidence => evidence.id), unknowns, evidence: context.availableEvidence.filter(evidence => supportingEvidence.some(item => item.id === evidence.id) || counterIds.has(evidence.id)), status };
  }
}
