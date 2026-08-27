# M6-A2 historical correction policy

Provider historical OHLCV may be revised after cold ingest. Cache round-trip QA therefore compares the immutable canonical cold-seed snapshot with a subsequent DB read. Provider re-calls validate availability and OHLCV validity only; strict equality across separate provider retrieval times is not required. A later stale refresh is the correction/update path.
