# M5-C Stock Technical Signal Layer

M5-C reads an existing M5-B `TechnicalContext` and maps already-calculated metrics to deterministic categorical signals. It does not accept a price series, retrieve data, calculate indicators, create price levels, score, predict, or recommend.

All thresholds are centralized in `technical-signals/config.ts` (`m5c-v1`). Trend requires valid price/MA20/MA60/MA120: full ordered MA stacks are strong trends, a price/MA20/MA60 ordered partial stack is an uptrend/downtrend, and other complete combinations are neutral. Momentum requires Return5D and Return20D to both clear ±1%. RSI is overbought at 70+, strong at 60–<70, neutral >40–<60, weak >30–≤40, and oversold at ≤30.

Daily realized volatility uses low ≤1%, normal ≤2%, elevated ≤3%, otherwise high. Current drawdown uses low ≥−5%, normal ≥−10%, elevated ≥−20%, otherwise high. Volume confirmation uses the existing Return1D for price direction, current volume, volume change, and VolumeMA20 only. A positive volume change with volume at/above its MA20 confirms the applicable up/down move; insufficient input stays unknown.

Support/resistance consumes only M5-B levels. With levels on both sides, a price within 2% of the closer nearest level is near support/resistance; otherwise it is between levels. No resistance level is `BREAKOUT`; no support level is `BREAKDOWN`. No new level is generated.

`confidence` is input-metric availability coverage, not a technical score or directional aggregation. Signal evidence is deduplicated evidence already attached to M5-B metrics; no FACT is created. Missing fields preserve `UNKNOWN` and list the unmet input in `unknowns`. `asOfTime` is copied from M5-B, preventing this layer from observing future prices.
