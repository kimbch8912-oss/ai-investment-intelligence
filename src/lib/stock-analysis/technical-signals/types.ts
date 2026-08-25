import type { AgentEvidence } from '../../agents/types.ts';
import type { TechnicalContext } from '../types.ts';

export type TrendSignal = 'STRONG_UPTREND' | 'UPTREND' | 'NEUTRAL' | 'DOWNTREND' | 'STRONG_DOWNTREND' | 'UNKNOWN';
export type MomentumSignal = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNKNOWN';
export type RsiState = 'OVERBOUGHT' | 'STRONG' | 'NEUTRAL' | 'WEAK' | 'OVERSOLD' | 'UNKNOWN';
export type RiskSignal = 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'UNKNOWN';
export type VolumeConfirmation = 'CONFIRMING_UP' | 'CONFIRMING_DOWN' | 'NEUTRAL' | 'WEAK_CONFIRMATION' | 'UNKNOWN';
export type LevelPosition = 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'BETWEEN_LEVELS' | 'BREAKOUT' | 'BREAKDOWN' | 'UNKNOWN';

export interface TechnicalSignalContext {
  trend: TrendSignal;
  momentum: MomentumSignal;
  rsiState: RsiState;
  volatilityRisk: RiskSignal;
  drawdownRisk: RiskSignal;
  volumeConfirmation: VolumeConfirmation;
  levelPosition: LevelPosition;
  confidence: number | null;
  evidence: readonly AgentEvidence[];
  unknowns: readonly string[];
  asOfTime: string | null;
  configVersion: string;
}

export interface TechnicalSignalInput { technical: TechnicalContext; }
