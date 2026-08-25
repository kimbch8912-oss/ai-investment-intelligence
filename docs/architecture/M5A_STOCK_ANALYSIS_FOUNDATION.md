# M5-A Stock Analysis Foundation

M5-A adds a provider-free stock-analysis boundary. It reuses M1 `assets` and `asset_identifiers` as read models; it creates neither a stock master nor a migration.

`resolveStockAsset` accepts one existing active M1 `STOCK` asset and only identifiers belonging to that asset. Any identifier for another asset is rejected. `createStockAnalysisRequest` produces `{ assetId, symbol, market, analysisTime, dataAsOfTime }` without changing the input asset.

`StockContext` preserves separate price, technical, fundamental, industry, Korea market, global market, macro, news, and research contexts. Every context carries `status`, `confidence`, `asOfTime`, and existing `AgentEvidence`. Absent data is represented as `UNKNOWN` with `null` values, never as zero or neutral.

Technical fields are contracts only: price, volume, 1D/5D/20D returns, MA20/60/120, price-vs-MA values, RSI14, realized volatility, drawdown, volume change, support levels, and resistance levels. No calculation is implemented.

Fundamentals reuse the M3-F `FundamentalSnapshot` directly. Macro reuses the existing M2/M3-A `MacroAgentOutput`; this layer performs no rates, inflation, growth, or liquidity calculation. Industry is an M5-A contract only and defaults to `UNKNOWN` until a provider exists.

Market routing is deterministic and independent of stock direction: `KRX` or country `KR` routes to the Korea context; all other stocks route to Global. The inactive counterpart remains `UNKNOWN`. Thus a market stance does not overwrite the separate technical or fundamental context.

The future `StockAnalysisOutput` includes `InvestmentView` (`STRONG_INTEREST`, `INTEREST`, `NEUTRAL`, `CAUTION`, `HIGH_RISK`, `UNKNOWN`) but deliberately creates no score, aggregation, prediction, BUY/SELL recommendation, external call, UI, or persistence.

Fixture QA covers KRX (`005930`), NASDAQ (`NVDA`), missing fundamental and industry contexts, input immutability, and rejection of an extra asset identifier.
