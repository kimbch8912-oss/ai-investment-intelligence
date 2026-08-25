# M1-C Asset / Source Seed Design

## Scope

This design seeds only `system_sources`, `assets`, and verified `economic_series`. It does not seed provider-specific `asset_identifiers`, market prices, economic observations, FRED/ECOS observations, API keys, or any schema change.

## Initial Sources

| code | name | source_type | category | country | tier | credential reference |
| --- | --- | --- | --- | --- | --- | --- |
| `FRED` | Federal Reserve Economic Data | `CENTRAL_BANK_DATA` | `MACRO` | `US` | `S` | `FRED_API_KEY` |
| `ECOS` | Bank of Korea Economic Statistics System | `CENTRAL_BANK_DATA` | `MACRO` | `KR` | `S` | `ECOS_API_KEY` |

`source_type` and `category` are plain text in the approved schema, so these values do not conflict with a database CHECK constraint. Secret values are never stored; `credential_env_key` is a non-secret reference.

## Initial Asset Universe

No market-data provider is selected. The following are canonical asset-master values only; they are not provider identifiers and no `asset_identifiers` rows are seeded.

| symbol | name | asset_type | exchange | country | currency | timezone |
| --- | --- | --- | --- | --- | --- | --- |
| `SPX` | S&P 500 | INDEX | S&P DJI | US | USD | America/New_York |
| `IXIC` | NASDAQ Composite | INDEX | NASDAQ | US | USD | America/New_York |
| `NDX` | NASDAQ 100 | INDEX | NASDAQ | US | USD | America/New_York |
| `DJI` | Dow Jones Industrial Average | INDEX | S&P DJI | US | USD | America/New_York |
| `RUT` | Russell 2000 | INDEX | FTSE Russell | US | USD | America/New_York |
| `US2Y` | US 2-Year Treasury Yield | BOND | US Treasury | US | USD | America/New_York |
| `US10Y` | US 10-Year Treasury Yield | BOND | US Treasury | US | USD | America/New_York |
| `DXY` | US Dollar Index | INDEX | ICE | US | USD | America/New_York |
| `XAUUSD` | Gold Spot | COMMODITY | GLOBAL | US | USD | America/New_York |
| `WTI` | WTI Crude Oil | COMMODITY | NYMEX | US | USD | America/New_York |
| `BTCUSD` | Bitcoin / US Dollar | CRYPTO | CRYPTO | US | USD | UTC |
| `KOSPI` | KOSPI | INDEX | KRX | KR | KRW | Asia/Seoul |
| `KOSDAQ` | KOSDAQ | INDEX | KRX | KR | KRW | Asia/Seoul |
| `USDKRW` | US Dollar / Korean Won | FX | FX | KR | KRW | Asia/Seoul |
| `005930` | Samsung Electronics | STOCK | KRX | KR | KRW | Asia/Seoul |
| `000660` | SK hynix | STOCK | KRX | KR | KRW | Asia/Seoul |

US Treasury yields and USD/KRW may also appear as economic series. This is intentional: `assets`/`market_prices` model market series, while `economic_series`/`economic_observations` model provider-released macro series.

## Seed Re-execution Strategy

`system_sources` uses `ON CONFLICT (code) DO NOTHING`. `economic_series` resolves `source_id` by source `code` and uses `ON CONFLICT (source_id, source_series_id) DO NOTHING`. The schema does not give assets a canonical unique key because symbols cannot be global relationship keys; therefore assets use a complete canonical-attribute `NOT EXISTS` guard. This is repeat-safe for the controlled single-writer seed workflow, but is not a concurrency guarantee.

Do not hardcode UUIDs. Source and series relations are resolved by stable source code; assets have no seeded dependent rows at this stage, so generated UUIDs are sufficient.

## Seed Counts

| Domain | Count |
| --- | --- |
| system_sources | 2 |
| assets | 16 |
| economic_series | 11 (FRED only) |
| asset_identifiers | 0 |

All seven ECOS targets and the FRED ISM Manufacturing item are `UNRESOLVED` and excluded from SQL.

## Application Gate

The seed SQL is design-only in M1-C and must not be applied to the DEV database until reviewed. It uses no API secret, actual FRED/ECOS observation, market data, or provider-specific identifier.
