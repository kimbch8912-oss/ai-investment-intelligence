# M1-H Security / Access Model

## Current Risk

The Supabase security advisor reports `rls_disabled_in_public` for all six Foundation tables: `system_sources`, `assets`, `asset_identifiers`, `market_prices`, `economic_series`, and `economic_observations`. They are in the exposed `public` schema, so this must be remediated before allowing browser Data API access.

This document is the M1-H design gate only. It intentionally contains no RLS SQL, policy, grant, migration, function, or schema change.

## Frontend Access Model

```text
Browser -> Dashboard server route -> Supabase Data API
```

- The browser does not receive a Supabase secret, service-role key, database URL, or direct writer capability.
- Dashboard reads are server-side only. The implementation reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in `src/dashboard/data.ts`.
- The current Dashboard is Foundation-status read-only. It has no browser-originated database write path.
- Until M1-H2 is complete, no `anon` or `authenticated` direct table access should be added for these tables.

## Server Writer Model

```text
Ingestion server process -> privileged server-only database writer -> public tables
```

- Ingestion is the only intended writer for market prices and economic observations.
- Server-only privileged credentials are supplied through secret management, never `NEXT_PUBLIC_*`, browser code, source, documents, or error contexts.
- Repository validation, idempotency, and immutable vintage rules remain application safeguards; they are not a substitute for RLS.

## Table-by-Table Access Matrix

| Table | Frontend direct read | Frontend direct write | Dashboard server read | Ingestion server write | anon/authenticated access now |
| --- | --- | --- | --- | --- | --- |
| `system_sources` | No | No | Yes | Yes | No |
| `assets` | No | No | Yes | Yes | No |
| `asset_identifiers` | No | No | No | Yes | No |
| `market_prices` | No | No | Future server-read only | Yes | No |
| `economic_series` | No | No | Yes | Yes | No |
| `economic_observations` | No | No | Future server-read only | Yes | No |

## RLS Recommendation (M1-H2 Gate)

1. Confirm the intended authenticated user and ownership model before writing policies; a bare `TO authenticated` policy is not sufficient authorization.
2. Enable RLS for all six exposed tables in one reviewed migration.
3. Keep direct `anon` access disabled. Do not grant browser writes.
4. Use server-side reads/writes while the system remains single-user. If direct client reads are later needed, add only explicit read policies after the user model is designed.
5. Verify Data API exposure, role grants, RLS policies, and Dashboard/ingestion behavior in DEV before any production use.

## Data API Recommendation

The Data API should be considered a server-internal dependency for M1-H. Exposed-schema configuration does not replace RLS. The Dashboard route uses the server secret and returns only the selected display fields; it never proxies arbitrary table requests or SQL.

## Secret Management

- Required server-only names: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Keep values in the existing local/host secret manager; do not commit them.
- Do not use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, and do not render any key or connection detail to HTML.
- API keys for FRED, ECOS, and Market Data remain pending and are not read by the Dashboard.

## Future Multi-user Consideration

No users, profiles, tenants, ownership fields, or subscription schema is introduced in M1. Before adding multi-user access, define tenancy/ownership and revise the table matrix and RLS policies rather than reusing a blanket authenticated policy.

## Status

```text
PENDING_SECURITY
- RLS_POLICY_IMPLEMENTATION
```
