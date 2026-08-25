import type { InvestmentStance } from './types.ts';

export const CIO_CONFIG = {
  agentVersion: 'm3i-v1', promptVersion: 'cio-agent-v1',
  baseStanceMapping: { STRONG_BULL: 'STRONGLY_CONSTRUCTIVE', BULL: 'CONSTRUCTIVE', NEUTRAL: 'NEUTRAL', CAUTION: 'DEFENSIVE', BEAR: 'DEFENSIVE', CRISIS: 'STRONGLY_DEFENSIVE', UNKNOWN: 'UNKNOWN' } as const satisfies Record<string, InvestmentStance>,
  riskStanceCap: { LOW: 'STRONGLY_CONSTRUCTIVE', NORMAL: 'CONSTRUCTIVE', ELEVATED: 'NEUTRAL', HIGH: 'DEFENSIVE', UNKNOWN: 'UNKNOWN' } as const satisfies Record<string, InvestmentStance>,
  challengeDowngrade: { LOW: 0, MODERATE: 1, HIGH: 2 } as const,
  confidenceCap: 85,
  minimumConfidence: 20,
  scenarioMax: 3,
} as const;
