# 02: Solution design

**Status:** corrected proposal, not implemented. The baseline inspected during review
is the published **Effect 4.0.5** package. Type sketches define intended contracts;
implementation must prove the generics, service requirements and runtime behavior.

## 1. Architecture

```text
Definition + input + assets
          │
          ▼
Prepare (Effect) ── schema encoding services, materialized media, stable IDs
          │ PreparedDecision
          ▼
Plan (pure) ─────── capability checks, atomic semantic groups, explicit lowerings
          │        partition independent groups, encode, validate final limits
          ▼
DecisionPlan ────── immutable native requests or explicit logical adapter calls
          │
Execute (Effect) ── provider transport, retry/fallback, budget, attempt ledger
          │
          ▼
Validate / derive (pure) ── typed answers + explicit evidence + per-answer origin
          │
          ▼
Calibrate / evaluate policy (pure) ◄── loaded profiles and qualification evidence
```

`DecisionPlan` is the planner's output. It is unrelated to Effect's `ExecutionPlan`,
which this design uses only for retry and provider fallback (§10).

A native provider is `{ deployment, capabilities, codec, transport }`. Preparation,
transport, configuration, profile loading and recording are effectful. Planning,
wire serialization, validation, supported metrics and policy evaluation are pure.
Programs compose these operations; they do not bypass their semantic checks.

## 2. Core model

### 2.1 Open primitives and explicit evidence

A primitive registration contains a stable kind/version, question schema, answer schema,
a pure validation function, and optional evidence-dependent derivations. Core-boundary
schemas/validators must be synchronous and require no external services; application
input schemas may require services and are handled during preparation.

```ts
// Structural sketches; the implementation supplies the schema/generic machinery.
interface Primitive<Spec, Value, Evidence> {
  readonly kind: string
  readonly version: string
  readonly question: PureCodec<Spec>
  readonly answer: PureCodec<{ readonly value: Value; readonly evidence: Evidence }>
  readonly validate: (spec: Spec, answer: unknown) => Result<Validated<Value, Evidence>, InvalidAnswer>
}

type Answer<V, E> =
  | { readonly status: "answered"; readonly value: V; readonly evidence: E;
      readonly origin: AnswerOrigin; readonly native: NativeEvidence }
  | { readonly status: "refused"; readonly reason?: string;
      readonly origin: AnswerOrigin; readonly native: NativeEvidence }
  | { readonly status: "error"; readonly error: InvalidAnswer;
      readonly origin: AnswerOrigin; readonly native: NativeEvidence }
```

`Result`, `PureCodec`, `Validated` and `NativeEvidence` above are contract placeholders,
not claims about exported Effect symbols. Public type tests must demonstrate inference
from the complete primitive registration.

| Primitive | Value | Evidence and derivation |
| --- | --- | --- |
| `boolean` | Probability of true | Finite distribution on false/true; no implicit action threshold |
| `choice` | Literal option label | Finite distribution, label-only or supported log probabilities, explicitly distinguished |
| `score` | Expected ordinal index | Finite distribution over ordered levels; recompute expectation locally |
| `multi` (later) | Selected labels | Independent marginal probabilities, not a distribution over label combinations |
| `box` (later) | Coordinates | Optional native confidence with declared semantics; no invented outcome distribution |
| `observable` (later) | Ternary judgment | Present/absent/notObservable distribution, all three outcomes retained |
| `number` (later) | Numeric estimate | Native evidence, possibly confidence; no finite-label calibration assumed |
| `tool` (later) | Selected tool | Finite distribution when supplied; never tool execution |
| `extract` (later) | Typed extracted fields | Source offsets/evidence where supplied; no invented probabilities |
| Native `act` (later) | Action including human deferral | Native costs/distribution/calibration evidence preserved |

Evidence kinds are registered contracts: `finite-distribution`, `independent-marginals`,
`label-only`, `logprobs`, and provider-specific evidence with identified semantics.
Native confidence is never relabelled as calibrated probability. Distribution metrics
accept only finite distributions; a multi-label vector must not be normalized to sum to 1.
An extension can add evidence operations without changing a central answer union.

