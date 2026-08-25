import type { AgentEvidence } from '../../agents/types.ts';
import { industryContextConfig as config } from './config.ts';
import type { IndustryContextInput } from './types.ts';
import type { IndustryContext, IndustryCycle, IndustryDirection } from '../types.ts';

const state = <T extends string>(item: { state: T } | undefined, fallback: T): T => item?.state ?? fallback;
const inputEvidence = (input: IndustryContextInput): readonly AgentEvidence[] => {
  const seen = new Set<string>();
  return [input.demand, input.supply, input.pricing, input.inventory, input.capacity, input.growth, input.competitor]
    .flatMap((item) => item?.evidence ?? []).filter((item) => !seen.has(item.id) && !!seen.add(item.id));
};
function direction(input: IndustryContextInput): IndustryDirection {
  const demand = state(input.demand, 'UNKNOWN'), supply = state(input.supply, 'UNKNOWN'), pricing = state(input.pricing, 'UNKNOWN'), inventory = state(input.inventory, 'UNKNOWN');
  const strongNegative = demand === 'CONTRACTING' && (supply === 'OVERSUPPLY' || inventory === 'EXCESS') && pricing === 'FALLING';
  if (strongNegative) return 'STRONG_NEGATIVE';
  if ((demand === 'WEAKENING' && inventory === 'BUILDING') || (supply === 'OVERSUPPLY' && pricing === 'FALLING') || (demand === 'CONTRACTING' && pricing === 'FALLING')) return 'NEGATIVE';
  // Contradictory demand and pricing evidence remains neutral; it is never promoted by a majority count.
  if ((demand === 'ACCELERATING' || demand === 'IMPROVING') && pricing === 'FALLING') return 'NEUTRAL';
  if (demand === 'ACCELERATING' && inventory === 'DRAWING' && pricing === 'RISING' && supply === 'TIGHT') return 'STRONG_POSITIVE';
  if ((demand === 'ACCELERATING' || demand === 'IMPROVING') && inventory === 'DRAWING' && pricing === 'RISING') return 'POSITIVE';
  if ([demand, supply, pricing, inventory].every((value) => value === 'UNKNOWN')) return 'UNKNOWN';
  return 'NEUTRAL';
}
function cycle(input: IndustryContextInput): IndustryCycle {
  const demand = state(input.demand, 'UNKNOWN'), supply = state(input.supply, 'UNKNOWN'), pricing = state(input.pricing, 'UNKNOWN'), inventory = state(input.inventory, 'UNKNOWN'), capacity = state(input.capacity, 'UNKNOWN');
  if (input.priorCycle === 'CONTRACTION' && demand === 'STABLE' && (inventory === 'DRAWING' || inventory === 'NORMAL') && pricing !== 'FALLING') return 'BOTTOMING';
  if ((demand === 'ACCELERATING' || demand === 'IMPROVING') && inventory === 'DRAWING' && pricing === 'RISING') return 'EARLY_RECOVERY';
  if (demand === 'ACCELERATING' && pricing === 'RISING' && (capacity === 'TIGHT' || supply === 'TIGHT')) return 'EXPANSION';
  if (demand === 'STABLE' && pricing === 'RISING' && capacity === 'TIGHT') return 'LATE_CYCLE';
  if (demand === 'WEAKENING' && inventory === 'BUILDING') return 'SLOWDOWN';
  if (demand === 'CONTRACTING' && pricing === 'FALLING' && (inventory === 'EXCESS' || supply === 'OVERSUPPLY')) return 'CONTRACTION';
  return 'UNKNOWN';
}
/** Converts supplied deterministic indicator states only; it does not inspect competitors or create evidence. */
export function createIndustryContext(input: IndustryContextInput): IndustryContext {
  const demandState = state(input.demand, 'UNKNOWN'), supplyState = state(input.supply, 'UNKNOWN'), pricingState = state(input.pricing, 'UNKNOWN'), inventoryState = state(input.inventory, 'UNKNOWN'), capacityState = state(input.capacity, 'UNKNOWN'), competitiveState = state(input.competitor, 'UNKNOWN');
  const entries = [input.demand, input.supply, input.pricing, input.inventory, input.capacity, input.growth, input.competitor];
  const populated = entries.filter((item) => item !== undefined && item.state !== 'UNKNOWN').length;
  const unknowns = [
    input.industry ? null : 'industry is missing', input.sector ? null : 'sector is missing',
    input.demand && demandState !== 'UNKNOWN' ? null : 'demand indicators are missing', input.supply && supplyState !== 'UNKNOWN' ? null : 'supply indicators are missing',
    input.pricing && pricingState !== 'UNKNOWN' ? null : 'pricing indicators are missing', input.inventory && inventoryState !== 'UNKNOWN' ? null : 'inventory indicators are missing',
    input.capacity && capacityState !== 'UNKNOWN' ? null : 'capacity/utilization indicators are missing', input.growth && input.growth.state !== 'UNKNOWN' ? null : 'industry growth indicators are missing',
  ].filter((item): item is string => item !== null);
  const result = { industry: input.industry, sector: input.sector, industryDirection: direction(input), industryCycle: cycle(input), demandState, supplyState, pricingState, inventoryState, capacityState, competitiveState, confidence: populated === 0 ? null : populated / entries.length, evidence: inputEvidence(input), unknowns, asOfTime: input.asOfTime, configVersion: config.version };
  return { ...result, status: populated === 0 ? 'UNKNOWN' as const : unknowns.length ? 'PARTIAL' as const : 'AVAILABLE' as const };
}
