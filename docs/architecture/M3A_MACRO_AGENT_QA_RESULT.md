# M3-A Macro Agent QA Result

## Final Result

`PASS` — Macro Agent core contract is verified with deterministic fixture LLM output. No external economic, market, or LLM provider was called.

## Contract

- Agent/version: `macro` / `m3a-v1`; prompt version: `macro-agent-v1`.
- Input: read-only M2 snapshot macro composite, four macro domain scores, risk context, divergence, raw/stable regime, evidence, `asOfTime`, and config versions.
- Output: structured Korean Macro Agent output with direction, deterministic M2 macro confidence, positive/negative factors, risks, drivers, market implications, evidence, unknowns, and copied source snapshot.
- Run envelope: `runId`, agent/version, prompt version, status, input/started/finished time, output, and structured errors.
- The adapter boundary is `StructuredLlmClient.generateStructured<T>()`; the QA client is deterministic and provider-independent.

## Controls

- No M2 score, regime, or calculation is recomputed or changed.
- Output source snapshot must exactly equal the input projection.
- Evidence identifiers are checked against the M2-derived allow-list; fabricated references produce `EVIDENCE_MISMATCH`.
- Missing output fields and recommendation language (`BUY`, `SELL`, `매수`, `매도`, target price, guaranteed returns) produce `AGENT_OUTPUT_INVALID`.
- Missing required M2 inputs result in structured `AGENT_INPUT_INVALID` envelope status `UNKNOWN` without invoking the LLM.
- FACT/CALCULATION/INFERENCE/OPINION types are available; M2 numeric inputs are emitted as `CALCULATION` evidence. The fixture narrative does not introduce source facts.

## Fixture QA

| Case | Result |
| --- | --- |
| Positive macro | PASS |
| Weak macro | PASS |
| Mixed macro | PASS |
| Market/macro divergence | PASS |
| Partial coverage | PASS — liquidity unknown is stated |
| UNKNOWN macro composite | PASS |
| High risk with positive macro | PASS — risk is separate from macro direction |
| No recalculation | PASS |
| Fabricated evidence | PASS — rejected |
| Invalid output | PASS — rejected |
| Recommendation guard | PASS — rejected |

## Scope and Regression

- Actual LLM calls: 0. FRED calls: 0. ECOS calls: 0. Market provider calls: 0.
- DB writes, schema, RLS, and seed changes: 0.
- New dependencies: 0.
- M2 Completion, M2-A through M2-F, and M1-F/G fixture regressions: PASS.
- External state remains unchanged: `ECOS_API_KEY` available/verified; `FRED_API_KEY` and `MARKET_DATA_API_KEY` pending. Market data provider and license decisions remain pending.
