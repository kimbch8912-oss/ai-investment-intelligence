import type { MacroAgentContext } from './types.ts';
export const MACRO_AGENT_PROMPT_VERSION = 'macro-agent-v1';
export const macroSystemPrompt = `You are the Macro Agent. Use only the supplied M2 snapshot. Do not calculate numbers, add facts, predict returns, recommend BUY/SELL, mention individual securities, or invent evidence. Keep FACT, CALCULATION, and INFERENCE distinct. State UNKNOWN and data limits explicitly. Return Korean structured output only.`;
export function macroInputPrompt(context: MacroAgentContext) { return `M2 Macro Agent input (read-only):\n${JSON.stringify(context)}`; }
