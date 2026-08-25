import type { GlobalMarketOutput } from '../../agents/global-market/types.ts';
import type { KoreaMarketOutput } from '../../agents/korea-market/types.ts';
import type { MacroAgentOutput } from '../../agents/macro/types.ts';
import type { RiskOutput } from '../../agents/risk/types.ts';
import type { AgentError, AgentEvidence } from '../../agents/types.ts';
import type { StockFundamentalContext } from '../fundamental/types.ts';
import type { IndustryContext, NewsContext, ResearchContext, ResolvedStockAsset, StockAnalysisRequest } from '../types.ts';
import type { TechnicalSignalContext } from '../technical-signals/types.ts';

export interface StockAnalysisAgentInput { request: StockAnalysisRequest; asset: ResolvedStockAsset; technical: TechnicalSignalContext; fundamental: StockFundamentalContext; industry: IndustryContext; macro: MacroAgentOutput | null; koreaMarket: KoreaMarketOutput | null; globalMarket: GlobalMarketOutput | null; news?: NewsContext; research?: ResearchContext; risk: RiskOutput | null; asOfTime: string | null; }
export interface StockAnalysisView { state: string; summary: string; }
export interface StockAnalysisAgentOutput { asset: ResolvedStockAsset; summary: string; technicalView: StockAnalysisView; fundamentalView: StockAnalysisView; industryView: StockAnalysisView; macroView: StockAnalysisView; marketView: StockAnalysisView; riskView: StockAnalysisView; positiveFactors: readonly string[]; negativeFactors: readonly string[]; conflictingFactors: readonly string[]; keyRisks: readonly string[]; evidence: readonly AgentEvidence[]; unknowns: readonly string[]; confidence: number | null; asOfTime: string | null; }
export interface StockAnalysisAgentRun { status: 'COMPLETED' | 'UNKNOWN' | 'FAILED'; output: StockAnalysisAgentOutput | null; errors: AgentError[]; }
