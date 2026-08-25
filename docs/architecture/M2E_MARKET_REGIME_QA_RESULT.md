# M2-E Market Regime Engine QA Result

## Verdict

**PASS**

## Rules

`m2e-v1` consumes M2-D Composite Snapshot without recalculating composites. Base candidates use Market bands (80/65/45/30/15), then Macro, Risk, risk-adjusted score, divergence, coverage, and confidence rules adjust them. Inputs below 0.60 combined confidence return `UNKNOWN`.

- Strong Bull requires Market ≥80, Macro ≥65, Risk <75, and risk-adjusted Market ≥65.
- Risk ≥75 caps positive regimes; Risk ≥85 downgrades to `CAUTION` except a Crisis override.
- Crisis requires Market ≤20, Macro ≤35, and Risk ≥85 together.
- Market-above-Macro divergence with Macro <45 becomes `CAUTION`.
- Macro-above-Market never upgrades weak Market confirmation above `NEUTRAL`.

All changes are recorded as deterministic adjustment codes, including risk caps, Macro divergence, confirmation limits, insufficient coverage, and Crisis override.

## QA

| Scenario | Result |
| --- | --- |
| Strong Bull | PASS — 88 / 78 / 18 → `STRONG_BULL` |
| Bull | PASS — 75 / 68 / 35 → `BULL` |
| Market Strong / Macro Weak | PASS — 82 / 32 / 45 → `CAUTION` |
| Macro Strong / Market Weak | PASS — 35 / 82 / 30 → `NEUTRAL` |
| High Risk Rally | PASS — 82 / 65 / 90 → `CAUTION` |
| Bear | PASS — 22 / 30 / 75 → `BEAR` |
| Crisis | PASS — 10 / 20 / 95 → `CRISIS` |
| Neutral mixed | PASS — 55 / 52 / 45 → `NEUTRAL` |
| Insufficient | PASS — missing Market → `UNKNOWN` |
| Market Bear / Macro Positive | PASS — 25 / 75 / 60 → `NEUTRAL`, not Bull |
| Boundaries | PASS — 80, 65, 45, 30, 15 base candidates |
| Crisis boundary | PASS — 20/35/85 triggers; Macro 36 does not |

## Scope and Regression

| Check | Result |
| --- | --- |
| LLM / external provider calls / DB writes | 0 / 0 / 0 |
| Schema / RLS / seed changes | None |
| New dependencies | None |
| M2-A through M2-D regression | PASS |
| M1-F / M1-G regression | PASS |

No BUY/SELL/HOLD action, portfolio instruction, natural-language narrative, Overall Score, or other investment recommendation is emitted.
