# Data Architecture

## Data Lifecycle

```text
External Source → Raw Source Data → Normalized Data → Deterministic Calculations → Signals / AI Inputs
```

Raw source data, normalized data, calculations, and signals are logically separate layers. Raw material must remain distinguishable from normalized records. Normalization should preserve source identity, retrieval time, source-published time where available, and the data's effective/as-of time. Derived calculations must identify their inputs and calculation basis.

For each provider, M1 may choose to retain raw responses in the database, retain them in separate storage/archive, or retain only normalized fields while preserving source identifiers and lineage. M0 does not select a storage approach or define tables for it.

## Time Semantics and Revision Safety

The architecture distinguishes `analysis_time` (when analysis ran), `data_as_of_time` (when used data was valid), `source_published_at` (when the original provider published it), and `retrieved_at` (when this system acquired it). The values are independently meaningful and must not be assumed identical.

Database timestamps use UTC; UI defaults to `Asia/Seoul`; original market timezone metadata remains preservable, including `America/New_York` for US markets and `Asia/Seoul` for Korea.

Economic data may be revised after publication. Future design must be able to associate a series, observation date, value, revision or vintage, and retrieval time. M0 does not define fields or tables, but the architecture must not assume overwrite-only economic data. Prediction and backtest evaluation must use only data actually available at the relevant judgment time, preventing revised or later-published information from introducing look-ahead bias.

## Domain Baseline

The following domains define the long-term conceptual model. M0 creates no tables or migrations; M1 selects only domains required for its approved scope.

```text
assets
market_prices
economic_series
economic_observations
news_articles
research_documents
company_financials
market_signals
agent_runs
agent_outputs
market_regimes
investment_theses
predictions
prediction_results
watchlists
watchlist_items
system_sources
```

## Asset Master

All market-related records link through a stable internal `asset_id`, not directly through a ticker-like string. An asset master supports at least:

```text
id
symbol
name
asset_type
exchange
country
currency
```

Symbol, exchange, and country information may change or require disambiguation; the internal ID provides the durable relationship key.

## Source Management

Source endpoints and source details must not be globally hardcoded throughout application code. The `system_sources` domain is designed to manage:

- source name and type
- category and country
- priority and reliability
- enabled status
- configuration metadata

Source tiers guide evidence use:

| Tier | Typical source |
| --- | --- |
| S | Government, central bank, exchange, company filing |
| A | Official research institution or leading academic institution |
| B | Major news outlet |
| C | Other research |
| D | Social media or community |

C and D sources must not serve as the sole core evidence for a future CIO judgment.

## Information Classification and Lineage

Every analytical datum or statement must be classified as one of the following:

| Class | Meaning |
| --- | --- |
| `FACT` | Source-supported observation or directly reported information |
| `CALCULATION` | Deterministically derived numeric result from identified inputs |
| `INFERENCE` | AI or analytical conclusion based on evidence |
| `OPINION` | Subjective judgment or recommendation-like viewpoint |

An inference must never be persisted or displayed as if it were source fact. Future records should make it possible to identify underlying evidence, source, timestamps, calculation or model method where relevant, and the producing system version.

## Configurable Regimes and Horizons

The intended market-regime vocabulary is `STRONG_BULL`, `BULL`, `NEUTRAL`, `CAUTION`, `BEAR`, and `CRISIS`. Scoring thresholds and weights are evaluation-controlled configuration, not permanent absolute constants.

Major investment assessments use `SHORT` (1–4 weeks), `MEDIUM` (1–6 months), or `LONG` (6 months+). Values in storage and APIs use the English enums; the UI presents Korean labels.
