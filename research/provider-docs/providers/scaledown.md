# ScaleDown / Classify-1

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

ScaleDown exposes its Jev-shaped Decisions API at `POST https://api.scaledown.xyz/v1/scaledown`. It accepts models `classify` and `classify-1` and named Noul, Choice, and Score questions. The docs explicitly call it a drop-in replacement, but also document important differences.

Only `state.text` and `state.document` are read from an object state. Arbitrary nested JSON fields are not equivalent to Jev's whole-state input. Documents use the non-standard `state.document` plus `document_mime_type` extension. Full classify-specific batching, image-direct input, and reasoning options use the separate `/classify` API.

Internally, each question becomes a separate classify call: Noul becomes binary labels, Choice becomes caller-defined labels, Score becomes ordered labels followed by an expected-value reduction. Calls run concurrently; usage sums their tokens. Sharing the state in one outer request does not imply single billing of that state.

OpenRouter lists `scaledown/classify-1` with a 1M context and text/image/file inputs. Those are router deployment claims and should not be assumed for every native request shape. In particular, the docs' comparison table includes dated statements about Jev's media capabilities.

Assessment: a close core payload adapter with material state-extraction and billing differences. Preserve arbitrary JSON by an explicit serialization policy, and verify document support per deployment.

## Sources and local captures

- [Overview and differences](https://docs.scaledown.ai/api-reference/decisions-overview.md) · [local capture](../sources/scaledown/docs/api-reference/decisions-overview.md)
- [HTTP reference](https://docs.scaledown.ai/api-reference/decisions.md) · [local capture](../sources/scaledown/docs/api-reference/decisions.md)
- [Router model](https://openrouter.ai/scaledown/classify-1) · [local capture](../sources/openrouter/scaledown--classify-1.md)
