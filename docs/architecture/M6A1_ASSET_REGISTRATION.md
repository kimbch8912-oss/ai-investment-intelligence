# M6-A1 asset registration

`assets` has a random UUID default but no natural-key unique constraint. The registration service first looks up `(symbol, STOCK, exchange, US)`, then inserts only when absent. This is idempotent in normal serial operation, but a concurrent registration race remains; add a natural-key unique constraint only after a separate migration review.

`asset_identifiers` is the provider mapping boundary. Its existing `(source_id, identifier_type, identifier_value)` unique constraint prevents the same Twelve Data ticker from mapping to two assets. `system_sources` stores only `MARKET_DATA_API_KEY`'s environment-variable name, never its value.
