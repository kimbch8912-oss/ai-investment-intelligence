# M1-B Migration QA Result

## Verdict

**PASS_WITH_NOTES** — static schema validation passed. Runtime execution was not performed because no existing local/disposable PostgreSQL, Docker, Supabase CLI, or configured test database is available. No operating or production Supabase database was used.

## Verification Environment

| Item | Result |
| --- | --- |
| Local PostgreSQL service/client | Not available |
| Docker | Not available |
| Supabase CLI | Not available |
| WSL PostgreSQL environment | No installed distribution |
| Test/production database connection | Not used |
| PostgreSQL version | Not available |

## Migration Execution

The target migration was reviewed statically: `supabase/migrations/202608190001_m1_data_foundation.sql`.

| Check | Result |
| --- | --- |
| `BEGIN` / `COMMIT` present | Pass (static) |
| `CREATE TABLE` count | Pass — exactly 6 |
| Required indexes | Pass (static) |
| Actual PostgreSQL execution | Not run — environment unavailable |

## `gen_random_uuid()`

Not executed. The migration uses `gen_random_uuid()`; runtime availability must be confirmed in the target Supabase/PostgreSQL environment before applying the migration. No extension was added or changed.

## Schema and Constraint Verification

| Area | Static result | Runtime result |
| --- | --- | --- |
| Tables | Exactly `system_sources`, `assets`, `asset_identifiers`, `market_prices`, `economic_series`, `economic_observations` | Not run |
| PK strategy | UUID master PKs; bigint identity time-series PKs | Not run |
| FK / RESTRICT | 6 explicit `ON DELETE RESTRICT` FKs | Not run |
| Symbol uniqueness | No global `assets.symbol` UNIQUE | Not run |
| Identifier unique | `(source_id, identifier_type, identifier_value)` present | Not run |
| Market price unique | `(asset_id, source_id, interval, market_time)` present | Not run |
| Economic series unique | `(source_id, source_series_id)` present | Not run |
| Economic vintage unique | `(series_id, observation_date, vintage_at)` present | Not run |
| Price checks | Non-negative values and at least one price required | Not run |
| Economic value check | `value` or `value_text` required | Not run |
| Interval check | Approved interval list present | Not run |

## Market Price Duplicate and UPSERT

The market-price natural unique constraint is present and matches the intended `ON CONFLICT (asset_id, source_id, interval, market_time)` target. Runtime duplicate and UPSERT behavior were not executed because no disposable PostgreSQL environment is available.

## Economic Vintage and Historical Reconstruction

The schema preserves distinct vintages using `(series_id, observation_date, vintage_at)`. A historical reconstruction query can select rows where `vintage_at <= cutoff` and choose the latest vintage per observation date. Runtime fixture insertion and cutoff-query verification were not executed.

`economic_observations` intentionally has no `updated_at` column and no update-blocking trigger. Existing-vintage mutation remains technically possible at the database level; ingestion policy must prohibit updates and insert a new vintage for changed values.

## Index Verification

The following four non-unique indexes are present statically:

- `market_prices_asset_market_time_idx`
- `market_prices_source_market_time_idx`
- `economic_observations_series_observation_vintage_idx`
- `economic_observations_series_vintage_idx`

## Forbidden Schema Items

Static scan found no RLS policy, trigger, RPC/custom function, seed insert, or agent/prediction/news/portfolio table in the migration.

## Rollback Verification

Not executed. In a disposable validation database, tables can be removed in dependency order: `economic_observations`, `economic_series`, `market_prices`, `asset_identifiers`, `assets`, then `system_sources`. No rollback migration file was created.

## Issues Found

No static migration/schema issue found. The only note is the missing disposable PostgreSQL runtime environment, which prevents confirmation of parser/runtime behavior, `gen_random_uuid()`, constraint violations, UPSERT, and rollback.

## Migration Modification

None. The migration was not modified during QA.
