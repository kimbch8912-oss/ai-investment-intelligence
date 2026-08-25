# M5-P Market Data Provider Final Decision

> Decision date: 2026-08-25 (Asia/Seoul)  
> **Final decision: `PROVIDER_DECISION_BLOCKED`**

No provider is approved for implementation in this gate. The required market data exists technically, but the required rights for a user-facing commercial chart and persisted OHLCV data have not been contractually confirmed. A cheaper or technically working API plan is not a substitute for redistribution/display/storage rights.

## Recommended structure after the blocker is cleared

Use a two-provider boundary, rather than assume a universal feed:

1. **Global candidate: Twelve Data Business Venture (or written custom quote).** It has US equities, global EOD equities, FX, crypto, commodities and KRX/KOSDAQ exchange listings in its public coverage catalogue. It is the leading candidate for US/global chart data.
2. **Korea candidate: KRX-authorised data distributor / direct KRX commercial agreement.** KRX is the authoritative source and states that it sells real-time and historical market data. KIS Open API is useful for a private trading customer, but is not approved here as a public-data substitute: KIS says quotation API use requires confirming exchange information-use agreements, and its partner documentation limits quotation information to Korea Investment trading customers.

The KRX leg stays unresolved until a distributor/API, commercial display permission, storage duration, redistribution terms, adjustment policy, price, rate limits, and symbol-search contract are confirmed in writing. Twelve Data can be reconsidered as a single provider only if it supplies written confirmation that its business plan/add-on authorizes all requested Korean and global uses; public documentation alone does not establish that permission.

## Candidate comparison

| Candidate | Technical coverage | License conclusion | Gate result |
|---|---|---|---|
| Twelve Data | US stocks, FX, crypto, commodities and many global exchanges; Korea Exchange/KOSDAQ listed as EOD on Pro/Venture | Individual plans are internal/non-commercial. Business plans permit commercial display subject to exchange licensing; non-US price data needs additional approval and redistribution needs a separate agreement. | Not approved pending written Korea + storage/display terms. |
| KRX / authorised distributor | Authoritative Korean securities, KOSPI and KOSDAQ historical/real-time data | KRX sells market data, but no public self-service API/price/license that satisfies this use was verified. | Unresolved; procurement/legal path required. |
| Korea Investment Open API | Domestic daily item chart and domestic index daily-price endpoints; overseas daily-price endpoint exists | Exchange information-use agreement must be checked; partner terms permit quotation data only for Korea Investment trading customers. | Not appropriate as the public product feed without a separate approved arrangement. |
| Polygon | Strong US stocks historical aggregate/corporate-action API | Its market-data terms prohibit display/redistribution absent the appropriate licence. It does not solve Korean coverage. | Global alternative only; not a single-provider answer. |
| Alpha Vantage | Global alternative considered | Commercial use needs direct commercial arrangement; Korean completeness and rights for this scope not verified. | Not selected. |

## Required data and data path

The target adapter contract is daily `open`, `high`, `low`, `close`, `volume`, exchange-local timestamp, asset identifier and adjustment metadata. Once a provider is licensed, the intended architecture is:

`Provider OHLCV → existing market_prices → M5-B Technical Engine → UI candle chart`

This is viable technically. The UI must render the stored licensed OHLCV; it must not embed a third-party chart image/API as a workaround. Store raw/adjusted policy, provider timestamp, exchange timezone, source ID and retrieval time with each observation. The permitted retention/cache duration must be enforced from the final licence; Twelve Data terms expressly prohibit storage/caching beyond documented permissions.

## Feature and policy findings

| Requirement | Twelve Data finding | Korea candidate finding |
|---|---|---|
| Daily OHLCV / historical | `/time_series` supports daily series; documentation exposes OHLCV and historic range. | KIS documents domestic daily item chart and index series; depth/terms must be contracted. |
| Symbol search | `/symbol_search` is documented. | KIS offers market symbol information files; public product-search terms remain unverified. |
| Timezone | Daily data is returned in exchange-local time; exchange timezone is exposed in metadata. | Korea domestic market is KST; adapter must persist source timestamps, pending contract confirmation. |
| Split/dividend policy | `adjust=all|splits|dividends|none`, default `splits`; split/dividend endpoints exist. Persist chosen policy per row. | Adjustment policy not verified in public terms: **UNRESOLVED**. |
| Rate limit | Credit quota resets every minute. Pro example: 610 API credits/minute; endpoint credit weights apply. | KIS response limits vary by endpoint; public daily chart page states 100 records/call. Contract-wide rate limit is unresolved. |

## M1 seed asset coverage

Status is for documented, licensed daily OHLCV readiness—not merely whether a symbol may be found. `UNRESOLVED` means public official documentation did not prove the exact symbol/entitlement.

