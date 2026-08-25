import type { AgentEvidence } from '../../agents/types.ts';
import type { CapacityState, CompetitiveState, DemandState, IndustryContext, IndustryCycle, InventoryState, PricingState, SupplyState } from '../types.ts';

export interface IndustryIndicator<T extends string> { state: T; evidence: readonly AgentEvidence[]; }
export interface IndustryContextInput {
  industry: string | null;
  sector: string | null;
  demand?: IndustryIndicator<DemandState>;
  supply?: IndustryIndicator<SupplyState>;
  pricing?: IndustryIndicator<PricingState>;
  inventory?: IndustryIndicator<InventoryState>;
  capacity?: IndustryIndicator<CapacityState>;
  growth?: IndustryIndicator<'ACCELERATING' | 'IMPROVING' | 'STABLE' | 'WEAKENING' | 'CONTRACTING' | 'UNKNOWN'>;
  competitor?: IndustryIndicator<CompetitiveState>;
  priorCycle?: IndustryCycle;
  asOfTime: string | null;
}
export type IndustryContextOutput = IndustryContext;
