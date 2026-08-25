import type { AgentEvidence } from '../types.ts';
import type { Challenge, DevilOutput } from '../devils-advocate/types.ts';
import type { M2AnalysisSnapshot } from '../macro/types.ts';
import type { RiskContext } from '../risk/types.ts';

export type InvestmentStance = 'STRONGLY_CONSTRUCTIVE' | 'CONSTRUCTIVE' | 'NEUTRAL' | 'DEFENSIVE' | 'STRONGLY_DEFENSIVE' | 'UNKNOWN';
export type CioOutputStatus = 'VALID' | 'PARTIAL' | 'UNKNOWN';
export type OptionalCioContext = Readonly<Record<string, unknown>>;

export interface CioInput {
  m2AnalysisSnapshot: M2AnalysisSnapshot;
  claims: AnalysisClaim[];
  riskContext: RiskContext;
  devilChallengeContext?: Pick<DevilOutput, 'challengedClaims' | 'counterEvidence' | 'evidence' | 'unknowns' | 'status'>;
  availableEvidence: AgentEvidence[];
  asOfTime: string;
  koreaContext?: OptionalCioContext;
  fundamentalSnapshot?: OptionalCioContext;
  newsEvents?: readonly OptionalCioContext[];
  researchDocuments?: readonly OptionalCioContext[];
}

export interface AnalysisClaim { id: string; sourceAgent: string; claimType: 'INFERENCE' | 'SUMMARY'; statement: string; direction?: string; confidence: number; evidenceIds: string[]; asOfTime: string; }
export interface CioScenario { name: 'BASE' | 'BULL' | 'BEAR'; description: string; triggers: string[]; implications: string[]; supportingEvidenceIds: string[]; }
export interface CioAgentAgreement { agreements: string[]; disagreements: string[]; unresolved: string[]; }
export interface CioInputContext extends Readonly<Omit<CioInput, 'claims' | 'availableEvidence' | 'devilChallengeContext'>> {
  claims: readonly AnalysisClaim[];
  availableEvidence: readonly AgentEvidence[];
  devilChallengeContext: Readonly<Pick<DevilOutput, 'challengedClaims' | 'counterEvidence' | 'evidence' | 'unknowns' | 'status'>>;
}
export interface CioAgentOutput {
  agent: 'cio'; analysisTime: string; dataAsOfTime: string; investmentStance: InvestmentStance; confidence: number; summary: string;
  marketView: string; macroView: string; riskView: string; supportingEvidence: AgentEvidence[]; counterEvidence: AgentEvidence[];
  keyDrivers: string[]; keyRisks: string[]; agentAgreement: CioAgentAgreement; challenges: Challenge[]; scenarios: CioScenario[];
  invalidationConditions: string[]; monitoringPriorities: string[]; unknowns: string[]; evidence: AgentEvidence[]; status: CioOutputStatus;
}
export interface CioFixtureClient { generate(context: CioInputContext): CioAgentOutput; }
