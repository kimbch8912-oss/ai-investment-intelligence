# M2 Architecture Summary

| Layer | Responsibility | Output |
| --- | --- | --- |
| M2-A | Deterministic calculations | calculation results/snapshots |
| M2-B | Deterministic signal meaning | structured signals with evidence |
| M2-C | Independent domain scoring | 0–100 domain scores and coverage confidence |
| M2-D | Independent Market/Macro/Risk composites | composite snapshot and divergence |
| M2-E | Raw market-context classification | raw regime with adjustments |
| M2-F | Hysteresis and transitions | stable regime with transition evidence |

M3 agents consume the read-only M2 Snapshot: composites, risk context, raw/stable regime, domain scores, evidence, confidence, and as-of time. Agents must not recalculate M2 numbers or alter M2 results.
