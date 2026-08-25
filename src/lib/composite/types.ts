import type { DomainScore } from '../scoring/types.ts';
export interface CompositeComponent { domain: string; score: number | null; status: DomainScore['status']; confidence: number; weight: number; normalizedWeight: number | null; contribution: number | null; rawScore?: number | null; transformedScore?: number | null; transform?: string }
export interface CompositeScore { composite: 'market' | 'macro'; score: number | null; status: 'VALID' | 'PARTIAL' | 'UNKNOWN'; coverage: number; confidence: number; asOfTime: string | null; configVersion: string; components: CompositeComponent[] }
export interface RiskContext { riskScore: number | null; riskLevel: string | null; confidence: number; status: DomainScore['status']; components: DomainScore['components'] }
export interface Divergence { status: 'DIVERGENCE' | 'ALIGNED' | 'UNKNOWN'; direction: 'MARKET_ABOVE_MACRO' | 'MACRO_ABOVE_MARKET' | 'NONE' | 'UNKNOWN'; spread: number | null; absoluteGap: number | null }
export interface CompositeSnapshot { market: CompositeScore; macro: CompositeScore; risk: RiskContext; marketRiskAdjustedScore: number | null; divergence: Divergence; asOfTime: string | null; configVersion: string }
