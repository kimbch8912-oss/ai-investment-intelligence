# AI Investment Intelligence System — M0 System Overview

## Purpose

M0 establishes the architectural baseline for a personal AI investment research system. It is a documentation milestone only: no database migrations, external integrations, UI, signal calculation, or AI agents are implemented here.

The product is intended to combine global and Korean markets, macroeconomic data, news, company data, and research materials into explainable investment research. It is not a news-summary product or a single-price-prediction system.

## Fixed Core Flow

```text
External Data
→ Raw Data
→ Normalization
→ Database
→ Signal Engine
→ Specialized Agents
→ Risk Agent
→ Devil's Advocate
→ CIO Agent
→ Scenario
→ Daily Brief
→ Prediction
→ Result Evaluation
→ Agent Performance
→ Future Confidence Calibration
```

Each stage has a distinct responsibility. Upstream data remains traceable; downstream interpretation must retain its evidence and as-of date. Result evaluation feeds agent-specific historical performance and future confidence calibration, without retrospectively altering a recorded judgment. Later milestones may add detail without bypassing this flow.

## Responsibility Boundaries

| Layer | Responsibility | Not its responsibility |
| --- | --- | --- |
| Data foundation | Acquire, retain, normalize, and identify data | Investment interpretation |
| Calculation / signal engine | Deterministic returns, ratios, indicators, and statistics | Narrative reasoning |
| Specialized agents | Interpret bounded domains from supplied evidence | Numerical calculation or unsupported facts |
| Risk and devil layers | Evaluate downside, uncertainty, and contrary cases | Replacing source evidence |
| CIO layer | Synthesize supported views into scenarios and posture | Introducing unsupported claims |
| Evaluation | Compare recorded predictions with later results | Retrospectively altering prior judgments |

LLMs interpret data, causal relationships, news significance, scenarios, counterarguments, risk, and explanations. Code or SQL performs all numerical and statistical calculations, including returns, PER, moving averages, volatility, drawdown, ratios, and financial-data arithmetic.

## Architecture Principles

- Use internal `asset_id` as the market-data linkage key; symbols are attributes, not the primary relationship key.
- Separate raw source material, normalized facts, calculations, inferences, and opinions.
- Preserve source provenance, reliability, priority, and data as-of time.
- Keep `analysis_time`, `data_as_of_time`, `source_published_at`, and `retrieved_at` distinct: respectively when analysis ran, when its input data was valid, when the source published it, and when the system collected it. They are not assumed to be equal.
- Store standard database timestamps in UTC; default UI presentation is `Asia/Seoul`. Preserve original market timezone metadata where available, such as `America/New_York` for US markets and `Asia/Seoul` for Korea, so conversion does not erase market-local timing.
- Treat uncertainty as a first-class output; use `UNKNOWN` when evidence is insufficient.
- Produce Bull, Base, and Bear scenarios rather than a single asserted future.
- Record confidence and later assess prediction outcomes so agent-specific historical accuracy can inform future confidence calibration.
- Keep thresholds, weights, and policy versions configurable rather than permanently embedding them in code.

## Milestone Map

| Milestone | Scope |
| --- | --- |
| M0 | Architecture documentation |
| M1 | Data foundation |
| M2 | Signal engine |
| M3 | Core agents |
| M4 | Risk, devil, and CIO layers |
| M5 | Fundamental and research capabilities |
| M6 | Watchlist |
| M7 | Prediction evaluation |
| M8 | Personal portfolio |
| M9 | Automation and alerts |

## UI Information Architecture

The future top-level navigation is `Dashboard`, `Market`, `Research`, `Watchlist`, `AI History`, and `Settings`. User-facing text defaults to Korean; database, API, type, and enum names remain English.

The future Dashboard centers on Market Regime, Global Market, Korea Market, Macro, Risk, Today's Insight, Key Drivers, Investment Posture, Top Opportunities, and Top Risks.
