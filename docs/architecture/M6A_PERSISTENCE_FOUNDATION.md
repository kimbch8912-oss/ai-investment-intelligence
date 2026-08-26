# M6-A persistence foundation

Existing M1 tables are reused: `market_prices` has the asset/provider/interval/time uniqueness constraint; `economic_observations` preserves `(series, observation date, vintage)` history. RLS remains enabled and repositories only create the server secret client.

No migration is required. Market cache writes use `ignoreDuplicates` on the existing identity; economic writes use the existing vintage identity and never overwrite revisions.

Current schema has no normalized fundamental or news document/event storage suitable for these caches. Both are deferred to M6-B proposal rather than adding JSON cache tables.

US searched assets such as NVDA/AAPL are not currently present in `assets` or `asset_identifiers`. There is no reviewed server-side asset creation contract, so this foundation intentionally does not create them. Asset-resolution persistence is deferred pending that contract.
