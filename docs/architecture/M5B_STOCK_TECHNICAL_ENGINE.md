# M5-B Stock Technical Engine

The engine accepts one asset, `1d` OHLCV observations, and an `asOfTime`. It copies and time-sorts the input, then discards observations after `asOfTime`; it makes no provider, database, LLM, UI, or score call.

Returns, SMA20/60/120, price-vs-SMA, realized volatility 20D, current drawdown, and max drawdown compose the existing M2 calculation helpers. Volatility is the M2 population standard deviation of the last 20 simple daily returns (not annualized). Drawdowns use the supplied history through `asOfTime`.

RSI uses Wilder RSI14: the first 14 close-to-close changes establish simple average gain/loss; every subsequent change uses `(priorAverage * 13 + currentGainOrLoss) / 14`. Zero average loss yields 100 and zero average gain yields 0.

Volume change is current versus prior session; volume MA20 is a simple average. Support/resistance uses only trailing-20-session local extrema (a high/low at least as extreme as immediate neighbours), filters them to the applicable side of current close, deduplicates, and returns the nearest three. No pattern recognition is included.

Every metric is `{ value, status, asOfTime, evidence }`. Missing required samples are `INSUFFICIENT_DATA`; unavailable longer MA60/120 values are exposed as `UNKNOWN` without blocking shorter metrics. No missing value is converted to zero. The output contains no technical direction or investment interpretation.
