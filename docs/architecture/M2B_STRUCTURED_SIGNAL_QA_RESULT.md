# M2-B Structured Signal Layer QA Result

## Verdict

**PASS**

## Signal Types

The deterministic Structured Signal layer adds independent `market_momentum`, `market_trend`, `volatility_risk`, `drawdown_risk`, `financial_conditions_rates`, `yield_curve`, `inflation`, `growth`, `liquidity`, and `economic_momentum` signals. It produces no market regime, composite score, investment recommendation, AI narrative, or buy/sell decision.

## Result and Configuration

Every signal has `signal`, `direction`, normalized `strength` (0–1), `asOfTime`, `evidence`, `inputs`, `status`, short deterministic `reason`, and `configVersion`.

`src/lib/signals/config.ts` centralizes M2-B thresholds under `m2b-v1`; calculations do not scatter interpretation thresholds. Strength is a bounded distance from the relevant signal threshold, not an investment score.

## QA Matrix

| Scenario | Result |
| --- | --- |
| Momentum | PASS — strong uptrend, weak uptrend, neutral, and downtrend directions |
| Trend | PASS — price-vs-MA20 and MA20-vs-MA60 ordering |
| Volatility risk | PASS — high volatility maps to independent `HIGH` risk state |
| Drawdown risk | PASS — severe current/max drawdown maps to `HIGH` risk state |
| Rates | PASS — rising, stable, and falling basis-point scenarios |
| Yield curve | PASS — +1.0 / +0.2 / 0 / -0.2 / -1.0 map to all five defined states |
| Inflation | PASS — accelerating, stable, decelerating monthly change scenarios |
| Growth | PASS — improving and weakening quarterly change scenarios |
| Liquidity | PASS — expanding and contracting M2-like scenarios |
| Economic momentum | PASS — individual-series acceleration helper |
| Conflicting signals | PASS — positive momentum and high volatility remain separate records; no forced conclusion |
| UNKNOWN propagation | PASS — M2-A `INSUFFICIENT_DATA` input yields `UNKNOWN`, never `NEUTRAL` |

## Evidence and Vintage Boundary

Evidence is a bounded list of the exact metric, value, and input status used for each output. M2-B does not query observations or choose revisions; macro calculations must be passed in from M2-A after its `vintage_at <= calculation_time` selection.

## Scope and Regression

| Check | Result |
| --- | --- |
| LLM calls | 0 |
| FRED / ECOS / Market Provider calls | 0 / 0 / 0 |
| DB writes / signal table | 0 / none |
| Schema / RLS / seed changes | None |
| New dependencies | None |
| M2-A Fixture Signal QA | PASS |
| M1-F Fixture Core QA | PASS |
| M1-G Fixture Batch QA | PASS |

## Pending External Work

```text
PENDING_EXTERNAL_KEYS
- FRED_API_KEY
- ECOS_API_KEY
- MARKET_DATA_API_KEY

PENDING_EXTERNAL_DECISIONS
- MARKET_DATA_PROVIDER
- MARKET_DATA_LICENSE
```