| M1 asset | Twelve Data candidate | Korea authorised feed candidate | Notes |
|---|---:|---:|---|
| SPX | UNRESOLVED | UNSUPPORTED | Exact index entitlement/symbol not verified. |
| IXIC | UNRESOLVED | UNSUPPORTED | Exact index entitlement/symbol not verified. |
| NDX | UNRESOLVED | UNSUPPORTED | Exact index entitlement/symbol not verified. |
| DJI | UNRESOLVED | UNSUPPORTED | Exact index entitlement/symbol not verified. |
| RUT | UNRESOLVED | UNSUPPORTED | Exact index entitlement/symbol not verified. |
| US2Y | UNRESOLVED | UNSUPPORTED | Twelve Pro lists fixed income, but exact yield series is unverified. |
| US10Y | UNRESOLVED | UNSUPPORTED | Same as US2Y. |
| DXY | UNRESOLVED | UNSUPPORTED | Exact dollar-index entitlement/symbol unverified. |
| XAUUSD | SUPPORTED | UNSUPPORTED | Twelve lists commodity data; exact entitlement still must be included in final order. |
| WTI | SUPPORTED | UNSUPPORTED | Twelve lists commodity data; exact entitlement still must be included in final order. |
| BTCUSD | SUPPORTED | UNSUPPORTED | Twelve lists crypto data. |
| KOSPI | UNRESOLVED | SUPPORTED | KRX is source; commercial API entitlement is still pending. |
| KOSDAQ | UNRESOLVED | SUPPORTED | KRX is source; commercial API entitlement is still pending. |
| USDKRW | SUPPORTED | UNRESOLVED | Twelve lists FX; KRX is not the authoritative FX feed. |
| 005930 | SUPPORTED | SUPPORTED | Twelve lists Korea Stock Exchange EOD at Pro/Venture; commercial approval remains pending. |
| 000660 | SUPPORTED | SUPPORTED | Same Korean listed-stock conclusion as 005930. |

The table does not establish commercial entitlement. In particular, Twelve’s Korea exchanges are listed at EOD with a minimum **Pro** individual plan / **Venture** business plan, but its commercial-use policy requires additional approval for non-US price data.

## Cost and API-key planning

| Stage | Candidate plan | Public list price | Interpretation |
|---|---|---:|---|
| Development, internal/non-commercial | Twelve Data Pro | $229/month ($191/month equivalent on annual billing) | Technically reaches Korea EOD; no external commercial display/redistribution right. |
| Production, external display | Twelve Data Business Venture | $499/month ($414/month equivalent on annual billing) | Starting point only; Korea approval, exchange fees/add-ons, retention and redistribution may raise cost. |
| Korean production data | KRX/distributor | UNRESOLVED | Quote and exchange agreement required. |

If the post-blocker decision selects Twelve Data, define only `TWELVE_DATA_API_KEY`. If the Korean vendor requires a separate credential, add its documented name only after contracting; do not predefine or store a speculative secret. No secret value is recorded in this document.

## Required unblock evidence

Before changing the decision to `SINGLE_PROVIDER_APPROVED` or `TWO_PROVIDER_APPROVED`, retain written provider/legal confirmation for all of the following:

1. Commercial, external chart display rights for Korea, US, index, FX, commodity and crypto data.
2. Rights to persist/cache OHLCV in `market_prices`, including exact retention duration and backup policy.
3. Whether any derived M5-B technical output can be shown externally and what attribution is mandatory.
4. Exact coverage and symbols for all 16 M1 seed assets, including US indices/yields/DXY and KOSPI/KOSDAQ.
5. Split/dividend adjustment semantics for every asset class.
6. Production rate limits, historical depth, SLA and incident/support path.
7. KRX/distributor commercial price and required exchange agreements.

## Official sources consulted

- [Twelve Data exchanges and plan minimums](https://twelvedata.com/exchanges)
- [Twelve Data API documentation](https://twelvedata.com/docs)
- [Twelve Data pricing for individual use](https://twelvedata.com/pricing)
- [Twelve Data business pricing](https://twelvedata.com/pricing-business)
- [Twelve Data commercial and personal usage policy](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage)
- [Twelve Data terms](https://twelvedata.com/terms)
- [KIS Open API provider/partnership guidance](https://apiportal.koreainvestment.com/provider)
- [KIS domestic/overseas quotation API catalogue](https://apiportal.koreainvestment.com/apiservice)
- [KRX market-data business description](https://global.krx.co.kr/contents/GLB/01/0103/0103020800/GLB0103020800.jsp)
- [Polygon market-data terms](https://polygon.io/terms/market_data_terms.pdf)
- [Polygon split adjustment documentation](https://polygon.io/docs/rest/stocks/corporate-actions/splits)
- [Alpha Vantage terms](https://www.alphavantage.co/terms_of_service/)