Local expected-cost policy is separate from primitives. Native `act` is an optional
provider extension, not the prerequisite for running local policy.

### 2.2 Definitions and result inference

Definitions contain name, application revision, input schema, ordered question entries,
mode and references to definition-level assets. Const-generic constructors infer a
result record keyed by literal question IDs. Reject duplicate names/labels. Result shape:

```ts
interface DecisionResult<Answers> {
  readonly answers: Answers
  readonly meta: ExecutionSummary
}
```

Each answer has origin data even when refused or invalid. ExecutionSummary contains
call/attempt records and aggregate usage; it does not assert that every answer shares
a model or calibration profile. The public envelope avoids reserved question names.

### 2.3 Order and descriptions

Question, option and level order are explicit arrays, never inferred from numeric
object keys. Structured description trees preserve their supplied semantic content.
Dictionary fields may be sorted only when their contract explicitly declares order
irrelevant; schema/input encoding must preserve order wherever it affects wire semantics.

System One uses objects for some ordered fields. Its serializer must emit ordered entries
directly, or use an explicitly validated label mapping that preserves provider semantics.
Reject unsupported order preservation. A regression fixture with labels `"10"`, `"2"`
must prove both wire order and answer remapping. Do not pass through `Object.fromEntries`
and assume numeric key insertion order survives JSON serialization.

### 2.4 Hashes and identity

Use versioned, domain-separated hashes for distinct purposes:

- **Definition identity:** name, revision, primitive/handler versions, serialized specs,
  ordered question/option/level entries, mode and static example-asset digests. Input
  encoding behavior is application-versioned; arbitrary functions are not hashable.
- **Input identity:** actual encoded input and input-asset digests. It changes per example.
- **Execution fingerprint:** definition identity, semantic group membership/order,
  deployment identity and revision, codec/handler versions, runtime/quantization/reasoning
  settings, model identity, lowerings, placement policy and coverage classification.
  It excludes per-example input values and attempt IDs so profiles can apply across data.
- **Call/replay identity:** execution fingerprint plus exact input, body and semantic
  header hashes. Auth is represented by a non-secret scope identifier, never credentials.

Record requested model separately from resolved revision. Resolution comes from an
observed response or an authoritative pinned deployment manifest, with its source recorded;
otherwise it is unknown. Update the realized fingerprint when response evidence changes
identity/coverage. Calibration selection uses that realized fingerprint, not an alias guess.

## 3. Deployment capabilities

Capabilities are versioned deployment snapshots with source references and verification
status (`documented`, `replay-tested`, `live-tested`, or `unknown`). They describe:

| Dimension | Required distinctions |
| --- | --- |
| Primitives | Kind, version, handler availability, spec bounds and evidence kinds per primitive |
| Group semantics | Independent, joint, or unknown; known automatic regrouping behavior |
| Descriptions/state | Native structured support, permitted text fields, allowed serialization policies |
| Media | Kinds, placement, encoding, count/bytes/pixels/formats and experimental opt-ins |
| Limits | Per-question and per-request tokens, questions, options/levels, body bytes; accepted versus validated context |
| Overflow | Reject, truncate, select, regroup, or unknown; observed coverage may differ from planned coverage |
| Native evidence | Confidence meaning, precision/rounding and missing/nullable probabilities |
| Transport/billing | Route/envelope/auth scheme, native batch limits, documented billing estimator |
| Observability | Wire preview, raw response, resolved revision, coverage and usage availability |

There is no deployment-wide assumption that every primitive returns probabilities.
Unknown capability is not support. Generic System One configuration requires an explicit
capability snapshot and registered handlers, not just a base URL and model string.

TypeSafe's documented request and per-question token limits are distinct; the long-context
opt-in changes both. Kev's validated range is distinct from its accepted context size.
Cloudflare truncation and classifier.dev chunk selection need coverage policies, not just
larger request limits. Perplexity automatic grouping can invalidate a requested joint group.

## 4. Preparation and pure planning

### 4.1 Effectful preparation

`Decision.prepare` derives a JSON codec with `Schema.toCodecJson`, then actually encodes
using `Schema.encodeEffect`. The codec derivation alone does not encode. Its returned
Effect retains the input schema's `EncodingServices`; preparation also requires any asset
resolver it uses. Errors are typed `PreparationError`s preserving the schema/asset cause.

