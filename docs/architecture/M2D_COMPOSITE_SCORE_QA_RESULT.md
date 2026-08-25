# M2-D Composite Market / Macro Score QA Result

## Verdict

**PASS**

## Configuration and Scope

`m2d-v1` centralizes Market weights (Momentum 0.40, Trend 0.40, Risk 0.20), Macro weights (Rates 0.25, Inflation 0.25, Growth 0.30, Liquidity 0.20), minimum coverage 0.60, risk penalty 0.30, and divergence threshold 30.

Market and Macro are independent outputs. No Overall Score, Market Regime, scenario, CIO output, recommendation, allocation, or LLM output exists.

## Risk Handling

Market transforms the Risk Domain explicitly: `riskSupport = 100 - riskScore`. The Risk component records raw score, transformed score, transform text, weight, normalized weight, and contribution. Risk Context remains independent and exposes the original risk score/level. Risk-adjusted Market Score is a labelled auxiliary calculation: `market × (1 - (risk/100 × 0.30))`; it is null without both inputs.

## Coverage, Confidence, and Time

Unknown Domain Scores are excluded and available weights are re-normalized. Coverage below 0.60 returns `UNKNOWN` and null score; otherwise partial coverage returns `PARTIAL`. Confidence is normalized weighted Domain Score confidence multiplied by coverage, clamped to 0–1.

The snapshot selects the most conservative usable input time (earliest supplied usable as-of time); it never invents a later calculation time.

## Fixture QA

| Scenario | Result |
| --- | --- |
| Broad Positive | PASS — Market 80.0, Macro 71.5, aligned |
| Market Strong / Macro Weak | PASS — divergence, `MARKET_ABOVE_MACRO` |
| Macro Strong / Market Weak | PASS — divergence, `MACRO_ABOVE_MARKET` |
| High Risk Rally | PASS — raw Market exists; risk-adjusted score is lower; Risk 90 becomes Support 10 |
| Partial Coverage | PASS — Momentum + Risk coverage 0.6, weights re-normalized, status `PARTIAL` |
| Insufficient | PASS — coverage 0.4, Market score and risk-adjusted value null |
| Risk transformation | PASS — 0→100, 20→80, 50→50, 100→0 rule implemented |
| Confidence / clamp / config version | PASS — bounded values and `m2d-v1` output |

## Scope and Regression

| Check | Result |
| --- | --- |
| LLM calls | 0 |
| FRED / ECOS / Market Provider calls | 0 / 0 / 0 |
| DB writes / composite table | 0 / none |
| Schema / RLS / seed changes | None |
| New dependencies | None |
| M2-A / M2-B / M2-C QA | PASS / PASS / PASS |
| M1-F / M1-G QA | PASS / PASS |
