# M1-I External Integration Gate

## Verdict

**PROVIDER_BLOCKED**

## External Key Status

| Environment variable | Status | Gate consequence |
| --- | --- | --- |
| `FRED_API_KEY` | MISSING | Official API metadata re-check and Live QA blocked |
| `ECOS_API_KEY` | AVAILABLE | Metadata verification complete; bounded Live QA remains separate |
| `MARKET_DATA_API_KEY` | MISSING | Provider symbol search and market Live QA blocked |

Only variable presence was checked. No key value, authorization header, service-role key, database password, or connection value was read or recorded.

## FRED Status

The existing 11 FRED seed mappings remain unchanged. FRED requires an API key for web-service requests. ISM Manufacturing PMI remains **UNRESOLVED**: without a key, the official series metadata, availability, and rights cannot be re-verified; no substitute series is permitted. FRED data owners may impose third-party copyright restrictions, so later public-service use must retain source-level rights review.

## ECOS Status

All seven requested concepts are **VERIFIED** through official ECOS `StatisticTableList`, `StatisticItemList`, and bounded `StatisticSearch` checks. No ECOS series is added to the seed or database in this Gate.

| Concept | stat_code | item_code | Frequency / unit / adjustment | Official selection |
| --- | --- | --- | --- | --- |
| 한국은행 기준금리 | `722Y001` | `0101000` | Daily / annual % / no SA field | `한국은행 기준금리` |
| CPI | `901Y009` | `0` | Monthly / 2020=100 / no SA field | `총지수` Level |
| Real GDP | `200Y108` | `10601` | Quarterly / KRW billions / seasonally adjusted | `국내총생산에 대한 지출` |
| USD/KRW | `731Y001` | `0000001` | Daily / KRW / no SA | `원/미국달러(매매기준율)` |
| M2 | `161Y007` | `BBGS00` | Monthly / KRW billions / seasonally adjusted | `M2(말잔, 계절조정계열)` |
| Government bond yield | `817Y002` | `010200000` / `010210000` | Daily / annual % / no SA | 국고채 3년 / 10년 |
| Unemployment | `902Y021` | `KOR` | Monthly / % / seasonally adjusted | Korea item |

The USD/KRW selection is a published base exchange rate rather than a trading close; M2 is month-end rather than average balance. CPI's ECOS metadata does not state a seasonal adjustment, so no adjustment is inferred.

## Market Provider and Licence Decision

**Decision: `PROVIDER_BLOCKED`; no single or dual provider is approved.**

Twelve Data is a technical candidate, but its current individual plans are personal/internal only and prohibit commercial third-party display and redistribution. Its business plans are the potential commercial path, while non-US data requires further approval and redistribution needs a separate agreement. This does not yet establish rights for Korea data, storage, display, or the full 16-asset scope. KRX plus a global provider remains an alternative only after KRX data-product/API/redistribution rights and the global provider's terms are confirmed.

## 16 Asset Coverage

| Status | Count |
| --- | ---: |
| Verified but not approved for seed | 1 (`005930`, Twelve Data official market page) |
| Unsupported | 0 confirmed |
| Unresolved | 15 |

All 16 remain unavailable for production mapping because the candidate provider is not approved. Treasury yields must remain actual yield series, Gold must be spot, WTI instrument semantics must be explicit, Bitcoin venue/aggregation must be recorded, and Korea indices must be indices rather than ETF substitutes.

## Adapter Plan After Approval

Keep the M1-F/G Core unchanged. Implement only approved provider-specific adapters:

1. `fred-provider.ts`: official FRED series metadata and bounded observations; retain real-time/vintage provenance.
2. `ecos-provider.ts`: official ECOS metadata and observations after the seven codes are verified.
3. `market-provider.ts`, or `global-market-provider.ts` plus `korea-market-provider.ts` only if the approved licence requires a dual provider.

Each adapter must return raw data only and flow through the existing normalizer, validator, internal-ID resolver, repository, and batch summary. No identifier is seeded until a reviewed mapping is approved.

## Small Live QA Plan

After all required keys and provider approval:

1. FRED: `DGS10`, latest 5–10 observations; check metadata, vintage fields, decimal strings, write/idempotency, and provenance.
2. ECOS: Korean base rate, recent small sample; check official table/item code, unit, frequency, timestamps, and immutable vintage behavior.
3. Market: `005930`, latest 5–10 daily bars only; first verify the official identifier, exchange, currency, timezone, and licence scope, then check OHLCV, timestamps, upsert correction, and provenance.

Run each in DEV with server-only credentials and QA fixtures/data labels. Review before any historical backfill. Do not choose a history length until series-specific analysis requirements are approved.

## Backfill Gate

Historical backfill remains blocked until all of the following are complete: required key availability, Provider/rights approval, official metadata verification, reviewed asset mapping, implemented adapter, and small Live QA PASS.

## Scope Confirmation

Official ECOS metadata/sample requests only were made after Key availability. No FRED or Market Provider request, seed change, database write, identifier insert, economic-series addition, observation/price insertion, RLS change, or schema change occurred in M1-I.

## Official References

- [FRED API key requirements](https://fred.stlouisfed.org/docs/api/api_key.html)
- [FRED API terms of use](https://fred.stlouisfed.org/docs/api/terms_of_use.html)
- [Twelve Data commercial and personal usage](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage)
- [Twelve Data business pricing](https://twelvedata.com/pricing-business)
