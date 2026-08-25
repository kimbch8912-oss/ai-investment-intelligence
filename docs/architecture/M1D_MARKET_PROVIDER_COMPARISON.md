# M1-D Market Data Provider Comparison

## 1. Candidate Providers

Evaluation uses current official provider documentation, pricing, coverage, and terms only. No API key was created and no market data was downloaded.

| Provider | M1 role | Verdict |
| --- | --- | --- |
| Twelve Data | Broad global candidate | Shortlist; commercial plan and symbol search required before approval |
| KRX Data Marketplace | Official Korea-data candidate | Korea-only alternative; API/product licence must be confirmed |
| Alpha Vantage | Supplemental research candidate | Not selected: Korea coverage and plan suitability unverified |
| Massive (formerly Polygon) | US-only market-data candidate | Not selected: official documentation says stocks coverage is US-only |
| Yahoo Finance ecosystem | Convenience/reference only | Not selected: no approved official Yahoo Finance market-data API path established |
| Stooq | Reference/download source | Not selected: API/redistribution conditions not established for this use |
| Nasdaq Data Link | Dataset platform | Not selected: dataset-specific subscriptions do not minimize M1 provider complexity |

## 2. Coverage Matrix

| Provider | US indices / yields | FX | Gold / WTI | Bitcoin | Korea indices / stocks | M1 assessment |
| --- | --- | --- | --- | --- | --- |
| Twelve Data | Candidate; symbol-by-symbol verification pending | Yes, provider product category | Yes, provider product category | Yes, provider product category | KRX stock evidence exists for Samsung; remaining symbols pending | Closest single-provider candidate |
| KRX Data Marketplace | No | No | No | No | Official index and stock price categories available | Korea-only complement |
| Alpha Vantage | Partial candidate | Yes | Yes | Yes | Unverified | Insufficiently verified for M1 Korea scope |
| Massive | US only | Not M1-wide | Not M1-wide | Not M1-wide | No | Excluded |
| Nasdaq Data Link | Dataset-dependent | Dataset-dependent | Dataset-dependent | Dataset-dependent | Dataset-dependent | Not a minimal unified M1 solution |

## 3. License / Terms

- Twelve Data's Free/Basic plan is for internal non-display use and its terms prohibit commercial use of Free Tier data. External display or redistribution requires the applicable subscription/add-on or written agreement. Caching/storage limits must be checked in its documentation before implementation.
- KRX identifies a Data License and Data Products programme; its marketplace exposes Korea stock and index price categories, but programmatic access, storage, and redistribution must be licensed/confirmed separately.
- Massive currently states that its stock data coverage is US only.
- Yahoo reverse-engineered Finance endpoints and `yfinance` are not treated as an official market-data API for M1.
- Nasdaq Data Link terms are dataset/order-form specific and restrict redistribution unless expressly permitted.

## 4. Daily OHLCV and Historical Data

Twelve Data documents time-series API access from its Basic plan and advertises EOD global equities/ETFs and commodities on Grow; actual historical depth, adjustment policy, and per-symbol availability must be confirmed with the selected plan. KRX publishes stock and index price categories, but this review did not establish an approved ingestion API or licence. M1 therefore cannot yet promise daily OHLCV coverage for all 16 assets.

## 5. Rate Limit and Cost

| Provider | Current published M1-relevant limit/cost | Note |
| --- | --- | --- |
| Twelve Data Basic | Free; 8 API credits/minute, 800/day; 3 markets/global trial symbols | Not sufficient evidence for full M1 global/Korea universe |
| Twelve Data Grow | USD 79/month monthly (USD 66/month equivalent annual); 55 API credits/minute; 20+ markets; EOD global equities/ETFs and commodities | Personal/internal plan; commercial/external use requires terms review |
| Twelve Data business | Quote/plan dependent | Required path if product use exceeds individual/internal rights |
| KRX | Not established in this review | Confirm Data Product/Data License and API access with KRX |
| Alpha Vantage | Free standard limit documented as 25 requests/day; premium plans available | Too restrictive for safe M1 daily retries/backfill without a paid plan |

The M1 universe is only 16 assets, so Twelve Data Grow's published per-minute capacity is operationally sufficient if its coverage and rights are approved.

## 6. Identifier Strategy

`assets.id` remains the relationship key. Insert a `system_sources` row and `asset_identifiers` mappings only after a provider and plan are approved. Identifier mapping must come from the provider's official symbol-search/API result, storing `source_id`, `identifier_type = SYMBOL`, and exact `identifier_value`. Do not infer exchange suffixes or reuse canonical asset symbols as provider identifiers.

## 7. Risks

- Twelve Data's displayed product availability does not itself grant commercial redistribution rights.
- A paid individual plan may not meet a future public Dashboard's display/data licensing requirements.
- KRX website availability and official historical categories do not establish a public ingestion API or redistribution licence.
- Market indices, Treasury yields, and commodity references require symbol-level validation before any seed.

## 8. Recommendation and Alternative

**M1-I final verdict: `PROVIDER_BLOCKED`.**

M1-I official-document review confirms that Twelve Data individual plans are for personal/internal use and do not permit commercial third-party display or redistribution. Its business plans are the candidate path for external use, but non-US data requires additional approval and redistribution requires a separate agreement. No business plan, exchange/add-on approval, market API key, or official 16-asset symbol-search result has been supplied. The system's prospective public Dashboard/service direction therefore prevents approval of Twelve Data as a single provider at this time.

No alternate provider has an approved end-to-end licence, API, and 16-asset coverage verification. A dual-provider decision is likewise blocked pending KRX API/licensing confirmation plus an approved global provider.

Recommended decision path: evaluate Twelve Data Grow only for internal M1 development after confirming all 16 symbols through official search and confirming its permitted storage/display rights. If commercial or external display is intended, obtain Twelve Data business/redistribution terms before use.

Alternative: use KRX for Korea assets plus a separately licensed global provider. This is more authoritative for Korea but makes M1 dual-provider and requires KRX licence/API confirmation. Massive, Yahoo, Stooq, and Nasdaq Data Link are not recommended as the primary M1 solution.

## 9. Pending External Keys

```text
PENDING_EXTERNAL_KEYS
- ECOS_API_KEY
- FRED_API_KEY
- MARKET_DATA_API_KEY (only after provider/plan decision)
```

## Official References

- [Twelve Data pricing](https://twelvedata.com/pricing)
- [Twelve Data terms](https://twelvedata.com/terms)
- [Twelve Data Samsung Electronics market page](https://twelvedata.com/markets/150300/stock/krx/005930)
- [Massive international-data coverage](https://massive.com/knowledge-base/article/does-polygon-offer-international-data)
- [KRX Data Marketplace](https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd?locale=en)
- [Alpha Vantage pricing](https://www.alphavantage.co/premium/)
- [Nasdaq Data Link terms](https://data.nasdaq.com/terms)
- [Twelve Data commercial and personal usage](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage)
- [Twelve Data business pricing](https://twelvedata.com/pricing-business)
