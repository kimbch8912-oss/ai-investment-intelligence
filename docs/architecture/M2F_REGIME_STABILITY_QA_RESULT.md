# M2-F Regime Stability / Hysteresis / Transition QA Result

## Verdict

**PASS**

## Rules

`m2f-v1` consumes only raw M2-E regime results and prior stable state. It does not recalculate scores, composites, or raw regimes. Deterioration requires 2 consecutive confirmations; recovery requires 3. Strong Bull entry requires 3, and Crisis exit requires 3 recovery confirmations. Normal confirmed changes move only one ordinal step.

Risk ≥90 with deterioration transitions immediately. Raw Crisis enters immediately when confidence meets the threshold. One UNKNOWN is tolerated; a second consecutive UNKNOWN transitions stable state to UNKNOWN. Each output records transition status, pending candidate/count, required count, and reason evidence.

## Fixture QA

| Scenario | Result |
| --- | --- |
| Boundary flapping | PASS — BULL/NEUTRAL alternation does not change stable BULL |
| Confirmed deterioration | PASS — two NEUTRAL raws transition BULL → NEUTRAL |
| Failed transition | PASS — candidate resets on return to BULL |
| Confirmed recovery | PASS — three NEUTRAL raws transition CAUTION → NEUTRAL |
| High risk emergency | PASS — Risk 92 transitions to CAUTION immediately |
| Crisis entry | PASS — raw CRISIS enters immediately |
| Crisis recovery | PASS — three BEAR raws leave CRISIS to BEAR |
| One-day UNKNOWN | PASS — stable BULL retained |
| Persistent UNKNOWN | PASS — second consecutive UNKNOWN yields stable UNKNOWN |
| Strong Bull entry | PASS — third raw STRONG_BULL transitions BULL → STRONG_BULL |
| Multi-step recovery | PASS — BEAR with repeated STRONG_BULL advances only to CAUTION |
| Extreme deterioration | PASS — STRONG_BULL → BEAR immediately at Risk 95, without auto-Crisis |

## Scope

| Check | Result |
| --- | --- |
| LLM / external provider calls / DB writes | 0 / 0 / 0 |
| Schema / RLS / seed changes | None |
| New dependencies | None |
| M2-A through M2-E regression | PASS |
| M1-F / M1-G regression | PASS |

No alerts, agent output, narrative, recommendation, action, portfolio logic, or regime persistence was added. Future persistence may store raw/stable regime, stable-since time, and transition reason, but no table was created.
