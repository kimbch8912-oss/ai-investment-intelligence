import type { CompositeSnapshot } from '../composite/types.ts';
export type Regime='STRONG_BULL'|'BULL'|'NEUTRAL'|'CAUTION'|'BEAR'|'CRISIS'|'UNKNOWN';
export interface RegimeAdjustment{code:string;from:Regime;to:Regime}
export interface MarketRegimeResult{regime:Regime;confidence:number;asOfTime:string|null;configVersion:string;baseCandidate:Regime;inputs:{marketScore:number|null;macroScore:number|null;riskScore:number|null;marketRiskAdjustedScore:number|null;divergence:string};adjustments:RegimeAdjustment[];status:'VALID'|'PARTIAL'|'UNKNOWN'}
export type RegimeInput=CompositeSnapshot;
