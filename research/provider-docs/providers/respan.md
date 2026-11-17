# Respan / Span-01 and Lite

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Span-01 is a behavior classifier for agent traces, not the same native interface as Jev's three primitives. Call `POST https://api.respan.ai/api/v1/scores` with `span` and natural-language `behaviors`. For each behavior it returns `p_present`, `p_absent`, and `p_not_observable`, which sum approximately to one. The last value means insufficient evidence and must not be silently converted into false.

Native model IDs are `span-01-pro` ($0.02/M input, free output) and `span-01-free` (Lite, daily capped). Router IDs and display names differ. The concept page says all behavior branches are scored over shared trace context, with no separate behavior-count limit; input/body and service capacity limits still apply.

Respan reports behavior-detection gains over Jev and other models, but its own production-domain table also shows a stronger frontier-model ceiling. Those task-specific results do not establish a general Choice/Score replacement.

Additional discovery: current router pages point to Span-02 as the successor. Its concept and quickstart are captured separately for follow-up; do not reinterpret the supplied Span-01 rows as Span-02 results.

Assessment: especially useful for an explicit unknown/evidence-availability outcome and agent monitoring. A portable schema should preserve the ternary distribution and model provenance, and expose this as a separate capability.

## Sources and local captures

- [Concept and pricing](https://www.respan.ai/docs/documentation/span-01/concept) · [local capture](../sources/respan/concept.md)
- [Quickstart](https://www.respan.ai/docs/documentation/span-01/quickstart) · [local capture](../sources/respan/quickstart.md)
- [HTTP reference](https://www.respan.ai/docs/apis/gateway/run-span-01.md) · [local capture](../sources/respan/api-reference.md)
- [Span-02 follow-up](https://www.respan.ai/docs/documentation/span-02/concept.md) · [local capture](../sources/respan/span-02-concept.md)