Load assets, verify digests and media metadata, freeze encoded input/specs, and assign
stable wire-reference IDs here. Inject an ID source or derive valid deterministic IDs
from content and placement. No UUID, clock, file read, remote fetch or random service is
called from the planner. Prepared values contain all data needed for pure planning.
Remote assets require a controlled materialization policy; an uninspected mutable URL
cannot establish exact bytes or full content coverage.

### 4.2 Planning sequence

`Planner.plan(prepared, deploymentSnapshot, policy)` returns a typed error or an immutable
plan. The sequence is normative:

1. Validate primitive registrations, executable dialect handlers and spec bounds.
2. Establish **semantic groups**. A joint definition is one atomic group. Independent
   questions may share an independent call; a joint provider requires singleton calls
   and explicit `splitForIsolation`. Unknown semantics fail strict planning. A joint
   definition on an independent provider fails. No v1 joint-to-independent lowering.
3. Apply only named, authorized lowerings; record affected IDs and implementation versions.
   Re-evaluate semantics after transformation. No lowering may silently introduce joint
   dependence or remove a declared dependence.
4. Validate media placement and construct immutable serialization inputs.
5. Partition only independent groups for question count, body/token bounds or optional
   cost optimization. A joint group remains intact, including when shared state alone
   exceeds the available limit.
6. Encode candidate calls, including actual body representation and semantic headers.
   Repartition independent groups if final sizes require it. Check **each final call**
   and each contained question, not only the unsplit aggregate.
7. Record limit/coverage evidence, cost estimates, fingerprint, preview and deterministic
   call IDs. Reject if the caller's required guarantees cannot be established.

### 4.3 Limits and coverage

Limit evidence is `exact`, `conservative-bound`, `estimate`, or `unknown`. Exact byte
limits use final UTF-8 bytes and, later, base64/multipart overhead. Token counts require a
matching tokenizer or a documented conservative bound; a heuristic is only an estimate.
The v1 JSON transport is uncompressed. Compression is deferred until both compressed and
uncompressed limits can be checked before sending and reflected in the plan.

`coverage: "require-full"` rejects unverifiable truncation, selection or regrouping.
For a provider guaranteed to reject oversized input without dropping content, estimated
counts can be allowed under an explicit limit policy: execution may still fail with a
limit error. That is different from guaranteeing that the request fits. A provider that
silently truncates cannot claim full coverage on the strength of an estimate.

Caller opt-in may permit `truncated`, `selected` or `unknown` coverage, recorded on every
affected answer. Provider responses refine planned coverage and may invalidate the policy
qualification. Joint semantics also require evidence that provider-side regrouping will
not split the group; otherwise fail before sending in strict mode.

### 4.4 Lowerings and plan shape

Named permissions replace a generic `allow: true` switch. Initial examples:

| Lowering | Contract |
| --- | --- |
| `stringify-description` | Deterministic full serialization, recorded despite retaining all text |
| `stringify-state` | Whole state into a permitted text field; never drop unrecognized fields |
| `multi-to-booleans` (later) | Only for a declared marginal-probability contract; reject joint/subset objectives that cannot be preserved |
| `native-act-to-local-policy` (later) | Explicitly loses native calibration/policy behavior; needs a new fingerprint and qualification |

No implicit lowering for box, extract, observable or too many score levels. An explicit
extra choice option is a definition change, not an invisible planner convenience.

A native plan contains ordered calls with semantic groups, original-to-wire ID mappings,
state/assets, immutable wire bytes, redacted preview, lowerings, limits, coverage, cost
estimates and hashes. An upstream-adapter plan carries a logical request and explicitly
unavailable wire preview. Execution validates deployment/configuration identity before
sending; it never silently regenerates a different request from an inspected plan.

## 5. Executable codec and extension contracts

A codec has versioned operations `encodeRequest(CallSpec)`, `decodeResponse(plan, body)`
and `toCanonical(plan, decoded)`. Request encoding and response decoding are different
schemas and are never tested by passing encoded requests to the response decoder.
Serialization and schema validation here are synchronous and require no services.

