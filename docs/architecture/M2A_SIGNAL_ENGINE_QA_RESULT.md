# M2-A Deterministic Signal Engine QA Result

## Verdict

**PASS**

## Implementation

```text
src/lib/signals/
  types.ts
  validators.ts
  calculations/{returns,moving-average,volatility,drawdown,change}.ts
  market/market-signal-engine.ts
  economic/economic-signal-engine.ts
  qa/fixture-signal-qa.ts
```

The Engine accepts decimal-safe strings and has no provider, HTTP, LLM, database, or persistence dependency. Every calculation returns `metric`, `value`, `unit`, `asOfTime`, `lookback`, `inputCount`, and `VALID` / `INSUFFICIENT_DATA` / `INVALID_INPUT` status.

## Numeric Boundary

Input values are validated as non-exponential decimal strings before conversion. M2-A then uses JavaScript `Number` only for bounded, deterministic derived metrics (ratios, averages, standard deviation, and square root). It does not serialize a computed number back into Foundation numeric columns and does not perform money settlement or exact-accounting arithmetic. A Decimal package was not required for this scope and no dependency was added.

## Fixture QA

| Calculation / scenario | Result |
| --- | --- |
| 1D / 5D / 20D return | PASS — exact known ratios verified |
| MA5 / MA20 / MA60 | PASS — known values verified; MA60 insufficient case returns `INSUFFICIENT_DATA` |
| Price vs MA | PASS — included in Market Signal Snapshot |
| 20D realized volatility | PASS — daily and configurable 252-day annualized values validated |
| Drawdown | PASS — current drawdown and peak-to-trough maximum drawdown verified |
| Monthly MoM / YoY | PASS — calendar-date lookups, not blind array offsets |
| Quarterly QoQ / YoY | PASS — three-month and twelve-month calendar-date lookups |
| Basis-point change | PASS — 4.25 to 4.35 equals +10 bp |
| Treasury spread | PASS — 4.35 minus 3.95 equals 0.40 percentage points |
| Revision / look-ahead | PASS — same observation selects 100 before revised vintage and 105 after it |
| Missing / insufficient data | PASS — no zero-fill; unavailable lookback returns explicit status |

## Look-ahead Rule

`selectVintageAtOrBefore` selects the latest `vintageAt` no later than `calculationTime` separately for every observation date. Future revisions are excluded. The input is sorted internally before calculation; unordered input therefore cannot change the output.

## Scope Checks

| Check | Result |
| --- | --- |
| LLM calls | 0 |
| FRED / ECOS / Market Provider calls | 0 / 0 / 0 |
| DB signal writes | 0 |
| Schema / migration / RLS / seed changes | None |
| New dependencies | None |
| M1-F Fixture Core regression | PASS |
| M1-G Fixture Batch regression | PASS |
| M1-H Dashboard renderer regression | PASS |

## Exclusions

No market regime, score, bullish/bearish judgement, recommendation, RSI, MACD, Bollinger Bands, correlation, provider adapter, or historical backfill was implemented.

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
