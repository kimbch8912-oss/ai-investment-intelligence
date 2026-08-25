# M5-D Industry / Business Cycle Context

M5-D accepts fixture/provider-normalized indicator states and their existing evidence. It does not connect a provider, calculate raw industry data, write a database, inspect competitor prose, or affect the independent stock technical/fundamental contexts.

Inputs are optional demand, supply, pricing, inventory, capacity/utilization, growth, and competitor deterministic states. Omission remains `UNKNOWN`. The engine maps them to the M5-A `IndustryContext` with direction, cycle, component states, availability-based confidence, input-only evidence, unknowns, `asOfTime`, and `m5d-v1` config version.

Direction uses ordered rules, not an average: contraction plus oversupply/excess inventory plus falling prices is strongly negative; slowdown/oversupply rules are negative; improving demand with falling prices is neutral because the conflict remains explicit; accelerating/improving demand, inventory draw and rising prices is positive, and only the tighter accelerating/tight-supply case is strongly positive. No direction is inferred with no core inputs.

Cycle is emitted only for sufficient matching evidence: improvement + inventory draw + rising prices is early recovery; accelerating demand + rising prices + tight capacity/supply is expansion; stable demand + rising prices + tight capacity is late cycle; weakening demand + inventory build is slowdown; contraction + falling prices + excess/oversupply is contraction; and bottoming requires an explicitly supplied prior contraction plus stable demand, improving inventory and non-falling prices. Otherwise cycle is `UNKNOWN`.

Confidence is populated-state coverage divided by the seven optional deterministic input domains; it is not an industry score. Evidence is a de-duplicated subset of input evidence and no FACT is created.
