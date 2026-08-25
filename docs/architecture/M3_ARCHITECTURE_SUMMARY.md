# M3 Agent Architecture Summary

## Flow

M2 Snapshot
↓
Domain Agents
↓
Structured Claims
↓
Risk
↓
Devil Challenge
↓
CIO
↓
Investment Stance / Scenario / Invalidation

## Roles

- Macro: explains supplied M2 macro context without recalculation.
- Global Market: explains supplied market and regime context.
- Korea Market: explains supplied Korea context with allowed M2 context.
- News: structures supplied news facts and affected assets.
- Research: structures supplied research findings, methodology, and limitations.
- Fundamental: explains a supplied fundamental snapshot and its evidence.
- Risk: explains the supplied M2-derived risk context and evidence categories.
- Devil's Advocate: contract defines evidence-backed challenges to structured claims.
- CIO: integrates the M2 snapshot, evidence-backed claims, risk context, and Devil challenges into a strategic stance, non-probabilistic scenarios, and invalidation conditions.

## Gate status

M3 COMPLETE. The executable Devil's Advocate runtime and the common nine-agent registry complete the Evidence → Claim → Risk → Challenge → CIO flow.
