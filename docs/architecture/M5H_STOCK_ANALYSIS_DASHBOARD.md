# M5-H Stock Analysis Dashboard

The dashboard is fixture-only. `src/dashboard/fixtures/stock-analysis-fixtures.ts` holds the two `StockAnalysisFixture` records and is the sole UI data source; it makes no database, provider, or LLM calls.

The dashboard server renders the Korean interface with Asset Header, CIO Hero, a Canvas price/MA/volume chart, analysis cards, risks, factors, invalidation, monitoring, and collapsed evidence. `데이터 부족` is explicitly used for missing values.

For production, an adapter should return the same `StockAnalysisFixture` contract. Its `chart` record maps directly to a read-only `market_prices` source with close, MA20, MA60, MA120, and volume fields.
