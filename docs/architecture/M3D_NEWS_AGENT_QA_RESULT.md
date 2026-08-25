# M3-D News Agent QA Result

`PASS` — Fixture-only News Document → News Agent contract verified.

- Agent/version: `news` / `m3d-v1`; prompt: `news-agent-v1`; common envelope and LLM adapter reused.
- Source quality and importance are separate. Tier S policy/economic items classify HIGH; direct/macro asset coverage can classify MEDIUM. Confidence is deterministic tier confidence × fact availability.
- FACT scope, affected-asset scope, evidence IDs, recommendation guard, source tier, duplicate primary selection, and no-fact input guard are validated.
- QA PASS: official source, economic data, corporate, regulation, rumor, conflicting reports, duplicate primary selection, sensational headline, no-fact, fabricated fact, fabricated asset, and recommendation guard.
- Actual LLM/news API/FRED/ECOS/market provider calls, DB writes, schema/RLS/seed changes, and dependencies: 0.
- Pending: `NEWS_DATA_PROVIDER`; M3 Core and prior M2/M1 layers remain unchanged.