A primitive/dialect handler supplies question encoding, answer decoding/validation,
ID/label remapping, and optional lowerings. Registration is keyed by primitive kind/version
and codec dialect/version. Duplicate registrations fail; missing handlers fail planning.
Registering `extensions: ["multi"]` without an implementation is insufficient.
Metrics and calibrators use a similar evidence-specific registration boundary.

| Candidate family | Shared shape | Variation requiring handlers/configuration |
| --- | --- | --- |
| System One | `state`, named `questions`, `answers`; boolean ↔ `noul` | Score label mapping, structured descriptions, media, extensions, envelopes and missing evidence |
| OpenAI Decisions | Ordered `questions[]`, predicate/choices/levels | Input messages, typed values, refusal and media |
| Span behaviors | `span`, `behaviors` | Ternary observable result; preserve notObservable |
| Chat letter | One choice with lettered options | Generated letter validation, optional token log probabilities, label remapping |

Known required response fields are strict. Unknown native fields can be preserved for
diagnostics without changing canonical semantics. Retaining raw bodies is configurable
because responses may contain sensitive input. In-memory provenance need not imply durable
raw recording. Whole unusable envelopes fail with `AiError`; identifiable missing/invalid
question answers become per-question invalid-answer values.

## 6. Transport

Transport owns route, auth acquisition, headers, model/deployment mapping, HTTP execution
and envelope handling. Provider-specific status translation uses `AiError` with preserved
status/cause and retry-delay evidence. Transport performs one attempt and has no hidden
retry loop. Config secrets are redacted; semantic configuration is fingerprinted separately.

Use injected `effect/http` HttpClient. Native codecs supply immutable bodies; transport
adds auth/operational headers without changing semantic content. Mutable request headers
that affect model behavior belong in the prepared configuration snapshot. Token refresh
may change credentials while preserving the same non-secret credential-scope identity.
Provider binding transports and compressed bodies need their own explicit later contracts.

## 7. Provider mapping and release boundary

These are mappings from the captured docs, not verified interchangeable implementations.
There are **15 providers and 16 native surfaces** because Span-01 and Span-02 differ.
All presets require both request and response fixtures; incomplete docs remain incomplete.

| Provider / surface | Candidate codec | Deployment differences | Release |
| --- | --- | --- | --- |
| TypeSafe Jev 1.13/1.14 | System One | Independent; native descriptions; opt-in media/long context; box on 1.14 | Initial core primitives |
| Basal 2.x | System One + extension handlers | Local endpoint; string descriptions per captured docs; native act/multi/tool/extract; omni media | Initial core primitives |
| Perplexity V1.2 | System One | `/v1/decisions`; joint questions, possible grouping, aliases and inline images | Initial isolated core; joint only with verified bounds |
| OpenAI Luna | OpenAI Decisions | `/v1/decisions`; ordered questions, per-question refusal, media | Initial core primitives |
| classifier.dev | System One compatibility | Workspace auth, nullable evidence, escalation and selected chunks; classify endpoint is separate | Later |
| Drex v1.5/v2.0 | System One | Local runtime; approximate score confidence; native requests batch up to 1024 | Later |
| Kev | System One | Local runtime; validated context distinct from accepted context | Later |
| Microsoft Decision-1 | System One | Foundry identity/resource; wire model is deployment name | Later |
| Mercury Decide | System One | `/v1/decisions`; media in state/instructions, not criteria | Later |
| Cloudflare Clef/Flash/Omni | System One | Account envelope or binding; truncation and model-specific modalities/limits | Later |
| Liquid d1 | System One | `/decisions/v1/systemone`; top-level images; per-question image billing | Later |
| Solar Decide | System One candidate | Captured beta transport documentation incomplete | Blocked on contract evidence |
| ScaleDown Classify-1 | System One | `/v1/scaledown`; restricted state fields; top-probability confidence | Later |
| Span-02 | System One + number | `/api/v1/decisions`; reasoning deadline, top-level images, input/output billing | Later |
| Span-01 / Lite | Span behaviors | `/api/v1/scores`; observable only | Later |
| Tev1 | Chat letter | Together chat; 2–24 options; label-only or token log probabilities | Later |

