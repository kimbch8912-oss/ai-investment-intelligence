# M5-F Stock Analysis Agent

M5-F is a structured, deterministic context reader. It takes the M5 request/asset, technical signal, fundamental context, industry context, existing macro and market outputs, optional news/research context, and risk output. It calculates no indicator or score and makes no investment view.

The M5-A market route is applied: KRX/KR uses Korea market only; other assets use Global market only. The fixture client implements the existing `StructuredLlmClient` shape but performs no LLM call. The validator rejects mismatched request/output assets, evidence IDs outside the combined input allow-list, and BUY/SELL-style recommendation language.

Each domain retains its own state in a view. Factors are deterministic labels of positive/negative source states; explicit technical/industry and fundamental/technical disagreements become conflicts. Confidence is the mean of supplied core context confidences, not a score. Missing news/research adds unknowns and cannot create facts.
