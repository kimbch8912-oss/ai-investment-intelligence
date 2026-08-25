# M5-E Stock Fundamental Deterministic Context

M5-E consumes the M3-F `FundamentalSnapshot` for asset identity, `asOfTime`, quality and evidence, plus fixture/provider-normalized numeric metrics. It makes no provider call and does not reinterpret raw snapshot records, create peers, analyst estimates, guidance, historical facts, score, prediction or recommendation.

Growth requires at least two of revenue, operating-income, net-income and EPS growth. All at/above 15% is strong; all non-positive is weakening/weak; otherwise uniformly non-negative growth with one at/above 5% is improving. This prevents revenue alone from deciding growth.

Profitability requires operating margin and ROE. Strong is margin ≥20% and ROE ≥15%; healthy is ≥10% for each; weak is below 5% in either. Deteriorating requires two supplied prior comparisons to decline by more than 3 percentage points. Cash flow independently requires operating and free cash flow: any negative is negative, positive FCF with ≥10% FCF margin is strong, and positive FCF otherwise healthy.

Balance sheet requires debt/equity, net debt and cash. It is strong with debt/equity ≤0.30 and net cash, healthy up to 0.75, leveraged at debt/equity ≥1.5 or net debt above cash, and stressed at debt/equity ≥2.5. Valuation is `UNKNOWN` without a supplied benchmark. With one or more valid supplied comparable ratios, all ≥20% above benchmark is expensive, all ≥20% below is cheap, otherwise fair—no sector benchmark is invented.

Earnings quality can be low when positive profit-growth input conflicts with weak/negative cash flow; it can be high only with non-negative profit growth and strong cash flow. Confidence is the coverage of the six output domains, not a company score. Output evidence is copied only from M3-F snapshot evidence, and unknown inputs remain unknown.