Source details and links are in the [provider archive](../../../research/provider-docs/README.md).
The upstream `effect/ai` bridge is a separate integration path, not a seventeenth provider.

## 8. Engine and Effect service lifecycle

Engine is a `Context.Service` constructed from one Provider plus injected execution
services. Its layer captures that provider. Each fallback step must therefore build
and provide its own Engine layer; providing a different Provider underneath an already
constructed Engine does not change the captured provider.

Building a separate layer per step is not enough by itself. Effect v4 memoizes layers
by object identity, and a nested `Effect.provide` reuses any layer an enclosing
`provide` or runtime has already built; `ExecutionPlan` steps are provided the same way.
If the library exported one shared `Engine.layer` and each step were
`Engine.layer.pipe(Layer.provide(p))`, an application that also provides an Engine
higher up would make every step reuse that outer Engine, and the fallback provider
would never be called. A probe on 4.0.5 confirmed this: all attempts reached the outer
provider, and `{ local: true }` on the outer provide did not prevent the reuse.

The public constructor is therefore `Engine.layerFor(providerLayer)`, which creates a
new `Layer.effect(Engine, make)` object per call. Steps cannot collide with an
enclosing Engine, and a reused constant is still built once. `Layer.fresh(stepLayer)`
also isolates a step, but it is the caller's burden and easy to forget. Shared services
that a step layer requires but does not provide (ledger, budget, HttpClient) are
resolved from the surrounding context, so per-step construction does not split them.

Public operations and their effect requirements:

| Operation | Behavior | Error/environment obligations |
| --- | --- | --- |
| `Decision.prepare` | Encode and materialize | PreparationError; input schema EncodingServices and required asset services |
| `Planner.plan` | Pure planning | Pure result with PlanError; no Effect environment |
| `Engine.plan` | Plan a prepared input with captured provider | PlanError; Engine access, no schema encoding services |
| `Engine.verify` | Static compatibility only | PlanError; Engine; cannot certify dynamic input limits |
| `Engine.execute` | Execute an immutable plan | AiError, BudgetExceeded, plan identity mismatch; Engine |
| `Engine.decide` | Prepare → plan → execute | Union of the above; Engine plus preparation requirements |
| `Engine.decideAll` | Decide then project values | Above plus DecisionIncomplete; retains preparation requirements |

For a definition with input schema `S`, `decide` must retain `S["EncodingServices"]`
in its Effect environment. Tests must include a schema that actually requires an encoding
service; a plain `Schema.Struct` example is insufficient to prove this contract.

A per-execution ledger and budget are allocated outside fallback steps. Each step's Engine
writes to them. Cancellation/interruption still closes attempt records with known or
unknown usage. No single result-level provider/model field overrides per-answer origins.

### 8.1 Upstream bridge

`Provider.fromDecisionModel` accepts an upstream layer and explicit conservative
capabilities. The inspected DecisionModel supports probability/classify/rate; its response
contains answers and token usage. Media depends on the particular implementation. The
bridge must mark raw HTTP response, exact wire preview and resolved checkpoint unavailable
unless a separate verified integration supplies them. Unknown group semantics prevent
unsafe multi-question calls.

`Engine.toDecisionModel` exposes only the representable subset. If the result contains
refusal or invalid answers, the bridge deliberately raises the upstream whole-call error;
it documents this loss of partial-result granularity. Neither direction silently drops
an extension, fabricates metadata, or weakens grouping/coverage policy.

### 8.2 Batching is deferred

No cross-caller request merging in v1. A future design must check semantic independence,
auth/tenant scope, deployment and settings, policy/coverage compatibility, deadlines,
cancellation and budgets. It must namespace duplicate question and asset IDs, remap
answers and preserve individual provenance. Identical input hashes are insufficient.
Native `requests[]` batching that preserves separate states/groups is a different feature
and needs its own accounting and failure contract. `RequestResolver` is a mechanism,
not evidence that either form of batching is semantically safe.

## 9. Validation, calibration, policy and provenance

### 9.1 Validation and derivation

