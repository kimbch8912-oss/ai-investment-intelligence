# M3-B Global Market Agent QA Result

`PASS` — `m3b-v1` uses a read-only M2 subset through the existing `StructuredLlmClient`, with `global-market-agent-v1` prompt policy.

- Input: market/macro composite, momentum/trend/risk domains, divergence, raw/stable regime, adjusted market score, confidence, as-of time, and config versions.
- Output: structured Korean market interpretation, deterministic Stable-Regime direction, conservative confidence `min(market confidence, stable regime confidence)`, evidence, unknowns, source snapshot, and common run envelope.
- Mapping: STRONG_BULL → STRONG_POSITIVE; BULL → POSITIVE; NEUTRAL/CAUTION → NEUTRAL; BEAR → NEGATIVE; CRISIS → STRONG_NEGATIVE; UNKNOWN → UNKNOWN.
- QA PASS: Strong Bull, Bull, Neutral, High Risk Rally, Bear, Crisis, both divergence directions, Raw/Stable mismatch, Partial, UNKNOWN, read-only input, fabricated evidence, invalid output, and recommendation guard.
- Evidence allow-list includes market/macro composite, momentum/trend/risk, divergence, raw/stable regime, and market risk-adjusted score. Values are `CALCULATION`; interpretation is `INFERENCE`; no new FACT is created.
- Actual LLM/FRED/ECOS/market-provider calls, DB writes, schema/RLS/seed changes, and new dependencies: 0.
- M3-A, M2 Completion, and M1-F/G regressions: PASS.
