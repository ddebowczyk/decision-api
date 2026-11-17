# Levanto Sage sources

Captured 2026-11-03 from official documentation. The full-scope follow-up captures
all 18 pages in [llms.txt](llms.txt), plus the live service's OpenAPI document.
[manifest.json](manifest.json) records each URL, retrieval time, size and SHA-256.
The table below lists the original four integration sources; the manifest lists
the complete follow-up capture.

| Local file | Original source |
| --- | --- |
| [systemone.md](systemone.md) | <https://docs.levanto.ai/systemone.md> |
| [decision-model-batch.md](decision-model-batch.md) | <https://docs.levanto.ai/decision-model/batch.md> |
| [decision-model-limits.md](decision-model-limits.md) | <https://docs.levanto.ai/decision-model/limits.md> |
| [openapi-schema.md](openapi-schema.md) (JSON) | <https://docs.levanto.ai/openapi-schema.md> |

The API preset uses SystemOne, which covers the library's boolean, choice and
score primitives. The OpenAPI says each SystemOne question becomes a batch
question on the state; the batch guide says each question reads its content.
This supports the independent grouping snapshot. Structured descriptions are
conservatively disabled: native question descriptions are text. State objects
and arrays and boolean criteria are explicitly documented by SystemOne.

Choice has 2–256 options; score has 2–26 levels. Context limits are approximate
and plan-dependent, so the snapshot leaves request bounds unknown. Only 503 is
documented as transient for decisions (429 is documented for extraction).
Probability rounding tolerance remains assumed.

`test/fixtures/wire/levanto-doc-200.json` reproduces the documentation's response,
not a live capture. Its score is 1.62 while its probabilities imply 1.61; the
existing validator recomputes the score and records the correction.

Validation: offline planning, bounds, explicit description lowering, credential
configuration, HTTP replay and answer validation. Authenticated live triage and
bad-key tests both passed via `just live test/live/levanto.test.ts`.
Extraction, streaming, native abstentions, reasoning, images, grounding, Sort and
Tags are outside this preset's scope.

## Full capability audit

The integration is **partial Levanto support through SystemOne**, not full Sage
support. The original implementation chose the library's existing three
primitives; that choice does not establish coverage of the supplied provider URL.
No additional inference was run during this documentation audit. The previous
two live tests establish only basic SystemOne triage and invalid-key handling.

| Capability | Current implementation | Missing behavior / contract |
| --- | --- | --- |
| SystemOne boolean, choice, score | Supported | Text/object/array state, boolean criteria, probability distributions, ordered criteria, model and token usage |
| Native Yes/No and Choice | Partial through SystemOne | `/decide` nullable decisions; SystemOne deliberately always answers |
| Native Scale | Partial through SystemOne | Arbitrary distinct integer level values; `Q.score` uses zero-based positions |
| Sort | Missing | Rank 2–120 item ids with confidence for the whole order |
| Tags | Missing | 1–120 tags, judged together; each has probability and true/false/null verdict |
| Reasoning | Missing even for SystemOne | `off`/`auto`/`on`, accounting and cutoff metadata |
| Choice accuracy/latency | Missing | Native `latency_mode: fast/quality`, escalation and compute-path metadata |
| Grounding | Missing | Trigger policy, confidence floor, search bounds, sources and timing |
| Images (beta) | Missing | PNG/JPEG/WebP data URI, optional context, image usage and modality limits |
| Native decision batches | Missing | Multiple content groups, per-question success/error, per-question grounding |
| Extraction and extraction batches | Missing | Typed fields, every mention, candidate probabilities, absence/ambiguity, spans, per-document errors |
| WebSocket streaming | Missing | Growing text, answer changes, question replacement, sequence ids, backpressure/coalescing, reconnect and per-update usage |
| Usage estimate | Missing | Preflight token ranges without inference, reasoning/search bounds, approximate Sort estimates |
| Model catalog and readiness | Missing | `/v1/models`, `/models`, `/ready` helpers |
| Stream signatures / attestation | Missing; source discrepancy | Stream guide describes chained P-256 signatures and `/v1/attestation/report`; captured live OpenAPI does not expose the report route or signature scheme |
| Agent skill | Documentation only | Installation is not required for API capability support; no external skill was installed |