Validate finite probabilities in [0,1], known labels, completeness and normalized mass.
Use a documented per-dialect rounding tolerance, not one guessed global precision.
Rescale only within that tolerance and record the correction. Larger errors invalidate
the answer. Independent marginals are range-checked individually, never mass-normalized.

Recompute canonical score from the accepted distribution. An inconsistent native scalar
is diagnostic data, not the canonical answer. Validate box geometry and extract offsets
with their own primitive contracts. Choice labels inconsistent with their evidence need
a documented handler rule or an invalid answer, not a hidden replacement.

Metrics identify their formula/version: concentration, top probability, margin, entropy,
ordinal concentration and boolean `|2p−1|` are different quantities. Preserve native
confidence separately. Raw and calibrated distributions remain separately accessible;
when calibration changes a distribution, recompute its score, metrics and any derived
choice using an explicit versioned tie rule.

### 9.2 Calibration is not qualification

A calibration artifact defines an evidence transform, supported primitive/evidence shape,
method/version, training population, fitting data provenance and execution fingerprint.
Implement methods incrementally: identity baseline and a justified finite-distribution
method first; histogram/isotonic variants require their own evidence/output contracts.
A label-only answer has no suitable finite distribution to transform.

An **automation qualification** separately records policy and threshold versions, risk
measure (for example error conditional on accepting), target and confidence criterion,
evaluation population, held-out groups, accepted/support counts, observed risk and its
statistical bound, expiry and exclusions. Fitting, policy selection and qualification
must avoid reusing the same evidence in a way that invalidates the reported bound.
One option is separate fit/select/qualification groups; alternative procedures need a
stated statistical justification.

Insufficient support, missing identity, incompatible group/codec/lowering settings, unknown
coverage or a changed resolved model prevents qualification matching by default. An
application may explicitly qualify a documented revision window/population; this does not
turn an unobserved alias target into a known model. Profiles do not certify all future
traffic. Report drift, uncertainty and requalification requirements.

### 9.3 Policy

Pure policy evaluates supported evidence against costs, thresholds and qualification.
It returns a recommendation, expected costs where calculable, qualified/shadow mode,
deferral and reasons. Shadow recommendations never authorize automatic application
side effects. The application owns execution and permissions. With no qualified data,
the library is still useful for observation, human review and evaluation.

Basal native act deferral remains an **answered** action (often human). Its refused
candidate action is distinct from a refusal to answer. `maxError` is a policy condition
whose statistical support must be specified, not a guarantee inferred from a threshold.

### 9.4 Per-answer origin and execution ledger

Answer origin includes definition/question IDs, input hash, semantic group membership,
call/attempt IDs, provider/deployment, requested/resolved model with resolution source,
codec/handler versions, actual lowerings and coverage, evidence derivations, calibration
artifact and policy qualification IDs (or explicit absence). The shared ledger records
all request attempts, status, timing, retry/fallback reason and native usage when known.

Aggregate usage counts each attempt once. A partial total must include an unknown-usage
indicator; missing values are never zero. Costs are estimates until provider evidence
supports them. Recording must opt into/redact sensitive content while retaining hashes
and non-secret identity sufficient to detect mismatches.

## 10. Resilience and budgets

Per-call retry consumes only failed Effects with explicitly eligible errors. Status:error
inside a successful result is not retryable by Effect. Network/HTTP retry occurs before
whole-call failure is folded or projected; v1 does not fold terminal transport failures
into answer values. Invalid envelope errors are not retryable by default.

Each fallback step builds an Engine with its own Provider and reruns preparation/planning.
On a terminal eligible call failure, whole-decision fallback discards answers from the
abandoned step; its completed/failed attempts remain in the ledger. Do not return a
mixture of providers by accident. Partial refusal/invalid answers stop ordinary retry;
explicit escalation is a separate whole-decision operation. Joint groups are always atomic.
Capability-based fallback is opt-in for named plan errors; invalid input is terminal.

