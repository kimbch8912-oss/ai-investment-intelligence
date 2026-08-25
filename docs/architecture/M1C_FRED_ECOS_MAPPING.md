# M1-C FRED / ECOS Mapping

## Scope and Verification Rule

This mapping is for seed design only. No observations are collected and no seed is applied in this stage. FRED identifiers below were verified against the official FRED series pages and API documentation. ECOS codes remain `UNRESOLVED` unless their table and item code can be verified through the official ECOS metadata service; they are excluded from seed SQL.

Official references: [FRED series API](https://fred.stlouisfed.org/docs/api/fred/series.html), [FRED observations API](https://fred.stlouisfed.org/docs/api/fred/series_observations.html), and [FRED real-time periods](https://fred.stlouisfed.org/docs/api/fred/realtime_period.html). ECOS access is through the [Bank of Korea ECOS Open API](https://ecos.bok.or.kr/api/).

## FRED Recommended Mapping

| internal_name | display_name_ko | fred_series_id | Frequency / unit / SA | Recommended / alternative | Reason |
| --- | --- | --- | --- | --- | --- |
| us_federal_funds_rate | 미국 연방기금 유효금리 | `FEDFUNDS` | Monthly / Percent / NSA | Recommended; alternative `DFF` daily | M1 macro baseline uses the official monthly effective rate |
| us_treasury_2y_yield | 미국 국채 2년물 수익률 | `DGS2` | Daily / Percent / NSA | Recommended | Official constant-maturity 2-year yield |
| us_treasury_10y_yield | 미국 국채 10년물 수익률 | `DGS10` | Daily / Percent / NSA | Recommended | Official constant-maturity 10-year yield |
| us_2y10y_spread | 미국 10년-2년 금리차 | `T10Y2Y` | Daily / Percent / NSA | Recommended; alternative calculated `DGS10 - DGS2` | Official FRED spread avoids duplicate M1 calculation logic; calculation can be added in M2 |
| us_cpi_headline | 미국 소비자물가지수 | `CPIAUCSL` | Monthly / Index 1982-1984=100 / SA | Recommended; alternative `CPIAUCNS` NSA | Level index allows deterministic YoY/MoM calculation later |
| us_cpi_core | 미국 근원 소비자물가지수 | `CPILFESL` | Monthly / Index 1982-1984=100 / SA | Recommended; alternative `CUUR0000SA0L1E` NSA | Core level index supports deterministic changes later |
| us_pce_price_index | 미국 PCE 물가지수 | `PCEPI` | Monthly / Index 2017=100 / SA | Recommended; alternative PCE inflation transformation at ingestion | Store index level, not a precomputed AI-derived rate |
| us_unemployment_rate | 미국 실업률 | `UNRATE` | Monthly / Percent / SA | Recommended | Standard BLS unemployment rate series |
| us_nonfarm_payrolls | 미국 비농업고용 | `PAYEMS` | Monthly / Thousands of Persons / SA | Recommended | Total nonfarm employment level supports deterministic monthly change |
| us_nominal_gdp | 미국 명목 GDP | `GDP` | Quarterly / Billions of Dollars / SAAR | Recommended; alternative real GDP `GDPC1` | Requested GDP baseline; real-GDP selection is a future analytical choice |
| us_m2_money_stock | 미국 M2 | `M2SL` | Monthly / Billions of Dollars / SA | Recommended | M2 stock level for later deterministic growth calculations |

## FRED Unresolved Item

| internal_name | Requested concept | Status | Reason / next action |
| --- | --- | --- | --- |
| us_ism_manufacturing | ISM Manufacturing PMI | `UNRESOLVED` | Official FRED series search did not yield an accessible, current metadata page for the PMI itself; the historical candidate `NAPM` could not be opened as a current FRED series. No substitute series is acceptable. Do not seed until FRED/API metadata confirms title, source, release, availability, and license. |

### M1-I Gate Update

`FRED_API_KEY` is not present in the execution environment. The official FRED API requires a registered API key for all web-service requests, so the requested ISM Manufacturing PMI metadata cannot be authoritatively re-checked in this Gate. Status remains **UNRESOLVED**; no alternate manufacturing series was selected.

## FRED Vintage Mapping

FRED observations API supports `realtime_start`, `realtime_end`, and `vintage_dates`. For each downloaded observation, map the observation date to `observation_date`; map the specific FRED real-time/vintage date to `vintage_at`; retain FRED observation `realtime_start`/`realtime_end` and source release metadata in `metadata`; use the API retrieval instant for `retrieved_at`. When a provider publication timestamp is available, map it to `source_published_at`; do not invent one from the observation date.

The API key is required for FRED API calls. Proposed environment variable: `FRED_API_KEY`. No value is included here or in seed SQL.

## ECOS Mapping Status

| internal_name | display_name_ko | stat_code | item_code | Frequency / unit | Status | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| kr_base_rate | 한국은행 기준금리 | `722Y001` | `0101000` | Daily / annual % / no SA field | VERIFIED | Official item `한국은행 기준금리` |
| kr_cpi | 소비자물가지수 | `901Y009` | `0` | Monthly / 2020=100 / no SA field | VERIFIED | Official headline `총지수` Level; do not assume seasonal adjustment |
| kr_gdp | 실질 국내총생산 | `200Y108` | `10601` | Quarterly / KRW billions / seasonally adjusted | VERIFIED | Official table title states seasonal adjustment and real quarterly GDP expenditure |
| kr_usd_krw | 원/미국달러 환율 | `731Y001` | `0000001` | Daily / KRW / no SA | VERIFIED | Official `원/미국달러(매매기준율)`; reference rate, not an exchange closing trade |
| kr_m2 | 통화량 M2 | `161Y007` | `BBGS00` | Monthly / KRW billions / seasonally adjusted | VERIFIED | Official `M2(말잔, 계절조정계열)`; month-end, not average balance |
| kr_government_bond_yield | 국고채 금리 | `817Y002` | `010200000` (3Y), `010210000` (10Y) | Daily / annual % / no SA | VERIFIED | Official daily market-rate government-bond yield candidates |
| kr_unemployment_rate | 한국 실업률 | `902Y021` | `KOR` | Monthly / % / seasonally adjusted | VERIFIED | Official table `국제 주요국 실업률(계절변동조정)`, Korea item |

ECOS official `StatisticTableList`, `StatisticItemList`, and bounded `StatisticSearch` metadata/sample checks were performed after `ECOS_API_KEY` became available. No secret is recorded. The mapping above is verified, but the M1-I Gate still forbids seed or database changes; add reviewed series only in a later approved seed step.

### M1-I Gate Update

`ECOS_API_KEY` is available and all seven required items are **VERIFIED** through official ECOS metadata. They remain excluded from the seed pending a dedicated mapping/seed approval.
