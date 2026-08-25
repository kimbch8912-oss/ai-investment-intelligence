# M1-F Ingestion Core / Provider Adapter QA Result

## Verdict

**PASS**

## Scope and Environment

| Item | Result |
| --- | --- |
| DEV project | `abbaxvvcvntdbrvcwsvk` only (`investment-intelligence-dev`) |
| PostgreSQL | 17.6 |
| External provider HTTP calls | FRED 0, ECOS 0, Market Provider 0 |
| Schema / migration / RLS / seed change | None |
| New dependency | None |

The QA used the existing M1-E seed records (`assets.symbol = 005930`, `system_sources.code = FRED`, and `economic_series.source_series_id = DGS10`) only to resolve internal IDs. It did not create a provider identifier or represent FRED as a market-price provider.

## Implementation Structure

```text
src/lib/ingestion/
  types.ts                         normalized domain types and result contract
  errors.ts                        bounded ingestion error categories
  validators.ts                    market/economic validation before persistence
  providers/
    types.ts                       IngestionProvider<TInput, TRaw>
    fixture-provider.ts            HTTP-free generic fixture adapter
  normalizers/
    market-price.ts                fixture raw -> normalized market record
    economic-observation.ts        fixture raw -> normalized economic record
  repositories/
    types.ts                       injected SQL executor contract
    market-price-repository.ts     UPSERT writer contract
    economic-observation-repository.ts immutable vintage writer contract
  run-ingestion.ts                 fetch -> normalize -> validate -> optional write
  qa/fixture-core-qa.ts            executable fixture-core QA
```

Providers return raw results only; normalizers build the normalized domain records; validators reject invalid records before a repository is called. The SQL executor is injected, so no credential, URL, or external-provider implementation is embedded in this Core.

## Fixture and Dry Run

- `FixtureProvider` is generic and performs no HTTP request.
- Market fixture uses direct resolved internal IDs, interval `1d`, and decimal-safe string values.
- Economic fixture uses direct resolved series ID, observation date `2026-01-01`, and vintages `100` / `105`.
- `dryRun: true` ran fetch, normalize, and validate; it reported one valid market record and produced no writer call or DB row.

## Market QA

| Scenario | Result |
| --- | --- |
| Insert | PASS — one QA row accepted in transaction |
| Duplicate | PASS — unique key retained one row |
| Correction | PASS — retained one row and changed `close` from `100` to `101` through `ON CONFLICT ... DO UPDATE` |
| Invalid negative price | PASS — validator rejected `-1`; no writer call in executable Fixture QA |

The repository conflict target is `(asset_id, source_id, interval, market_time)`. Its update set includes all mutable market values, `currency`, `retrieved_at`, and `updated_at`; it does not delete/reinsert records.

## Economic Vintage QA

| Scenario | Result |
| --- | --- |
| Vintage 1 (`100`) | PASS — inserted |
| Same vintage repeated | PASS — `ON CONFLICT ... DO NOTHING`; row count unchanged |
| Vintage 2 (`105`) | PASS — separate immutable row inserted |
| Historical reconstruction at `2026-01-03T12:00:00Z` | PASS — latest eligible vintage resolves to `100` |

The repository never updates an economic observation and uses `(series_id, observation_date, vintage_at)` as its conflict target.

## Database Integration and Cleanup

The DEV SQL integration QA executed inside one explicit transaction. It resolved existing seed IDs, ran market insert/duplicate/correction and economic insert/duplicate/new-vintage/reconstruction assertions, then issued `ROLLBACK`.

Post-rollback verification:

| Table | Rows |
| --- | ---: |
| `market_prices` | 0 |
| `economic_observations` | 0 |

M1-E seed data was not deleted or modified.

## Validation Rules

- Market: UUID asset/source IDs, permitted interval, valid timestamps, at least one price, non-negative decimal-string prices/volume, and uppercase three-letter currency.
- Economic: UUID series ID, ISO date, valid vintage/retrieval timestamps, and either `value` or `value_text`.
- Numeric raw values remain strings; the Core performs no floating-point calculation.
- Batch processing retains valid and rejected records separately. Error contexts contain bounded operational values only, never credentials.

## Findings and Deferred Work

No schema or Core defect was found.

```text
PENDING_EXTERNAL_KEYS
- ECOS_API_KEY
- FRED_API_KEY
- MARKET_DATA_API_KEY

PENDING_EXTERNAL_DECISIONS
- MARKET_DATA_PROVIDER
```

The existing RLS security gate remains intentionally deferred by M1 scope. The new repositories are server/development writer contracts; RLS/policies/grants were not changed and must be addressed before future Data API/frontend exposure.
