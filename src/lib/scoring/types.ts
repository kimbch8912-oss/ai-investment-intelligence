import type { SignalDirection, StructuredSignal } from '../signals/types.ts';
export interface DomainScoreComponent { signal: string; direction: SignalDirection; strength: number | null; weight: number; contribution: number | null; status: StructuredSignal['status'] }
export interface DomainScore { domain: string; score: number | null; label: string | null; status: 'VALID' | 'PARTIAL' | 'UNKNOWN'; confidence: number; asOfTime: string | null; configVersion: string; components: DomainScoreComponent[] }
