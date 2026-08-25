# Agent Architecture

## Status in M0

M0 defines the contracts and boundaries needed for future agent work. It implements no agents, orchestration, LLM calls, prompts, tools, or automated decisions.

## Planned Specialist Roles

The future architecture can include:

```text
macro_agent
global_market_agent
korea_market_agent
news_agent
fundamental_agent
research_agent
risk_agent
devil_agent
cio_agent
```

Specialists interpret a bounded evidence set. Risk review evaluates downside and uncertainty. The devil role challenges the prevailing interpretation. The CIO role synthesizes supported material; it may not make ungrounded new claims.

## Common Structured Output Contract

All agents return a structured output rather than unconstrained prose.

```json
{
  "agent": "",
  "analysis_date": "",
  "score": 0,
  "direction": "",
  "confidence": 0,
  "time_horizon": "",
  "summary": "",
  "positive_factors": [],
  "negative_factors": [],
  "risks": [],
  "evidence": [],
  "unknowns": []
}
```

The detailed schema, allowed value sets, validation rules, evidence reference shape, and versioning convention are deferred to the agent implementation milestone.

## Required Behavior

- `analysis_date` identifies the analysis basis date; future contracts distinguish `analysis_time`, `data_as_of_time`, `source_published_at`, and `retrieved_at` rather than treating them as one timestamp.
- `time_horizon` uses `SHORT`, `MEDIUM`, or `LONG`.
- `confidence` expresses support and uncertainty, not certainty of outcome.
- `evidence` links reasoning to supplied FACTs and CALCULATIONs.
- `unknowns` explicitly captures material gaps rather than silently filling them with inference.
- Narrative fields distinguish FACT, CALCULATION, INFERENCE, and OPINION where mixed information is presented.
- Agents do not perform returns, ratios, technical indicators, financial arithmetic, or statistics directly; those come from deterministic code or SQL.

## Scenario Synthesis

CIO-stage outputs must support Bull, Base, and Bear scenarios. Each scenario carries probability, trigger, supporting evidence, and risks. A scenario is conditional analysis, not a guaranteed price forecast.

## Auditability and Evaluation

Future `agent_runs` and `agent_outputs` domains should preserve the producing agent, run date, supplied evidence references, output contract/version, confidence, and unknowns. Prediction evaluation must be reproducible from data actually available at the recorded analysis time; it must not use subsequently published or revised information as if the agent had known it. This prevents look-ahead bias and enables later prediction-result comparison, agent performance assessment, and confidence calibration without rewriting historical judgment records.
