# Unified decision API: design cheatsheet

**Purpose:** design one API over the researched providers. **Evidence:** documentation captured on 2026-10-17 in [provider-docs](provider-docs/README.md); no live interoperability tests. The proposed API below is a design recommendation, not an implemented contract. Model versions sharing an API are grouped; the [20-model catalog](provider-docs/models.json) preserves individual entries.

**Recommendation:** adopt System One's `state` + named `questions` + named `answers` structure. Define three portable primitives, translate provider transports explicitly, and expose richer capabilities separately. Payload compatibility alone does not establish equivalent probabilities, evidence coverage, question isolation, or cost.

## 1. What the APIs have in common

| Common concept | Portable meaning |
| --- | --- |
| Shared state | The evidence or application state to evaluate; usually text or JSON |
| Caller-defined questions | Instructions and permitted outcomes supplied per request |
| Boolean / Noul / predicate | Probability that a condition holds |
| Choice | One of caller-defined categories, usually with probabilities over categories |
| Score | Expected position over ordered rubric levels; can be fractional |
| Multiple questions | Several judgments about one state; this does **not** establish independent execution or shared billing |
| Structured result | Software consumes typed fields rather than parsing an explanation; Tev1's native generated-letter interface is an exception |
| Application policy | Code chooses thresholds, escalation, actions, and permissions |

Most hosted APIs use authenticated JSON POSTs. Most specialized models charge for input and offer free output, but neither authentication nor pricing is universal: local servers and classifier.dev can be anonymous, and Span-02 bills input and output. “Zero output charge” also does not mean `usage.output_tokens` must be zero.

## 2. Every provider: what its adapter must do

Routes below are native provider routes unless marked otherwise. “Core” means the System One Noul/Choice/Score payload family, not verified drop-in compatibility.

| Provider / family | Endpoint or transport | Commonality | Difference the adapter must preserve |
| --- | --- | --- | --- |
| [TypeSafe Jev 1.13/1.14](provider-docs/sources/typesafe/api.md) | `api.typesafe.ai/v1/systemone` | Baseline core; independent questions | Distribution-derived confidence; latest/preview aliases differ; experimental images/Box need opt-in headers |
| [Basal](provider-docs/sources/basal/docs/API.md) | Local `/v1/systemone`, alias `/v1/basal` | Core; text/JSON | Confidence is selected-answer probability; official SDK untested upstream; additional task types and media depend on model/backend |
| [classifier.dev](provider-docs/sources/classifier-dev/docs.md) | `/v1/systemone` and `/v1/classify` | TypeSafe SDK surface; Jev-backed service | Separate classification shapes, batches/dimensions/multi-label, nullable scores, escalation, chunk selection, scraping and async jobs |
| [Perplexity Decider](provider-docs/sources/perplexity/docs/docs/decisions/quickstart.md) | `api.perplexity.ai/v1/decisions` | Core; text/images | Current V1.2 questions see one another; old V1.1 direct name resolves to V1.2; state billed once per group |
| [Nace Drex v1.5/v2.0](provider-docs/sources/nace-ai/docs/request-format.md) | Local `/v1/systemone`; model-specific runtimes | Core; explicit probability outputs | Local Score confidence approximates hosted formula; native `requests` batch extension; runtime/context configuration varies |
| [OpenAI Luna Decisions](provider-docs/sources/openai/decisions-reference.md) | `api.openai.com/v1/decisions` | Analogous three primitives | `input`, ordered question/answer arrays, `predicate`, typed choice values, `levels`, per-question refusal |
| [Microsoft Decision-1](provider-docs/providers/microsoft.md) | Foundry resource `/providers/microsoft/v1/systemone` | Core-shaped payload | Resource endpoint and Azure authentication; request model is deployment name, returned model can differ |
| [Inception Mercury Decide](provider-docs/sources/inception/docs/capabilities/decisions.md) | `api.inceptionlabs.ai/v1/decisions` | Core; text/images | Different route; image/body limits; free OpenRouter route is an access tier, not another primitive |
| [Cloudflare Clef / Flash / Omni](provider-docs/providers/cloudflare.md) | Workers binding or account `/ai/run/@cf/cloudflare/{model}` | Core plus media fields | Account/model transport and platform envelope; long text can be truncated; Omni adds audio |
| [Liquid d1 / d1-ultra](provider-docs/sources/liquid/docs/lfm/models/d1.md) | `api.liquid.ai/decisions/v1/systemone` | Core plus `images` | Each question repeats input/image billing; raw HTTP route and documented SDK root differ |
| [Jared Palmer Kev](provider-docs/sources/jaredpalmer/README.md) | Local `/v1/systemone` | Core and documented TypeSafe SDK use | Accepted context differs from validated context; calibration/runtime settings and diagnostic endpoints remain deployment-specific |
| [Upstage Solar Decide](provider-docs/sources/upstage/solar-decide.md) | Documents `/v1/systemone` schema | Core; beta, advertised 512K context | Captured model page does not establish complete native transport or isolation contract |
| [Respan Span-01 / Lite](provider-docs/sources/respan/api-reference.md) | `api.respan.ai/api/v1/scores` | Defined judgments over shared evidence | `span` + `behaviors`; ternary present/absent/not-observable; native IDs are `span-01-pro` / `span-01-free` |
| [ScaleDown Classify-1](provider-docs/sources/scaledown/docs/api-reference/decisions.md) | `api.scaledown.xyz/v1/scaledown` | Core with restrictions | Object state reads only `text`/`document`; internal call per question; confidence is winning probability |
| [Together Tev1](provider-docs/sources/together/model-card.md) | Together `/v1/chat/completions` | State + a question + allowed options | Generates one letter over 2–24 options; map letter to key; token logprobs are not calibrated decision probabilities |
| [Respan Span-02](provider-docs/sources/respan/span-02-concept.md) | `api.respan.ai/api/v1/decisions` | Core plus images | Adds `number` and deadline-controlled reasoning; input/output billing; distinct from Span-01 |

