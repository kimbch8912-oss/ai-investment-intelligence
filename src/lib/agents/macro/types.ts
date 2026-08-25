import type { CompositeSnapshot } from '../../composite/types.ts';
import type { DomainScore } from '../../scoring/types.ts';
import type { MarketRegimeResult } from '../../regime/types.ts';
import type { StableRegimeResult } from '../../regime/stability/types.ts';
import type { AgentEvidence } from '../types.ts';

export type MacroDirection = 'STRONG_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'STRONG_NEGATIVE' | 'UNKNOWN';
export interface M2AnalysisSnapshot { composites: CompositeSnapshot; domainScores: DomainScore[]; rawRegime: MarketRegimeResult; stableRegime: StableRegimeResult; asOfTime: string | null; configVersions: string[]; }
export interface MacroSourceSnapshot { macroScore: number | null; ratesScore: number | null; inflationScore: number | null; growthScore: number | null; liquidityScore: number | null; riskScore: number | null; stableRegime: string; }
export interface MacroAgentOutput { agent: 'macro'; analysisTime: string; dataAsOfTime: string | null; timeHorizon: 'MEDIUM'; direction: MacroDirection; confidence: number; summary: string; positiveFactors: string[]; negativeFactors: string[]; risks: string[]; keyDrivers: string[]; marketImplications: string[]; evidence: AgentEvidence[]; unknowns: string[]; sourceSnapshot: MacroSourceSnapshot; status: 'VALID' | 'PARTIAL' | 'UNKNOWN'; }
export interface MacroAgentContext { sourceSnapshot: MacroSourceSnapshot; evidence: AgentEvidence[]; divergence: CompositeSnapshot['divergence']; rawRegime: string; stableRegime: string; macroStatus: string; macroConfidence: number; dataAsOfTime: string | null; configVersions: string[]; }