With Effect 4.0.5, each later ExecutionPlan step's `while` predicate gates entry using
the prior failure. The first step's retry predicate alone does not prevent advancing.
Apply eligibility checks at every step, including budget/preparation terminal failures.
In 4.0.5 the first step's `attempts` is a total (N attempts means N−1 retries), a later
step's prior failure counts toward its own schedule, and a step with a `schedule` but no
`attempts` retries for as long as `while` holds. Every step therefore needs a bound.
Retry and fallback eligibility can differ: an unsupported capability may justify another
provider, but cannot justify retrying the same provider unchanged. Test both boundaries.

Choose one retry owner or calculate a shared total attempt bound. ExecutionPlan retries
plus nested per-call retries must not multiply uncontrolled. Honor Retry-After, cancellation
and per-call timeout; Span-02's reasoning deadline is a request setting, not HTTP timeout.
Inference retries can duplicate billing and change answers. Require an explicit budget
for attempts/calls, latency, estimated cost and program depth, with conservative reservations
and unknown-usage handling. Neither lack of mutation nor an idempotency key proves free retries.
Enforced estimate reservations are not a hard cap on actual provider charges when pricing,
output usage or failed-attempt billing is unknown; report that limitation in the ledger.

## 11. Later programs

Walk, cascade, fan-out and consistency helpers compose Engine operations. They carry
budgets, stable definition revisions, deterministic injected randomness where used, and
per-step origins. A path product is a **path score** unless conditional semantics and
calibration justify calling it a probability. No generic property claims that arbitrary
path scores sum to ≤1. Sampling, beam pruning and discarded branches are recorded.

A cascade explicitly chooses whether to escalate on policy deferral, refusal, invalid
answer or failed call. It cannot reinterpret those conditions as the same error. Joint
fan-out must satisfy atomicity; it cannot evade limits by quietly becoming independent.

## 12. Effect v4 mapping and runtime boundary

| Concern | Effect mapping / constraint |
| --- | --- |
| Engine, Provider, profile store, ledger, budget | Context.Service and Layer; explicit lifetime and ownership |
| Input encoding | Schema.toCodecJson plus Schema.encodeEffect; propagate EncodingServices |
| Errors | Typed tagged/reason errors; AiError at provider boundary; error handlers do not inspect success values |
| Retry/fallback | Schedule and ExecutionPlan; per-step Engine construction via `Engine.layerFor`, never a shared memoized Engine layer |
| Layer memoization | Nested `provide` reuses layers built above it; isolate per-step and per-test layers by identity, `Layer.fresh` or `{ local: true }` |
| Stability | `ExecutionPlan`, `Effect.withExecutionPlan`, `effect/ai` (Decision, DecisionModel, AiError) and `effect/http` are `@stability unstable` in 4.0.5 and may break in minor releases; Context, Layer, Schedule, Semaphore and the Schema codec functions used here are stable |
| Toolchain | Effect 4 requires TypeScript ≥ 5.9 with `strict` enabled |
| Concurrency | Effect.forEach / Semaphore; a semaphore limits concurrency, not requests per time period |
| Rate limiting | Separate clock-based limiter or provider delay policy |
| Transport | Injected effect/http HttpClient; Node file/config facilities stay out of pure modules |
| Tracing | Effect spans; per-call/attempt IDs, redacted attributes and explicit unknown fields |
| Tests | @effect/vitest, TestClock, stub HttpClient; compiler tests for public types and environments |
| Future batching | Request/RequestResolver only after the semantic/accounting contract is proven |