[OpenRouter](provider-docs/sources/openrouter/docs/guides/community/typesafe-sdk.md) is a normalization layer: TypeSafe SDK base URL `https://openrouter.ai/api` produces `/api/v1/systemone`; its separate Decisions route is `/api/alpha/decisions`. Router model IDs, response envelopes, media support, prices and limits must be tracked independently from native APIs. The Flavio Copes article is a tutorial, not an additional API.

## 3. Proposed portable contract

Use `POST /v1/decisions`. Keep named maps to avoid positional matching. Use explicit primitive names: **`boolean`, `choice`, `score`**; adapters translate Boolean to Jev's `noul` or OpenAI's `predicate`. Keep portable instructions as strings; structured instructions are an optional capability.

```json
{
  "model": "typesafe/jev-1.14.0",
  "state": {"ticket": "I was charged twice. Please refund it."},
  "question_mode": "independent",
  "require_probabilities": true,
  "questions": {
    "refund": {"type": "boolean", "instructions": "Is a refund requested?"},
    "team": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "options": {"billing": "Payments and refunds", "other": "Other issues"}
    },
    "urgency": {
      "type": "score",
      "instructions": "How urgent is this?",
      "levels": ["Routine", "Soon", "Immediate"]
    }
  }
}
```

| Proposed answer | Required semantics |
| --- | --- |
| Boolean | `type: boolean`, `status: answered`, `probability: p(true)`; application chooses the threshold |
| Choice | `type: choice`, `status: answered`, `choice: option_key`, `probabilities: {option_key: p}` |
| Score | `type: score`, `status: answered`, `score: Σ(i × pᵢ)`, `probabilities: {"0": p₀, ...}`; levels indexed from zero |
| Refusal | Original question ID and type, `status: refused`; no fabricated decision or distribution |
| Question failure | Original question ID and type, `status: error`, structured error; distinguish from a completed uncertain judgment |

Return `{id, model, resolved_model, answers, usage, provider_metadata}`. `answers` uses the original question IDs. The registered `model` selects the provider/deployment; `resolved_model` records the returned checkpoint when known. Keep credentials and resource/deployment routing in server configuration.

Core invariants:

- Return one answer or explicit failure/refusal for every accepted question. Do not silently drop fields or questions.
- Choice probabilities sum approximately to one; Score probabilities sum approximately to one over the ordered levels. Independent multi-label probabilities have a different meaning.
- A Boolean probability near 0.5 means uncertainty, not medium intensity. A Score expectation is a rubric position, not probability that the answer is correct.
- Do **not** define a universal `confidence` by copying native fields. Preserve native confidence under provider metadata; compute any common concentration metric explicitly from distributions.
- With `require_probabilities: true` (recommended default), reject unsupported model/type combinations before inference. With it false, a label-only Choice may have `probabilities: null`; never invent certainty or silently substitute token logprobs. Boolean probabilities and expected Scores still require their defining probabilities.
- Serialize the **whole** JSON state deterministically when a provider requires text, including ScaleDown's `state.text` path. This preserves supplied fields, though representation changes can still affect model behavior. Validate limits after serialization.

## 4. Differences that cannot be erased by field renaming

