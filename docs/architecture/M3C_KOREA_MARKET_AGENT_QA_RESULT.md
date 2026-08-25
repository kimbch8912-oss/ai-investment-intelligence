# M3-C Korea Market Agent QA Result

`PASS` — `m3c-v1` provides an independent Korea Market Agent using only read-only M2 context and fixture-only Korea context. It has no dependency on Macro or Global Agent natural-language output.

- Korea context: optional KOSPI, KOSDAQ, USD/KRW, foreign flow, institutional flow, and semiconductor metrics. Each holds validated direction, strength, confidence, evidence, status, and fixture source status.
- Coverage only: KOSPI .25, KOSDAQ .15, USD/KRW .20, foreign flow .15, institutional .05, semiconductor .20. Minimum coverage is .50; this is an input sufficiency gate, not a Korea score.
- Direction: deterministic positive/negative evidence dominance only when coverage is sufficient; insufficient coverage is `UNKNOWN`. Confidence is coverage-weighted metric confidence, not an LLM number.
- QA PASS: broad positive, weak, KOSPI/KOSDAQ divergence, FX pressure, semiconductor-led context, Global/Macro positive while Korea weak, partial, insufficient UNKNOWN, high risk, fabricated evidence, recommendation guard, read-only inputs, and invalid output.
- Common StructuredLlmClient, run envelope, evidence validation, and recommendation guard are reused. Output is Korean structured interpretation and evidence is limited to M2 or supplied Korea fixture evidence.
- Actual LLM, FRED, ECOS, Market Provider calls, DB writes, schema/RLS/seed changes, and dependencies: 0.
- Future gap: `FUTURE_KOREA_DETERMINISTIC_INPUT` — real Korea deterministic signals require a separately approved M2 extension after provider availability.
