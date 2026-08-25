# M1-G Batch Ingestion / Failure Isolation / Retry Boundary QA Result

## Verdict

**PASS**

## Scope

| Item | Result |
| --- | --- |
| DEV project used for SQL QA | `abbaxvvcvntdbrvcwsvk` only |
| External provider HTTP calls | FRED 0, ECOS 0, Market Provider 0 |
| Schema / migration / RLS / seed change | None |
| New dependency | None |
| Retry execution / backoff / queue / scheduler | Not implemented by design |

## Batch Structure

`run-batch-ingestion.ts` implements the following bounded flow:

```text
Fixture Provider -> Normalize (per record) -> Validate (per record)
-> Valid / Rejected -> Write (per record) -> Batch Summary
```

The result includes `runId`, UTC `startedAt`/`finishedAt`, run-level failure state, count fields, per-record results, and a bounded error list. No run result is persisted to a database table.

## Record Status and Error Boundary

| Status | Meaning |
| --- | --- |
| `INSERTED` | New row written |
| `UPDATED` | Changed market natural key written |
| `SKIPPED` | Identical market re-collection or same economic vintage |
| `REJECTED` | Validation failed before writer call |
| `FAILED` | Normalization, writer, or run-level provider failure |

Errors are categorized as `PROVIDER_ERROR`, `NORMALIZATION_ERROR`, `VALIDATION_ERROR`, `RESOLUTION_ERROR`, or `DATABASE_ERROR`, with `retryable`, `provider`, `recordIndex`, `stage`, and a safe message. Error contexts do not include secrets.

Retryable is classification only: the QA fixture marks a provider timeout and temporary database error as retryable. Validation and normalization failures are non-retryable. No automatic retry was added.

## Repository Result Refinement

- Market UPSERT uses its existing natural key and returns `INSERTED` or `UPDATED`; a `WHERE ... IS DISTINCT FROM ...` predicate makes a fully identical re-collection `SKIPPED` without a preliminary SELECT.
- Economic observation preserves immutable vintage semantics and maps `ON CONFLICT DO NOTHING` to `SKIPPED`.

## Executable Fixture Batch QA

The no-dependency script `src/lib/ingestion/qa/fixture-batch-qa.ts` passed using Node TypeScript type stripping.

| Scenario | Result |
| --- | --- |
| Dry-run market batch | PASS — 4 valid / 1 rejected; writer calls 0 |
| Market batch (5 rows) | PASS — 2 inserted, 1 updated, 1 skipped, 1 rejected, 0 failed |
| Economic batch (5 rows) | PASS — 3 inserted (including `MISSING` value_text), 1 skipped, 1 rejected |
| Partial database failure | PASS — 1 retryable `DATABASE_ERROR`; next row inserted |
| Provider failure | PASS — retryable run-level `PROVIDER_ERROR`; writer calls 0 |
| Normalization failure | PASS — 1 non-retryable `NORMALIZATION_ERROR`; next row inserted |
| Validation failure | PASS — negative market price rejected before writer call |

## M1-F Regression

`src/lib/ingestion/qa/fixture-core-qa.ts` passed unchanged after the batch extension:

- market insert and correction;
- duplicate market natural key handling;
- economic immutable vintages;
- historical reconstruction cutoff behavior.

## DEV Database Integration and Cleanup

The designated DEV project was used only for an explicit transaction. The QA resolved the existing M1-E seed IDs, then asserted market batch insert/correction/identical duplicate behavior and economic vintage/duplicate/missing-marker behavior. Historical reconstruction at the cutoff returned vintage value `100`.

The transaction issued `ROLLBACK`. Post-cleanup counts:

| Table / seed scope | Count |
| --- | ---: |
| `market_prices` | 0 |
| `economic_observations` | 0 |
| `system_sources` | 2 |
| `assets` | 16 |
| `economic_series` | 11 |

## Findings and Deferred Work

No Core or schema defect was found. The existing RLS security gate remains deferred by M1 scope and must be addressed before any Data API/frontend exposure; this task did not alter RLS, policies, or grants.

```text
PENDING_EXTERNAL_KEYS
- ECOS_API_KEY
- FRED_API_KEY
- MARKET_DATA_API_KEY

PENDING_EXTERNAL_DECISIONS
- MARKET_DATA_PROVIDER
```
