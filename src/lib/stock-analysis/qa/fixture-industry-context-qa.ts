import { createIndustryContext } from '../industry/industry-context-engine.ts';
import type { IndustryContextInput } from '../industry/types.ts';

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const at = '2026-08-25T00:00:00.000Z';
const evidence = (id: string) => [{ id, type: 'CALCULATION' as const, label: id }];
const base = (): IndustryContextInput => ({ industry: 'Semiconductors', sector: 'Information Technology', asOfTime: at, demand: { state: 'IMPROVING', evidence: evidence('demand') }, supply: { state: 'BALANCED', evidence: evidence('supply') }, pricing: { state: 'RISING', evidence: evidence('pricing') }, inventory: { state: 'DRAWING', evidence: evidence('inventory') }, capacity: { state: 'NORMAL', evidence: evidence('capacity') }, growth: { state: 'IMPROVING', evidence: evidence('growth') }, competitor: { state: 'FAVORABLE', evidence: evidence('competition') } });

let output = createIndustryContext(base());
assert(output.industryDirection === 'POSITIVE' && output.industryCycle === 'EARLY_RECOVERY', 'A strong recovery');
output = createIndustryContext({ ...base(), demand: { state: 'ACCELERATING', evidence: evidence('demand') }, inventory: { state: 'NORMAL', evidence: evidence('inventory') }, capacity: { state: 'TIGHT', evidence: evidence('capacity') } });
assert(output.industryCycle === 'EXPANSION', 'B expansion');
output = createIndustryContext({ ...base(), demand: { state: 'WEAKENING', evidence: evidence('demand') }, inventory: { state: 'BUILDING', evidence: evidence('inventory') }, pricing: { state: 'STABLE', evidence: evidence('pricing') } });
assert(output.industryDirection === 'NEGATIVE' && output.industryCycle === 'SLOWDOWN', 'C slowdown');
output = createIndustryContext({ ...base(), supply: { state: 'OVERSUPPLY', evidence: evidence('supply') }, pricing: { state: 'FALLING', evidence: evidence('pricing') }, demand: { state: 'STABLE', evidence: evidence('demand') } });
assert(output.supplyState === 'OVERSUPPLY' && output.pricingState === 'FALLING' && output.industryDirection === 'NEGATIVE', 'D oversupply');
output = createIndustryContext({ ...base(), priorCycle: 'CONTRACTION', demand: { state: 'STABLE', evidence: evidence('demand') }, inventory: { state: 'DRAWING', evidence: evidence('inventory') }, pricing: { state: 'STABLE', evidence: evidence('pricing') } });
assert(output.industryCycle === 'BOTTOMING', 'E bottoming');
output = createIndustryContext({ ...base(), pricing: { state: 'FALLING', evidence: evidence('pricing') } });
assert(output.industryDirection === 'NEUTRAL' && output.demandState === 'IMPROVING' && output.pricingState === 'FALLING', 'F conflicting context is preserved');
output = createIndustryContext({ industry: null, sector: null, asOfTime: at });
assert(output.status === 'UNKNOWN' && output.industryDirection === 'UNKNOWN' && output.industryCycle === 'UNKNOWN', 'G missing data');
const input = base(); const before = JSON.stringify(input); output = createIndustryContext(input); const ids = new Set(inputEvidenceIds(input));
assert(output.evidence.every((item) => ids.has(item.id)), 'H evidence scope'); assert(JSON.stringify(input) === before, 'I input immutability');
console.log('M5-D industry context QA PASS');
function inputEvidenceIds(input: IndustryContextInput) { return [input.demand, input.supply, input.pricing, input.inventory, input.capacity, input.growth, input.competitor].flatMap((item) => item?.evidence ?? []).map((item) => item.id); }
