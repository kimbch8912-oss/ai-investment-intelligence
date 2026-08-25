# M1-B Runtime QA Result

## Final Verdict

**PASS**

## Verification Environment

| Item | Result |
| --- | --- |
| Supabase project | `abbaxvvcvntdbrvcwsvk` — dedicated DEV/QA project |
| Environment separation | Confirmed by user as non-production, QA-only |
| PostgreSQL | PostgreSQL 17.6 on x86_64-pc-linux-gnu |
| Migration history | `m1_data_foundation` applied in the DEV project |
| QA fixture retention | None; all `QA_TEST_*` fixture writes were rolled back |

`202608190001_m1_data_foundation.sql` applied successfully. `SELECT gen_random_uuid()` succeeded before migration application.

## Runtime Verification Results

| Item | Result |
| --- | --- |
| Migration execution | PASS — exactly six required tables created |
| `gen_random_uuid()` | PASS |
| PK / FK RESTRICT | PASS — UUID and identity keys generated; referenced-parent deletes rejected |
| UNIQUE constraints | PASS — identifier, price, series, and vintage duplicates rejected |
| CHECK constraints | PASS — price, volume, all-price-null, interval, and missing-value checks verified |
| Asset symbol duplicate | PASS — global symbol uniqueness is absent |
| Market price UPSERT | PASS — one row retained; close, retrieved_at, and updated_at changed |
| Economic vintage fixtures | PASS — two vintages retained; duplicate vintage rejected |
| Historical reconstruction SELECT | PASS — 100 at 2026-02-15 and 105 at 2026-03-15 |
| Index existence | PASS — all four required indexes found |
| Rollback | PASS — dependency-order drops rolled back and six tables remained |

## Issues Found

No migration/schema runtime defect was found. QA fixtures were executed in one transaction and rolled back.

Supabase security advisors report RLS disabled on the six public tables. This is expected for the approved M1-B scope, which explicitly excluded RLS and policies; no RLS change was made. Before client/Data API access is enabled, a separately approved RLS and access-model implementation is required.

## Migration Modification

None. `202608190001_m1_data_foundation.sql` was not modified.

## Operating DB Change

No production or non-DEV Supabase project was accessed or changed.