### Endpoint inventory

The live OpenAPI exposes ten paths. Only one is called by this integration:

| Method | Path | Exposed by this library |
| --- | --- | --- |
| GET | `/ready` | No |
| GET | `/models` | No |
| GET | `/v1/models` | No |
| POST | `/v1/systemone` | Yes, without reasoning configuration |
| POST | `/decide` | No |
| POST | `/decide/batch` | No |
| POST | `/v1/extract` | No |
| POST | `/v1/extract/batch` | No |
| POST | `/usage/estimate` | No |
| GET (WebSocket upgrade) | `/v1/stream` | No |

### Semantics that a complete integration must preserve

- Native abstention is a successful uncertain answer, not refusal, invalid output
  or a retryable failure. Our current `Answer` statuses are answered/refused/error;
  adding native abstention needs an explicit contract preserving probabilities.
- Tags are jointly judged. Replacing Tags with independent boolean questions
  changes semantics. Sort needs ranking evidence rather than a choice distribution.
- Scale levels may be nonzero or nonconsecutive integers. The current zero-based
  score value cannot represent those units without a new contract or explicit mapping.
- Extraction has eight types in OpenAPI: text, integer, decimal, money, date,
  time, datetime and duration. Offsets are Unicode code points, not JavaScript
  UTF-16 indices. Absent and undecided both have null values but different
  probability semantics. Preserve parse errors and every-mention result order.
- Native batch failures are per question/document. Preserve successes; do not
  retry an entire partially successful batch indiscriminately.
- Streaming is a WebSocket session, not token SSE. Handle all documented frames,
  full answer state plus changed ids, nonfatal rejected updates, idle heartbeat,
  draining close 1012 and reconnect using the full document. Do not claim exactly
  once delivery or uninterrupted session continuity from the reconnect recipe.
- Enforce operation-specific limits: extraction 64 fields/documents and 16,384
  prompt tokens; streaming 32 questions, 600,000 characters and 16,384 prompt
  tokens; images 4 MiB decoded, dimension/pixel limits and 20 choice options.
  Images cannot combine with grounding or Sort. Text decisions have different,
  plan-dependent context limits.
- Reasoning and grounding affect usage and latency. Preserve reasoning cutoff,
  forced-answer, search-source, image-token and compute-path metadata. Token
  estimates do not include image tokens and may be ranges.

### Documentation discrepancies and verification limits

- [Live OpenAPI](https://sage.levanto.ai/openapi.json) and
  [documentation OpenAPI](https://docs.levanto.ai/openapi-schema.md) differ.
  The live schema adds `meta.compute_mode`, richer reasoning metadata (`fired`,
  `margin`), and omits the documentation schema's `grounding.provider` option.
  Both expose `latency_mode`, which the short feature pages do not describe.
  Avoid implementing obsolete schema fields without a probe.
- Live `compute_mode` describes fast-mode questions sharing a packed call.
  The existing independent grouping snapshot was inferred from per-question
  content accounting and the batch mapping. Those statements do not by
  themselves prove strict isolation between questions. Treat isolation as a
  verification gap before advertising a guarantee; a single live triage test
  cannot establish it.
- The stream guide points to an attestation/signature specification absent
  from the captured live schema. Signature verification needs a confirmed
  canonicalization/chaining protocol, not an invented implementation.
- Boundary tests validate our declared snapshot limits; they do not establish
  the service accepts the maximum sizes. JSON array state, model alias routing,
  transient errors and quota behavior were not separately live-tested by the
  previous two-case suite.

### Implementation direction

Retain the portable SystemOne preset, then add a typed native Levanto service for
decide/batch, extract/batch, estimates/catalog/readiness and WebSocket sessions.
Expose reasoning and latency controls as explicit request options included in
execution identity; keep credentials redacted. Introduce portable question/result
contracts only where their semantics can be retained: abstention, ranking, Tags,
numeric scale units and extraction evidence need more than another snapshot.
Add offline protocol fixtures and targeted live checks for each new operation.
This is a proposed completion path, not implemented functionality.
