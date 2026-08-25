import type { IndustryContext, UnknownStockContext } from './types.ts';

export const unknownIndustryContext = (): IndustryContext => ({
  status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [], industry: null, sector: null,
  industryDirection: 'UNKNOWN', industryCycle: 'UNKNOWN', demandState: 'UNKNOWN', supplyState: 'UNKNOWN',
  pricingState: 'UNKNOWN', inventoryState: 'UNKNOWN', capacityState: 'UNKNOWN', competitiveState: 'UNKNOWN',
  unknowns: ['industry provider is not connected'], configVersion: 'm5d-v1',
});

export const unknownContext = (): UnknownStockContext => ({ status: 'UNKNOWN', confidence: null, asOfTime: null, evidence: [] });