Official sources: [DecisionModel](https://effect.website/docs/v4/api/effect/ai/DecisionModel),
[ExecutionPlan](https://effect.website/docs/v4/api/effect/ExecutionPlan),
[Schema codecs](https://effect.website/docs/v4/schema/canonical-codecs),
[AiError](https://effect.website/docs/v4/api/effect/ai/AiError),
[HttpClient](https://effect.website/docs/v4/api/effect/http/HttpClient).
The bridge isolates unstable upstream details. Do not claim support for an untested version.

## 13. Testing and evidence

- **Types:** literal inference, heterogeneous extension answers, input encoding service
  propagation and unsupported evidence operations rejected at compile time where possible.
- **Pure behavior:** atomic groups, explicit lowerings, deterministic hashes/order,
  primitive-specific validation, calibrated derivation and qualification mismatch.
- **Wire goldens:** separate request encodes and response decodes from captured examples;
  annotate source and any fixture edits. No request/response round-trip fiction.
- **Transport:** exact bytes/headers, envelopes, HTTP error mapping, Retry-After and unknown usage.
- **Engine:** actual Engine/Provider layers with stub HTTP; assert fallback reaches two
  different providers, partial values do not retry, and abandoned attempts stay accounted for.
- **Extension contract:** external test plugin adds a primitive plus codec handler and
  evidence operation with zero core changes; missing registration fails before I/O.
- **Replay:** exact call fingerprints, mismatch rejection and redaction; docs fixtures
  prove contract handling, not real inference or accuracy.
- **Live:** opt-in credentials and bounded cost, explicitly reported per deployment/revision.
- **Evaluation:** grouped holdouts, risk/support reporting, invalidation and shadow behavior.

Useful properties: normalization is idempotent within tolerance; option reordering changes
identity; final encoded bytes meet declared exact byte limits; a joint group's membership
never changes through partitioning. Token-limit guarantees are only as strong as their
recorded evidence. Synthetic calibration tests prove algorithms, not production qualification.

## 14. Package layout and release policy

Start with one library package and explicit subpath exports:

```text
packages/
  api/
    src/           core contracts, preparation, planner, Engine and policy
    src/codecs/    dialect implementations and handler registry
    src/providers/ native presets and upstream bridge
    src/testing/   scripted engine, replay and fixture helpers
    src/node/      optional file/config integrations
  eval/            offline datasets, fitting and qualification reports
```

Working imports: `@decisions/api`, `/providers`, `/testing`, `/node`. Final naming is open.
Keep eval tooling outside the runtime library. Split publishable packages only when actual
consumers or dependencies justify it. No gateway package in v1.

Pin the development dependency and lockfile to `effect@4.0.5` initially. Advertise only a
peer range exercised by the compatibility suite; `^4.0.5` is a range, not a pin. Because
the unstable modules above may break in minor releases, a caret range would advertise
untested minors; any range must stay within what the suite has run. Use TypeScript ≥ 5.9
(strict) and the matching `@effect/vitest@4.0.5`; all Effect packages share one version
number in v4. Initial APIs
remain experimental until contract and live validation justify stronger stability claims.

## 15. Decisions and alternatives

| Decision | Reason |
| --- | --- |
| Own open core with explicit evidence | Boxes, estimates, missing distributions and ternary outcomes exceed the upstream closed question union |
| Atomic joint groups | Splitting changes which questions can see each other |
| Effectful preparation before pure planning | Schema encoders and media can require services; pure planning must receive materialized values |
| Executable handler registry | Schema extensibility alone cannot encode or decode an unknown primitive |
| Per-answer origin plus shared ledger | Mixed calls, discarded attempts and per-question calibration cannot be represented by one model field |
| Separate calibration and qualification | Fitting probabilities does not establish policy risk on held-out traffic |
| No cross-caller batching in v1 | Shared state alone does not address collisions, isolation, cancellation or accounting |
| Library and four providers first | Exercise independent, joint, local-runtime and distinct-codec cases before expanding scope |

## 16. Open questions

Defaults resolved for this proposal: no gateway in v1; TypeSafe/Basal/Perplexity/OpenAI
first; Node support first and Bun next; portable core/HTTP without promising untested
Workers support; browser core/proxy use. Remaining choices:

1. Domain owner, labelled dataset and risk target for the first real qualification.
   Proposed first domain: ticket triage with customer/conversation-grouped holdouts.
2. Profile/qualification storage and review process. Start with explicit loaded artifacts;
   file storage is a Node integration, not a required core service implementation.
3. Which exact tokenizer or conservative bounds each initial provider exposes. Until
   verified, classify token evidence as estimate/unknown and enforce strict coverage rules.
4. Final package name, license, release version and public stability policy.
5. Whether Basal accepts structured descriptions beyond the captured string contract;
   keep explicit serialization until verified.
6. Runtime validation scope after Node/Bun, and whether a later gateway needs tenancy,
   deployment allowlists and application authentication.
7. Upstream bridge improvements worth proposing after contract tests expose concrete gaps;
   avoid assuming a particular upstream adapter lacks media support without verification.
