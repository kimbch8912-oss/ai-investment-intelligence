import type { StockAnalysisAgentOutput } from '../agent/types.ts';
import type { StockCioOutput } from '../cio/types.ts';
import type { StockFundamentalContext } from '../fundamental/types.ts';
import type { IndustryContext, NewsContext } from '../types.ts';
import type { TechnicalSignalContext } from '../technical-signals/types.ts';

export type ReportSection = { text: string; evidenceIds: readonly string[] };
export interface LiveStockReport { investmentView: string; confidence: number | null; oneLineConclusion: ReportSection; currentView: ReportSection; technical: ReportSection; fundamental: ReportSection; industry: ReportSection; marketMacro: ReportSection; news: ReportSection; positiveFactors: ReportSection; negativeFactors: ReportSection; conflictingSignals: ReportSection; keyRisks: ReportSection; invalidation: ReportSection; monitoring: ReportSection; uncertainties: ReportSection; asOfTime: string | null; }
export interface LiveStockReportInput { cio: StockCioOutput; analysis: StockAnalysisAgentOutput; technical: TechnicalSignalContext; fundamental: StockFundamentalContext; industry: IndustryContext; news: NewsContext; asOfTime: string | null; }
export interface LiveStockReportRun { status: 'COMPLETED' | 'FAILED'; report: LiveStockReport | null; error?: string; }
