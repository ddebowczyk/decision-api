# 03: Implementation plan

**Status:** proposed work only. This document does not authorize starting implementation.
The contract is [02-solution-design.md](02-solution-design.md); the API tour is
[01-concept-dx.md](01-concept-dx.md). S1–S50 are ordered checkpoints, not a claim that
all work has equal size or belongs in v1.

## Method and release boundary

- Aim for one reviewable commit per step; split a step if its acceptance gate hides
  multiple independent behaviors. Keep the tree green between steps.
- For behavior changes, first demonstrate the failing test, then make it pass.
  Scaffolding and documentation use relevant validation instead of artificial red tests.
- Use pnpm, strict TypeScript and `just` recipes for check/test/golden commands. Pin the
  initial development dependency and lockfile to **effect@4.0.5** and the matching
  `@effect/vitest@4.0.5`, with TypeScript ≥ 5.9 in strict mode (Effect 4's stated minimum).
  A tested peer range is a separate release choice.
- Capture source attribution and fixture edits. Request encoding and response decoding
  have separate goldens; requests are never fed to response decoders as a round-trip test.
- No live inference is needed for S1–S8. No production automation qualification can be
  obtained from documentation examples or synthetic fixtures.

| Milestone | Outcome | Steps | Scope |
| --- | --- | --- | --- |
| M1: Offline typed core | Typed definitions, evidence, validation, TypeSafe fixtures | S1–S8 | v1 foundation |
| M2: Prepare and plan | Effectful encoding, executable capabilities, atomic groups and final limits | S9–S14 | v1 foundation |
| M3: TypeSafe Engine | Transport, ledger, retries/fallback lifecycle and replay | S15–S20 | v1 foundation |
| M4: Four-provider library | Basal, Perplexity, OpenAI, upstream bridges and runtime contract suite | S21–S26 | Minimum useful library |
| M5: Evaluation and policy | Calibration, qualification, shadow policy and release gates | S27–S32 | v1 policy facilities |
| M6: Media | Materialization, placement, encodings and actual byte limits | S33–S37 | Later opt-in scope |
| M7: Programs and expansion | Budgets, cascades/walks and additional provider contracts | S38–S42 | Later opt-in scope |
| M8: Extensions | multi, box, observable, number, native act/tool and label-only interfaces | S43–S47 | Later opt-in scope |
| M9: Deferred infrastructure | Native batch, cross-caller merge, optional gateway | S48–S50 | Requires a demonstrated need |

M1–M4 delivers a useful typed library. M5 supplies tools to measure policy risk and
control automation eligibility; it does **not** make provider switching automatically
safe. Real automation needs domain-owned data and a matching qualification. A v1 release
can remain shadow-only when that evidence is unavailable.

## M1: Offline typed core

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S1 | One `packages/api` library with subpath boundaries; strict TypeScript, test/lint tooling and justfile | Toolchain/version check, build and one meaningful import/type smoke pass; no empty-suite success claim |
| S2 | Versioned Primitive and evidence contracts; boolean, choice and score registrations | Schema/validation cases cover finite distributions and a test label-only primitive without pretending it has probabilities |
| S3 | Const-generic Q constructors and Decision definitions with ordered entry arrays, name and revision | Type tests infer literal IDs/options; duplicate IDs/labels rejected; numeric-looking option order remains explicit |
| S4 | Versioned canonical identity functions for definitions/input; separate fingerprint and replay key contracts | Same input is deterministic; option/level/question order changes identity; `"10"`, `"2"` regression; schema behavior revision changes identity |
| S5 | Primitive-specific answer validation and canonical derivation | Invalid mass/ranges/labels rejected; in-tolerance correction recorded; inconsistent native score cannot become canonical; missing evidence is not synthesized |
| S6 | Evidence-gated metrics with formula/version IDs | Known examples for concentration/entropy/margin/ordinal metrics; unsupported evidence rejected; multi marginals never normalized as a finite distribution |
| S7 | System One core request/response schemas and executable handlers | Independent fixture decodes from the archived TypeSafe API; missing required fields fail while unknown native fields remain diagnostic |
| S8 | Request encoder, response decoder and canonical mapping demonstrated by an offline typed triage example | Separate request golden and documented response fixture; literal result inference and numeric option wire order pass; fixture IDs/edits are attributed |

**M1 exit:** a typed triage example decoded from TypeSafe's documented response shapes,
with no network. Start from [the captured API reference](../../../research/provider-docs/sources/typesafe/api.md).
If examples need combining or question-ID renaming, label the fixture as adapted; do not
represent it as a real response to the application's Triage definition.

## M2: Effectful preparation, pure planning

Depends on M1. Planner contracts precede Engine implementation.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S9 | Decision.prepare: derive JSON codec, run Schema.encodeEffect, materialize text-only prepared values | A schema requiring an encoding service fails to typecheck without it and succeeds with it; encoding failure produces PreparationError; no inference HTTP |
| S10 | Versioned deployment capabilities, handler registry, realized fingerprint contract | Unknown semantics/support fail conservatively; capability declarations without handlers fail; an external test plugin registers a new primitive/handler with no core edits |
| S11 | Semantic group planner | Joint group over maxQuestions fails intact; independent groups partition; independent-on-joint requires splitForIsolation; joint-on-independent fails; cost optimization cannot split joint groups |
| S12 | Named lowerings, state/description serialization and order-preserving wire mapping | Missing permission fails; permitted serialization preserves complete content and records version/affected IDs; duplicate/mapped labels round-trip through response mapping |
| S13 | Final-call limits and coverage evidence, including per-question/request tokens | Partition before final validation; encoded UTF-8 bytes checked per call; exact/bound/estimate/unknown distinguished; silent truncation or provider regrouping cannot claim full coverage from an estimate |
| S14 | Immutable plan, native/logical preview, static verification and billing-estimate hooks | Preview body equals emitted plan bytes; static verification does not certify dynamic input size; final group fingerprints change when membership/lowerings change |

**M2 exit:** every native call is justified by a reproducible plan. An unsupported
request fails before inference I/O; estimates remain labelled estimates.

## M3: TypeSafe transport and Engine

Depends on M2. Establish failure semantics and service lifetime before adding providers.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S15 | One-attempt HttpClient transport, AiError mapping and TypeSafe core preset | Stub tests cover auth/config errors, 400/404/413/422/429/5xx and network failures; Retry-After retained; capabilities cite archived source; resolved model remains unknown unless evidenced |
| S16 | Engine layer and plan/execute/decide/decideAll | End-to-end stub fixture; actual schema encoding requirements retained; execute rejects incompatible deployment/configuration; static verify and dynamic plan remain distinct |
| S17 | Per-answer origin and execution ledger with usage accounting | Per-question refusal/missing/invalid answers preserve siblings; broken whole envelope fails Effect; call usage counted once and unknown usage never becomes zero |
| S18 | Budgeted retry of failed calls with one retry owner | TestClock verifies Retry-After and deadline/cancellation; retries recorded/reserved; terminal errors stop; status:error/refused values do not cause another HTTP call |
| S19 | ExecutionPlan whole-decision fallback with per-step `Engine.layerFor` construction and entry predicates | Two actual provider layers record different invocations; old captured-provider regression fails; fallback still reaches the second provider when an Engine is also provided above the plan (nested-memoization regression); a step with a schedule and no attempts is rejected or bounded; terminal preparation/budget errors never enter later steps; partial first-step results are discarded but billed/unknown attempts remain in the shared ledger |
| S20 | Scripted engine plus opt-in record/replay under `/testing` | Matching fingerprints replay; changed grouping/model/headers/input rejects replay; sensitive content is redacted or explicitly opted in; missing recordings fail loudly |

**M3 exit:** an opt-in, budgeted TypeSafe smoke can confirm one pinned deployment.
Report whether it ran and what it proves. Absence of credentials is a skipped live
validation, not evidence of compatibility. Keep raw credentials out of fixtures.

## M4: Four-provider minimum library

Depends on M3. Keep the release to four providers; remaining transports move to S42.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S21 | Basal core preset using System One handlers | Request/response goldens from archived docs; structured descriptions require explicit stringify permission; native confidence stays native; engine/runtime identity is recorded when supplied |
| S22 | Perplexity preset and isolated-call mode | Independent requests fail without isolation permission and become singleton calls with it; an oversize/unverifiable joint group fails before HTTP; aliases are not guessed as resolved revisions |
| S23 | OpenAI Decisions codec and preset | Ordered predicate/choice/score goldens; per-question refusal has no fabricated distribution; native input/choice mappings preserve values and order |
| S24 | Provider.fromDecisionModel with explicit conservative capabilities | Upstream-backed stub handles representable primitives; wire/raw/resolved-model fields stay unavailable; unknown grouping and unsupported media/extensions fail before delegation |
| S25 | Engine.toDecisionModel bridge with documented partial-result projection | Representable answers/usage map; a refusal or invalid answer becomes deliberate whole-call upstream failure; unsupported evidence or extension cannot be dropped silently |
| S26 | Shared contract suite, example app and runtime boundary | Same portable definition on all four via replay; explicit stringification/isolation shown; incompatible cases fail; Node build/runtime gate; Bun gate reported separately, no untested runtime claims |

**M4 exit:** the same decision can be run by swapping a correctly composed Engine layer
and supplying explicit semantic permissions. This proves the library's contract; live
model quality remains a separate evaluation.

## M5: Evaluation, calibration and automation qualification

Depends on M4. Create `packages/eval`; keep dataset fitting out of the runtime library.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S27 | Dataset, label provenance and grouped fit/select/qualification partitions | Customer/conversation/document groups never overlap splits; missing labels excluded explicitly; dataset revisions and population recorded; replay runner deterministic |
| S28 | Evaluation metrics and finite-evidence calibration baseline | Known-answer tests for accuracy/Brier/ECE and support; fit on fit partition only; raw evidence retained; label-only calibration rejected; synthetic improvement is labelled algorithm validation |
| S29 | Calibration artifact matching and derivation | Match realized execution fingerprint; changed grouping/order/codec/lowerings/revision/coverage invalidates; calibrated score/choice/metrics recomputed with documented tie rule |
| S30 | Qualification artifact and report for a specified risk criterion | Held-out accepted/support counts and bound reported; insufficient sample support, selection leakage, expiry or failed criterion yields unqualified; synthetic tests do not issue production credentials |
| S31 | Pure expected-cost/bands policy with qualification gate and shadow mode | Profile alone cannot permit auto; missing/mismatched qualification yields shadow; human deferral is a completed policy decision; qualified action still requires application-owned execution |
| S32 | Release documentation, artifact loading boundary, examples and live/eval report | Public examples typecheck; files loaded only through Node integration; exact development pin/tested peer range declared; fixtures/live/model-quality evidence reported separately; unavailable domain data leaves policy shadow-only |

**M5 exit:** a candidate library release with an explicit supported runtime/provider matrix.
A real qualification is conditional on domain-owned labelled data, a stated risk target
and passing its acceptance criterion. Do not mark the product qualified merely because
S27–S32's code tests pass.

## M6: Media, later

Depends on M4 contracts; policy use also requires M5 fingerprint/qualification rules.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S33 | Materialized media values, definition/input asset distinction and controlled loaders | File/URL loading occurs during preparation; changed bytes change the right hashes; static example digests affect definition identity; mutable unchecked URL cannot assert exact content |
| S34 | Placement and modality capabilities plus deterministic references | Criteria image on unsupported deployment fails before sending; planner runs without ID/file/random services; repeated prepared input yields identical references |
| S35 | Provider-specific media serializers, one adapter at a time | Goldens for TypeSafe assets, Perplexity inline parts and OpenAI messages; no unsupported placement rewrite; any additional top-level-list adapter has its own fixtures |
| S36 | TypeSafe multipart transport and experimental opt-ins | Exact body boundary/parts match the plan, headers are present, all assets referenced and byte limits include multipart overhead; no hidden re-encoding |
| S37 | Format/dimension/count/body/token checks and runtime media gate | Validate deployment-specific bounds, UTF-8/base64/multipart sizes; estimated token limits remain estimates; no inferred full coverage; tested Node/Bun support matrix updated |

## M7: Programs and additional providers, later

Depends on M5; media-using paths also depend on M6. Existing basic resilience stays in M3.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S38 | Extend shared budgets to nested/multi-step programs | Cancellation and retries cannot evade reservation; attempts/depth bounded; estimated-cost reservations enforced with uncertainty explicit; actual unknown charges never claimed bounded |
| S39 | Explicit cascade and fan-out combinators | Distinguish refusal, invalid answer, failed call and policy deferral; escalation is observable; no joint fragment execution or accidental answer mixing |
| S40 | Taxonomy walk/beam with deterministic sampling | Scripted conditionals verify chosen paths; path score is not mislabelled calibrated probability; pruning/sampling recorded; seeded replay stable |
| S41 | Order-consistency and isolation diagnostics | Same labels remapped after permutation; disagreement report includes request origins; every extra call consumes budget |
| S42 | Additional System One presets, separately gated per deployment | Each added provider has exact request and response evidence plus capability/coverage tests; incomplete Solar contract stays unsupported; split this checkpoint into provider-sized commits |

S42 candidates: Drex, Kev, Microsoft, Mercury, Liquid, Cloudflare, ScaleDown and
classifier.dev compatibility route. Span-02's new primitive is S46. Shared payload shape
is insufficient for adding an unverified preset; native batching remains deferred.

## M8: Extension contracts, later

Depends on the executable registry proved in S10. Each extension must work as an
independently registered module, without enlarging a closed core answer union.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S43 | multi primitive and Basal handler; optional marginal-only lowering | Independent marginals retain non-unit sum; selection objective is explicit; incompatible joint/subset semantics cannot lower to booleans |
| S44 | Box primitive and TypeSafe 1.14 handler | Inverted/out-of-range coordinates invalid; unsupported deployment fails planning; no fabricated finite distribution or use of label calibration |
| S45 | Observable primitive and Span-01 behavior codec | All three probabilities survive decoding and policy; notObservable is neither false nor refusal; external handler registration proves extensibility |
| S46 | Span-02 number and Basal native tool/act handlers, as separate commits | Number uses native evidence; reasoning deadline differs from HTTP timeout; native act human deferral remains answered; no tool execution; every handler has source fixtures |
| S47 | Tev1 chat-letter handler and logprob evidence contract | Labels/count/letter decoding validated; label-only result cannot auto-qualify from a calibration profile; truncated token logprobs are not represented as a complete outcome distribution |

Extraction remains a candidate extension requiring its own evidence and offset contract;
its presence in provider research does not commit this milestone to implementing it.

## M9: Deferred infrastructure

These checkpoints are outside v1. Each requires a concrete use case and a separate
accepted contract before implementation. Their gates are not prerequisites for S32.

| Step | Deliverable | Acceptance gate |
| --- | --- | --- |
| S48 | Native batch contract and adapter for one deployment | Independent request/state groups remain intact; per-item failure, cancellation, limits and usage allocation tested; no conflation with question merging |
| S49 | Cross-caller batching only if justified by measurements | Collision tests for same question/asset IDs; tenant/auth/settings/policy isolation; cancellation/deadlines and individual accounting; joint groups never merged across callers |
| S50 | Optional gateway design and minimal implementation after requirements are settled | Define tenancy/auth/deployment allowlist first; POST decisions and capability discovery tested over replay; credentials stay server-side; core library remains independent |

## Cross-cutting acceptance rules

- New behavior gets a failing regression before its implementation. Config/docs changes
  use build/schema/lint checks appropriate to the change.
- Every provider/handler has separate golden requests and responses, linked to archived
  source and marked documented, adapted, replayed or live-captured.
- Every capability has a positive and negative case; unknown evidence has an explicit case.
- The planner cannot promise exact token limits from a heuristic, exact wire preview from
  an opaque upstream adapter, or model identity from an unresolved alias.
- Test Effect service lifetimes with real layers and stub transport, not just functions
  returning canned results. Prove both the positive fallback and the captured-provider bug.
- Raw recording is opt-in/redacted. Usage and budgets account for every attempt once.
- Run the relevant `just check`, `just test` and golden checks before each implementation
  step is complete. Broaden testing only for changed contracts or unresolved failures.
- Initial APIs are experimental. Distinguish passing fixtures, live interoperability and
  evaluated model behavior in release notes; none substitutes for the other two.

## Risks and containment

| Risk | Containment |
| --- | --- |
| Effect unstable APIs change | Exact development pin, bridge isolation and an actually tested peer range; ExecutionPlan, `effect/ai` and `effect/http` are `@stability unstable` |
| Layer memoization reuses a captured Engine | Per-call `Engine.layerFor` layers and the S19 enclosing-provide regression |
| Provider documentation differs from live behavior | Conservative capability snapshots and bounded opt-in live verification |
| Joint regrouping or hidden truncation | Atomic groups, evidence-aware limits, strict full-coverage rejection |
| Retry/fallback cost amplification | One retry owner, shared budgets/ledger, explicit whole-decision restart |
| Calibration overclaims automation safety | Separate qualification, grouped holdouts, minimum support and shadow on mismatch |
| Generic inference becomes unwieldy | S3/S9 type gates and an external extension test before Engine expansion |
| Scope expands to all providers/infrastructure | Four-provider v1; later presets, media, batching and gateway explicitly gated |

The first concrete checkpoint remains **S1–S8: a typed, offline TypeSafe fixture example**.
The next is a pure plan that proves semantic grouping before any inference execution exists.
