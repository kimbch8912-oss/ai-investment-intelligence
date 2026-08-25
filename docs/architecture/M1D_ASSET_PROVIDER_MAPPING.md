# M1-D Asset Provider Mapping

## Status

Final provider decision is pending. The table records only identifiers verified on official provider pages; it does not authorize any seed or `asset_identifiers` insert. All unresolved rows must be confirmed through the selected provider's official symbol search/API after plan approval.

## Recommended Candidate: Twelve Data

| canonical symbol | asset | provider | identifier_type | identifier_value | verified | notes |
| --- | --- | --- | --- | --- | --- |
| SPX | S&P 500 | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm exact index symbol through official symbol search |
| IXIC | NASDAQ Composite | Twelve Data | SYMBOL | UNRESOLVED | No | Same |
| NDX | NASDAQ 100 | Twelve Data | SYMBOL | UNRESOLVED | No | Same |
| DJI | Dow Jones Industrial Average | Twelve Data | SYMBOL | UNRESOLVED | No | Same |
| RUT | Russell 2000 | Twelve Data | SYMBOL | UNRESOLVED | No | Same |
| US2Y | US 2-Year Treasury Yield | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm available instrument and daily OHLC semantics |
| US10Y | US 10-Year Treasury Yield | Twelve Data | SYMBOL | UNRESOLVED | No | Same |
| DXY | US Dollar Index | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm index symbol |
| XAUUSD | Gold Spot | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm exact spot/contract symbol and source |
| WTI | WTI Crude Oil | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm exact spot/contract symbol and source |
| BTCUSD | Bitcoin / US Dollar | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm venue/pair identifier |
| KOSPI | KOSPI | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm index symbol |
| KOSDAQ | KOSDAQ | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm index symbol |
| USDKRW | US Dollar / Korean Won | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm provider FX pair format |
| 005930 | Samsung Electronics | Twelve Data | SYMBOL | `005930` | Yes | Official page identifies KRX / MIC `XKRX`; use only after plan approval |
| 000660 | SK hynix | Twelve Data | SYMBOL | UNRESOLVED | No | Confirm through official symbol search |

## Mapping Decision Rules

1. Do not seed unresolved identifiers.
2. Retain canonical asset symbols in `assets`; store provider symbols only in `asset_identifiers`.
3. If a provider offers multiple venues or instruments for a concept, select the one whose daily OHLCV, currency, and market timezone match the documented M1 asset definition.
4. Treat US Treasury yields and USD/KRW market identifiers independently from their FRED/ECOS economic-series mappings.

## Coverage Outcome

M1-I final provider status is `PROVIDER_BLOCKED`. Verified mapping count remains **1 / 16**. The unresolved status is intentional: no approved provider plan, market API key, or official symbol-search result was used to infer the remaining 15 identifiers. The one documented Twelve Data Samsung mapping is not approved for seed or DB insertion until provider licensing and plan approval are complete.
