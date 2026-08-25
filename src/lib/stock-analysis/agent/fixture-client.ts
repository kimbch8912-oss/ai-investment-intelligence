import type { StructuredLlmClient } from '../../agents/llm/types.ts';
import type { StockAnalysisAgentInput, StockAnalysisAgentOutput, StockAnalysisView } from './types.ts';

const view = (state: string, label: string): StockAnalysisView => ({ state, summary: `${label}: ${state}` });
const positive = (state: string) => /STRONG_UPTREND|UPTREND|POSITIVE|STRONG|HEALTHY|EARLY_RECOVERY|EXPANSION/.test(state);
const negative = (state: string) => /DOWNTREND|NEGATIVE|WEAK|CONTRACTION|SLOWDOWN|STRESSED|LEVERAGED/.test(state);
const evidenceOf = (input: StockAnalysisAgentInput) => { const source = [input.technical.evidence, input.fundamental.evidence, input.industry.evidence, input.macro?.evidence ?? [], (input.asset.market === 'KRX' || input.asset.country === 'KR' ? input.koreaMarket?.evidence : input.globalMarket?.evidence) ?? [], input.news?.evidence ?? [], input.research?.evidence ?? [], input.risk?.evidence ?? []]; const seen = new Set<string>(); return source.flat().filter((item) => !seen.has(item.id) && !!seen.add(item.id)); };
/** Deterministic stand-in implementing the existing structured-client shape; it never calls an LLM. */
export class DeterministicStockAnalysisFixtureClient implements StructuredLlmClient {
  async generateStructured<T>(request: { context: unknown }): Promise<T> {
    const input = request.context as StockAnalysisAgentInput;
    const technicalState = `${input.technical.trend}/${input.technical.momentum}/${input.technical.rsiState}`;
    const fundamentalState = `${input.fundamental.growthState}/${input.fundamental.profitabilityState}/${input.fundamental.cashFlowState}`;
    const industryState = `${input.industry.industryDirection}/${input.industry.industryCycle}`;
    const macroState = input.macro?.direction ?? 'UNKNOWN'; const routedMarket = input.asset.market === 'KRX' || input.asset.country === 'KR' ? input.koreaMarket : input.globalMarket; const marketState = routedMarket?.direction ?? 'UNKNOWN'; const riskState = input.risk?.riskLevel ?? 'UNKNOWN';
    const states = [['Technical', technicalState], ['Fundamental', fundamentalState], ['Industry', industryState], ['Macro', macroState], ['Market', marketState], ['Risk', riskState]] as const;
    const positives = states.filter(([, state]) => positive(state)).map(([name, state]) => `${name}: ${state}`);
    const negatives = states.filter(([, state]) => negative(state)).map(([name, state]) => `${name}: ${state}`);
    const conflicts: string[] = [];
    if (positive(technicalState) && negative(industryState)) conflicts.push(`Technical ${technicalState} conflicts with Industry ${industryState}`);
    if (positive(fundamentalState) && negative(technicalState)) conflicts.push(`Fundamental ${fundamentalState} conflicts with Technical ${technicalState}`);
    const unknowns = [...input.technical.unknowns, ...input.fundamental.unknowns, ...input.industry.unknowns, ...(input.macro?.unknowns ?? ['macro context is missing']), ...(routedMarket?.unknowns ?? ['routed market context is missing']), ...(input.news?.unknowns ?? ['news context is missing']), ...(input.research?.unknowns ?? ['research context is missing']), ...(input.risk?.unknowns ?? ['risk context is missing'])];
    const coverages = [input.technical.confidence, input.fundamental.confidence, input.industry.confidence, input.macro?.confidence ?? null, routedMarket?.confidence ?? null, input.risk?.confidence ?? null].filter((value): value is number => typeof value === 'number');
    const output: StockAnalysisAgentOutput = { asset: input.asset, summary: `Technical ${technicalState}; Fundamental ${fundamentalState}; Industry ${industryState}; Macro ${macroState}; Market ${marketState}; Risk ${riskState}.`, technicalView: view(technicalState, 'Technical'), fundamentalView: view(fundamentalState, 'Fundamental'), industryView: view(industryState, 'Industry'), macroView: view(macroState, 'Macro'), marketView: view(marketState, input.asset.market === 'KRX' || input.asset.country === 'KR' ? 'Korea market' : 'Global market'), riskView: view(riskState, 'Risk'), positiveFactors: positives, negativeFactors: negatives, conflictingFactors: conflicts, keyRisks: input.risk?.topRisks ?? (riskState === 'HIGH' ? ['High risk context'] : []), evidence: evidenceOf(input), unknowns, confidence: coverages.length ? coverages.reduce((sum, value) => sum + value, 0) / coverages.length : null, asOfTime: input.asOfTime };
    return output as T;
  }
}
