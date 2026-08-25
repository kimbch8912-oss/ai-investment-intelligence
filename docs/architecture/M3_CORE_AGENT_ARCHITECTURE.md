# M3 Core Agent Architecture

```
M2AnalysisSnapshot ──> Macro Agent ──> independent result
M2AnalysisSnapshot ──> Global Market Agent ──> independent result
M2AnalysisSnapshot + KoreaMarketContext ──> Korea Market Agent ──> independent result
```

All outputs use the shared run envelope, direction enum, evidence types, recommendation guard, and `StructuredLlmClient` adapter. No Agent consumes another Agent's output. The optional Korea context is fixture-only until `FUTURE_KOREA_DETERMINISTIC_INPUT` is completed. A QA-only result bundle is a read-only container; it performs no voting, weighting, agreement score, or overall investment conclusion.
