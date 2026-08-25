# M2-C Domain Scoring Layer QA Result

## Verdict

**PASS**

## Domain Scores

The implemented independent domains are Momentum, Trend, Rates, Inflation, Growth, Liquidity, and Risk. No overall market score, macro composite, regime, scenario, CIO output, or recommendation exists.

## Deterministic Mapping and Strength

`m2c-v1` maps directions to targets: strong positive 100, positive 75, neutral 50, negative 25, strong negative 0. A signal's normalized strength interpolates from neutral (50) to that target; output is clamped to 0–100 and rounded to one decimal.

Rates and Inflation are intentionally inverted for their documented domain semantics: tightening/rising-rate and accelerating-inflation signals lower their respective domain scores. Risk is not inverted into an investment score; it maps risk state to 20/40/65/85 for low/normal/elevated/high risk.

## Weight, Coverage, and Confidence

All domain weights are centralized in `src/lib/scoring/config.ts` under `m2c-v1` and sum to 1.0. Rates uses 0.6 rates + 0.4 yield curve; Growth uses 0.7 growth + 0.3 economic momentum; Risk uses 0.5 volatility + 0.5 drawdown.

Unknown signals are excluded, not assigned zero. Available weights are renormalized when coverage is at least 0.5; this yields `PARTIAL` and coverage confidence. Below 0.5 yields `UNKNOWN`, null score, and no fabricated neutral result. Confidence is signal/data coverage only, not AI or historical-accuracy confidence.

## QA Matrix

| Scenario | Result |
| --- | --- |
| Momentum / Trend | PASS — positive signals score 75 |
| Rates | PASS — inverted rates/yield components and 60/40 weight produce 55 in mixed fixture |
| Inflation | PASS — decelerating fixture scores 75 under initial inverse rule |
| Growth | PASS — growth/economic-momentum 70/30 fixture scores 75 |
| Liquidity | PASS — expanding fixture scores 75 |
| Risk | PASS — low risk fixture scores 20 and has `LOW` label; high-risk fixture scores 85 |
| Mixed/conflicting domains | PASS — momentum 75 and risk 85 remain independent outputs |
| Partial / renormalization | PASS — available 0.6 rates weight renormalizes to 75, `PARTIAL`, confidence 0.6 |
| Insufficient | PASS — unknown components produce null score and `UNKNOWN` |
| Strength | PASS — positive strength 0.2 scores below positive strength 1.0 |
| Config/evidence | PASS — all results carry `m2c-v1`; components retain signal, direction, strength, weight, contribution, status |

## Scope and Regression

| Check | Result |
| --- | --- |
| LLM calls | 0 |
| FRED / ECOS / Market Provider calls | 0 / 0 / 0 |
| DB writes / score table | 0 / none |
| Schema / RLS / seed changes | None |
| New dependencies | None |
| M2-A / M2-B QA | PASS / PASS |
| M1-F / M1-G QA | PASS / PASS |