| Axis | Observed difference | Unified contract recommendation |
| --- | --- | --- |
| Question isolation | Jev independent; Perplexity V1.2 joint and grouping-sensitive | Make `independent` / `joint` explicit. Independent means questions cannot see other questions. Use native isolation, split calls explicitly, or reject; report actual call count and usage |
| Confidence | Jev/Kev transformed; Basal/ScaleDown winning probability; Drex local approximation; classifier.dev nulls | Preserve probability distributions and native metrics separately; thresholds belong to model/deployment evaluations |
| Unknown evidence | Span-01 has a third probability mass | Preserve a `behavior` extension with all three masses. Do not turn not-observable into false or renormalize it away |
| Input coverage | Clef may truncate; classifier.dev may retrieve/select chunks | Default to rejecting oversized input. If truncation/selection is allowed, disclose it and retain available coverage metadata; reject strict full-coverage requirements if unverifiable |
| Billing | Liquid repeats prompts/images; ScaleDown sums internal calls; Perplexity shares state per group | Report native billed tokens, calls and cost when available; missing values are null, not zero. Preserve native usage details |
| Model identity | Aliases move; Perplexity old name selects new model; Azure uses deployment names | Record requested and resolved identity. Pin actual revisions where supported; an old-looking name is not proof of a frozen model |
| Probabilities | Direct outputs, transformed confidence, nullable scores, generated-token logprobs | Keep these distinct. No unsupported calibration guarantee; no model-independent action threshold |
| Execution | One state/many questions, many-state batch, async document job | Keep these as separate operations. A provider's batch extension is not evidence that every provider offers a batch endpoint |

`question_mode` describes isolation, not whether one judgment can consume another's answer. Dependent workflows remain separate application-controlled requests. Splitting joint providers into isolated calls can increase cost and latency; that execution policy must be documented rather than hidden.

## 5. Optional capabilities, not overloaded core primitives

| Capability | Examples in captured APIs | Preserve explicitly |
| --- | --- | --- |
| Images / audio / video | Jev experimental images; Basal omni; Clef family; Liquid; Mercury; OpenAI; Span-02 | Media type, source representation, model/backend limits; an image URL is not a portable input format |
| Bounding box | Jev 1.14 `box` | Image reference and normalized coordinates |
| Multi-label | Basal `multi`; classifier.dev multi-label | Independent per-label probabilities, selection policy, optional set confidence |
| Evidence-aware behavior | Span-01 | Present/absent/not-observable distribution and trace roles |
| Task operations | Basal verify/compress/extract | Supported/contradicted/not-stated, selected source text, values with source offsets; experimental maturity |
| Cost-based action / tool selection | Basal `act` / `tool` | Costs, defer action, tool schema and ranking; selection does not authorize execution |
| Numeric answer / reasoning budget | Span-02 `number`, `reasoning` | Native numeric semantics; provider thinking deadline distinct from HTTP timeout |
| Batch / async / URL ingestion | Drex `requests`; classifier.dev batches/jobs/scraping | Item IDs, ordering, job lifecycle, evidence processing, separate charges and idempotency rules |

Start with text/JSON and the three core primitives. Add extensions when required by an actual use case; do not emulate a bounding box, extraction span, or unknown-evidence distribution with an ordinary Choice response.

## 6. Capability discovery and validation

`GET /v1/models` should return **deployment-specific** capabilities: question types, modalities, probability availability, isolation modes, limits, overflow behavior and supported extensions. This is our proposed discovery contract; native `/v1/models` endpoints do not necessarily provide it.

Selected captured limits show why limits belong to deployments rather than one global schema:

| Deployment | Documented constraint |
| --- | --- |
| Jev | Default 64k/request and 32k/question; opt-in long context 262k; up to 255 Choice options; 32 MiB body |
| Perplexity direct V1.2 | 128 questions; 255 Choice options; 10 Score levels; under 256K total tokens; 32 MiB body |
| OpenAI native | 1–200 questions; up to 128 images |
| Clef Flash hosted | 64 questions; four images; 24,576-token window; text truncation documented |
| Mercury direct | 255 Choice options; 10 Score levels; 20 MiB default request-body limit |
| ScaleDown Decisions | Score requires 2–10 levels; object state has restricted fields |
| Kev | Smaller models validated to 8,192 tokens despite longer accepted inputs; 27B validated to 65,536 |
| Tev1 native | One option-letter decision over 2–24 options; no equivalent calibrated-distribution guarantee |

Normalize authentication, invalid request, unsupported capability, context overflow, insufficient credits, rate limit and upstream failure into stable error codes while preserving native status, request ID and retry delay. Keep model refusals in answers. Respect documented `Retry-After`; do not blindly retry charged scraping or async-job creation.

## 7. Design boundary and unresolved evidence

The useful abstraction is **typed judgments plus explicit capabilities**, with provider-specific adapters for request conversion, transport, response conversion and usage. Keep thresholding, ranking policy, authorization and side effects in application code. Avoid automatic fallback to a different model or lossy primitive conversion unless explicitly requested.

Remaining documentation gaps: OpenAI guide/reference disagree on public image URLs; Liquid's SDK root versus raw route was not tested; Upstage's captured page is not a complete native HTTP reference. No captured benchmark proves universal provider superiority. Compatibility and calibrated behavior still need contract tests and a representative labeled evaluation set.

Further detail: [provider comparison](provider-docs/comparison.md), [source index](provider-docs/source-index.md), and [capture manifest](provider-docs/manifest.json).
