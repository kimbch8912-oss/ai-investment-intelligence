# M5-P Korea Stock LIVE Foundation

## Provider and coverage

The DEV adapter uses Twelve Data for KRX symbol metadata and daily OHLCV. It is limited to 005930, 000660, 005380, 035420, and 035720 while provider coverage and presentation rights are evaluated.

## Symbol mapping

The resolver normalizes the provider ticker, KRX market, KR country, KRW currency, and Twelve Data identifier. Search accepts the ticker and the supported Korean or common English company names.

## License

`KOREA_MARKET_DATA_LICENSE = PENDING_EXTERNAL_LICENSE`.

No commercial or public-production activation is authorized. This adapter is DEV QA only until external licensing is confirmed.

## Known limitations

Fundamental, industry, Korea macro, and Korea market-context provider data are intentionally unavailable. The dashboard must show this as missing live data and never use fixture fallback.

## Production eligibility

Not eligible until the data-provider display and commercial license scope is explicitly approved.
