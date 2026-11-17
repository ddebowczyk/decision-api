# classifier.dev

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

classifier.dev is a classification service and orchestration layer, not evidence of an independently trained Jev replacement. Its docs explicitly identify Jev as a backend. The TypeSafe-compatible surface is `POST /v1/systemone` plus `GET /v1/models`; the official SDK can use base URL `https://classifier.dev` and a classifier.dev workspace key. For anonymous use, the SDK needs a nonempty placeholder such as `unused`. Do not send a real TypeSafe key to this service.

Its own REST endpoint, `POST /v1/classify`, adds up to 1,000 input texts, dimensions, multi-label mode, long-document workflows, URL scraping, and a smart tier that reviews uncertain answers with another model. It also offers MCP and CLI surfaces. These improve convenience and orchestration rather than establishing a superior underlying decision model.

Confidence and scores can be null, particularly after smart escalation. Multi-label scores are independent and have a different response shape from a single Choice distribution. Large-document handling screens chunks and selects evidence; the final judgment does not necessarily see every eligible chunk. URL extraction adds a separate fee and can remain billable when classification fails. Anonymous limits and funded workflows differ.

Assessment: useful for batching, agent access, and managed long-document processing. Preserve nulls, evidence-selection metadata, escalation provenance, and separate scrape/classification costs.

## Sources and local captures

- [Developer docs](https://classifier.dev/docs) · [local capture](../sources/classifier-dev/docs.md)
- [OpenAPI](https://classifier.dev/openapi.json) · [local capture](../sources/classifier-dev/openapi.json)
- [Pricing](https://classifier.dev/pricing) · [local capture](../sources/classifier-dev/pricing.md)
- [Agent index](https://classifier.dev/llms.txt) · [local capture](../sources/classifier-dev/llms.txt)
