# M3-D News Data Contract

Future pipeline: External source → raw news → normalization → deduplication/source classification → `NewsDocument` → `NewsEvent` → News Agent. This stage implements only the final fixture boundary.

`NewsDocument` contains source identity/tier, title, optional summary, published/retrieved timestamps, category, affected-asset scope, and explicit FACT records. Title is not evidence. `NewsEvent` selects one primary document plus related duplicates. Primary policy is deterministic: highest tier, earliest publication, then greatest fact coverage. Duplicate count does not increase importance.

Only title/summary/facts/metadata needed for interpretation are supplied; full articles, raw databases, and other Agent outputs are excluded. Affected assets and FACT IDs are immutable allow-lists for output validation.
