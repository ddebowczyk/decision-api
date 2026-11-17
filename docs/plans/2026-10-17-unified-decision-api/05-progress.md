# 05: Progress log

Each step names the destination part it moves toward ([00-destination.md](00-destination.md)), its gate result and decisions taken.

## Decisions

### Static and runtime capabilities by provider + model (2026-11-03)

- Added public `Capabilities` declarations, keyed by exact provider + model,
  with a static catalog derived from the existing model snapshots and aliases.
  Added metadata for Levanto's wider features with provider support separate
  from adapter support. Unknown feature names remain unknown.
- Application-owned catalogs extend with new declarations and override exact
  pairs without changing global defaults, sibling models or aliases. Limits
  merge by name; primitives replace the list; features merge by name.
  Runtime overrides default to unknown verification unless explicitly supplied.
- Exported Effect schemas and `Capabilities.decode` for JSON metadata. Selected
  declarations are validated at provider construction and planning, including
  positive integer limits so malformed overrides cannot cause partition loops.
- Provider presets accept `capabilities`; the effective declaration is exposed
  on providers, plans and previews. Planning, validation and retries use it.
  Content hashes enter execution fingerprints; engines replan purely and reject
  stale capabilities before HTTP, including when new bounds disallow a decision.
- Undeclared models now require explicit declarations. Updated the artificial
  URL-escaping model fixture and Classifier.dev's intentional bad-model probe
  to declare their test models. Existing deployment overrides and self-hosted
  isolation settings remain effective unless explicitly overridden by a catalog.
- Tests first: initial nine tests failed before implementation; added metadata,
  identical model names on different providers, and restrictive stale-plan
  regressions. Final `just gate`: type-check passed, 232 offline tests passed.
- Final `just live`: 16 passed, four opt-in tests skipped (self-hosted and
  Classifier.dev). Includes live Sage with a runtime one-question-per-call limit:
  three questions answered in three calls. `just example capabilities` passed
  offline and demonstrates JSON metadata controlling a two-call plan.
- `git diff --check` passed. Ripwire quality delta has no gating findings;
  three minor growth findings in existing planner/engine functions, plus two
  type-only dead-code reports for the public `Feature`/`Declaration` interfaces,
  which are used by the implementation and tests. No findings suppressed.
- Limits for request tokens/state characters remain descriptive; feature
  metadata does not implement new codecs or native Levanto operations.

### Levanto Sage support (2026-11-03)

Follow-up full documentation audit: captured all 18 indexed pages and the live
OpenAPI, with URL/timestamp/SHA-256 provenance. The integration is partial; even
SystemOne reasoning is not exposed. The detailed coverage matrix and proposed
completion path are in `research/provider-docs/sources/levanto/README.md`.
Native latency/accuracy controls and compute metadata were found in OpenAPI;
strict question isolation remains unverified. No runtime changes or additional
inference were made during this audit; source hashes and `git diff --check` pass.

- Added `Provider.levanto()` and `Deployment.levanto` using the existing
  SystemOne codec. Primary credential: `LEVANTO_API_KEY`; fallback:
  `SAGE_API_KEY`. Default model: `levanto-sage-2`; alias: `sage-latest`.
- Official SystemOne, batch, limits and OpenAPI documents are captured in
  `research/provider-docs/sources/levanto/` with source URLs and scope notes.
  Independent questions, JSON state, boolean criteria, 256 choices and 26 score
  levels are supported. Descriptions are text (explicit lowering for objects).
  Unknown request bounds stay unknown; 503 is retryable; tolerance is assumed.
- Tests first: five tests failed before the preset existed. Final `just gate`:
  type-check passed, 220 offline tests passed (six new Levanto cases).
- `just live test/live/levanto.test.ts`: 2 passed using the existing `.env`
  credential: triage answered all three primitives in one call; an invalid key
  produced `AuthenticationError`. Snapshot marked `live-tested`.
- Documentation response fixture is labelled `levanto-doc-200`, not a live
  capture. Native extraction, streaming and `/decide` extensions are outside
  the current boolean/choice/score interface.

| # | Decision | Reason |
| --- | --- | --- |
| 1 | Work on branch `decision-api` in a sparse worktree of the `_incubator` repo | `decision_api` was untracked on `main`; one commit per step without touching `main` |
| 2 | TypeScript 7.0.2 | Effect 4 README recommends TS 7; scaffold type-checks and tests on it |
| 3 | Copy only provider keys (TypeSafe, Perplexity, OpenAI, Inception, Together, Respan, OpenRouter, Cloudflare) into git-ignored `.env` | Least exposure; the library reads them through `Config.Redacted` |
| 4 | Treat OpenAI Decisions as `independent` grouping, source `documented` | The guide tells callers to put independent questions in one array and dependent ones in separate requests |
| 5 | Mass on "the input cannot answer this" (RESPAN `p_not_observable`) is kept as `evidence.undetermined`; the distribution and the boolean value become conditional on answerability | RESPAN says to treat it as unknown, not absent. Polyglot reports the raw `p_present`, which mixes "absent" with "cannot tell"; here both facts stay visible |
| 6 | Provider specs come from official docs first; polyglot is a secondary reference | Requested by the user; polyglot-only facts are marked in the step notes |

## Live probes before implementation (2026-10-18)

One small request per hosted provider, all `200`. Captured shapes became fixtures in step 6.

- TypeSafe `jev-latest` resolved to `jev-1.13.0`; choice criteria with keys `"10"`, `"2"` came back in the sent order.
- Perplexity echoes the requested alias (`pplx-decider-latest`), so the resolved model is unknown.
- OpenAI `gpt-6-luna` returned a refusal with `name: null` for an unnamed vague question.
- Error bodies: TypeSafe FastAPI `detail` (401 object, 422 array, 400 unknown model); Perplexity and OpenAI `{ error: { message, type, code, param } }`.

## Live suite results (2026-10-18, `just live`, 6/6)

| Case | Calls | Result |
| --- | --- | --- |
| TypeSafe `jev-latest`, Triage | 1 | resolved `jev-1.13.0`; refund 0.98, team billing, urgency 1; 404/69 tokens; ~280 ms |
| TypeSafe bad key | 1 | `AuthenticationError` |
| Perplexity, Triage with `split-for-isolation` | 3 | resolved model unknown (alias echo); refund 0.998, billing, urgency 1.27; 333/3 tokens |
| Perplexity, joint definition | 1 | refund 0.998, billing |
| OpenAI `gpt-6-luna`, Triage with `stringify-state` | 1 | refund 1, billing, urgency 0.65; 403/0 tokens; ~900 ms |
| Fallback: TypeSafe with a bad key → OpenAI | 2 | attempts `[401 failed, 200 ok]`; answers from OpenAI only |

No answer needed a correction. The failed fallback attempt first recorded `requestId: null`; fixed so failed attempts keep the provider's request id.

## Steps

| Step | Part | Result |
| --- | --- | --- |
| 1 | Scaffold | pnpm workspace, `packages/api`, strict tsconfig, vitest, justfile; `just gate` 1/1 |
| 2 | D1, D2 | `Q.boolean/choice/score`, `Decision.make` with literal inference, `DefinitionError` with hint, answer/evidence types; 11 tests incl. compile-time inference (a wrong expectation fails `tsc`) |
| 3 | D3 | `Wire.obj/stringify/canonical` (entry order kept for `"10"`, `"2"`; sorted plain keys for hashing; non-finite rejected), pure `Identity.sha256` (NIST vectors, matches `node:crypto`), `def1:`/`inp1:`/`exe1:` domain-separated identities; 23 tests; disabling ordered writing fails 2 |
| 4 | D4 | `Validate.answer(question, candidate, tolerance)`: range, known/duplicate/missing outcomes, rescale within tolerance recorded in `corrections`, score recomputed (differing native score recorded), choice label must be a mode, label-only evidence; 14 tests red before implementation, 37 green |
| 5 | D5 | `Deployment` snapshots for TypeSafe, Basal, Perplexity (joint) and OpenAI (independent, documented; no structured state/descriptions) with limits and their evidence, aliases, retryable statuses (none claimed for Basal) and sources; tolerance 1e-3 marked `assumed`; `Deployment.fits`; 45 tests |
| 6 | D6 | `Codec` contract (pure encode/decode, `Candidate`/`Refused`/`Malformed` per question, `CodecError` for the envelope, usage keeps unknown as `undefined`); `SystemOne.codec`; request golden equals the live probe body byte for byte (fails if criteria use a plain object); TypeSafe/Perplexity live captures decode and validate (TypeSafe's rounded score 1.06 vs recomputed 1.05 is recorded as a correction); 14 wire fixtures, bodies only; 57 tests |
| 7 | D6 | `OpenAiDecisions.codec`: ids sent as `name`; answers matched by position (name checked) or by name when counts differ; unnamed refusal attributed by position; object state and predicate criteria rejected (lowering/planner territory); `Deployment.booleanCriteria` added (false for OpenAI, which documents no predicate criteria); live capture and refusal capture decode; 8 tests red first, 65 green |
| 8 | D7 | `Decision.prepare`: `Schema.toCodecJson` + `Schema.encodeEffect`, `PreparationError` with hint and schema cause, `Prepared` with `def1`/`inp1` ids, `Decision.prepare` span; encoding services stay in `R` (type test fails `tsc` when expecting `never`); 69 tests |
| 9 | D7, D14 | Pure `Planner.plan` → `Result<DecisionPlan, PlanError>`: primitive bounds, joint/independent/unknown grouping, named lowerings (`stringify-state`, `stringify-description`, `split-for-isolation`) recorded only when applied, question-count partitioning and body-size repartitioning checked on final bytes, `exe1` fingerprint, deterministic call ids, warnings for unknown limits and assumed tolerance; `Planner.preview` JSON without bodies by default; every `PlanError` has a `reason` and a `hint`; 14 tests red first, 83 green |
| 10 | D8, D12 | `Transport.send` (one attempt, `Effect.fn` span, timeout as `NetworkError`); statuses → `AiError` reasons with the provider message from each live error body (TypeSafe `detail` object/array, `error` objects, Basal `error` string), 413/415/422 as `InvalidRequestError` (upstream `reasonFromHttpStatus` maps them to `UnknownError`), `Retry-After` seconds or date; `Transport.isRetryable` uses the deployment's documented statuses; bearer token from `Redacted`, absent for keyless local servers; `testing/ScriptedHttp` (ordered replies, transport failure, hang, redacted request log); 11 tests, mutating the 422 or Retry-After mapping fails 2; 94 total |
| 11 | D9, D11 | `Provider.make/typesafe/perplexity/openai/basal` (credentials default to `Config.Redacted("<P>_API_KEY")`, read once at layer build; long-context header opt-in); `Engine` service with `Engine.layerFor` (new layer object per call), `plan`/`decide`/`decideAll` (`DecisionIncomplete` with problems, hint and full result), stale-plan check; per-question answers from codec + `Validate` with origin (resolved model `null` on alias echo, per-question lowerings); `Ledger` reference (no-op default, `capture`/`captureExit`); usage summed only when every call reports it; metrics (calls, latency, tokens, answers) and spans (`Engine.decide`, `Decision.prepare`, `Engine.execute`, `Engine.call`, `Transport.send`) with no secret in attributes; typed `team.value` checked at compile time; 109 tests |
| 12 | D10 | Single retry owner in `Engine` (`Effect.retry` + `Schedule.exponential` → `jittered` → `modifyDelay` capping at `retry.max` and honouring a longer `Retry-After`); only `Transport.isRetryable` failures retried (not 401/400, not invalid envelopes, not per-question errors); attempt number per call in ledger and origin; `Budget.limit({ attempts, within })` shared across the scope, nested limits combine, deadline bounds hanging calls and stops a retry that would overrun with `BudgetExhausted` (carrying `lastError`); 11 TestClock tests; ignoring Retry-After fails 2, disabling retry fails 6; 120 total |
| 13 | D10 | `Fallback.make(...engines)` / `Fallback.make({ on }, ...)` on `ExecutionPlan`: one attempt per step, eligibility on every later step (`AiError` moves on; `PreparationError`, `BudgetExhausted`, `DecisionIncomplete`, `ConfigError` stop; `PlanError` only for reasons in `on`); `Fallback.run` captures the ledger so `attempts` span abandoned steps; answers never mix providers; budgets shared across steps; nested-memoization regression tests (outer engine, and the same layer constant outside and inside) fail with a shared-constant `layerFor` (outer Basal answered instead of OpenAI) and pass with `Engine.layerFor`; 128 tests |
| 14 | D12 | `@decisions/api/testing`: `FakeEngine.layer(table \| fn, { fail })` (real planning and validation, canned values, `refused`, `invalid`, `distribution`, ledger entry, provider failure), `Replies.systemOne(definition, values)` typed per question, `ScriptedHttp` from step 10; tests exercise an application function's own branches; 133 tests |
| 15 | D13 | Live suite `test/live/providers.test.ts` (each provider skipped without its key, prints values and request ids, never keys): results above; TypeSafe, Perplexity and OpenAI snapshots marked `live-tested`; failed attempts now keep the provider request id (test red, then green); Basal not run (no local server); 133 offline + 6 live |
| 16 | bridge | `Bridge.layerDecisionModel` / `Bridge.toDecisionModel`: `effect/ai` `DecisionModel` served by the current `Engine` (probability/classify/rate mapped to boolean/choice/score; real planning and validation); refused, invalid and label-only answers fail with `InvalidOutputError` naming the question, since upstream answers cannot express them; plan/budget errors mapped to `AiError`; `supportsImages: false`. The reverse direction (`Provider.fromDecisionModel`) is not built; 135 tests |
| 17 | D14 | `Decision.describe` (definition as JSON with ids, outcomes and value meaning) and `Errors.explain` (`{ tag, message, hint, retryable }` for `AiError` reasons, tagged library errors and unknown values); tests red first (4), then green; `examples/` type-checked by `just check`: `preview` (definition and per-deployment plan or `PlanError` hint, no network), `testing` (`FakeEngine` drives both branches of an app function), `triage` (live: TypeSafe → OpenAI fallback, resolved `jev-1.13.0`, team billing with `{ billing: 1, technical: 0 }`, 1 attempt); package `README.md` and agent guide `AGENTS.md`; 139 tests |
| 18 | providers | Endpoint infrastructure for the next providers: `Deployment.auth` (`bearer` or the raw key in a named header), `{model}` in the path (per call, URL-encoded), `{name}` placeholders in the base URL filled from `Provider.urlParams` (`Provider.param("ENV")` or a literal, read once at layer build); `Provider.make` throws `ProviderError` with a hint for a placeholder with no value; `ScriptedHttp` redacts every credential-bearing header (`*api-key*`, `*token*`, `*secret*`, cookies), not only `authorization`; 6 tests red first, 145 green |
| 19 | providers | `Validate`/`Evidence`: optional `undetermined` mass (outcomes + undetermined must sum to 1 within tolerance; all-undetermined is invalid, never a guess); 402 → `QuotaExhaustedError` with the provider message in metadata; string `detail` error bodies; `x-respan-log-id` and `cf-ray` as request ids; 7 tests red first, 153 green |
| 20 | RESPAN | `Respan.codec` from the official OpenAPI (`Span1ScoreRequest`/`Span1ScoreResponse`): boolean questions as behaviors (criteria appended as `Present when:` / `Absent when:` lines, a polyglot convention since the API has no criteria field), `p_not_observable` as undetermined mass, results matched by id (duplicates malformed), input-tokens-only usage, tolerant of additive fields; `Respan.Span` input schema; codec `preflight` hook → `PlanError` `provider-constraint` with a hint (span shape, definitions of at least 3 characters); codec registry; `Deployment.respan` (independent per the concept doc, retry 424/429/503/504) and `Provider.respan`; float32 rounding (≤ 1e-6) no longer reported as a correction (red first: live RESPAN answers all carried 1e-8 "renormalized" notes); live: 3 behaviors answered in one call, ~450 ms, 110 input tokens, bad key → 403 `AuthenticationError`; 167 tests |
| 21 | Clef, Fastino | `Deployment.envelope` (`none` \| `cloudflare`): the transport unwraps Cloudflare's `result` and fails `success !== true` (also on HTTP 200) with the envelope's `errors[]`; error bodies with `errors: [{ code, message }]` and top-level `{ code, message }`; 425 (model warming) → `RateLimitError` carrying `Retry-After`; System One score answers use `expected_level` as the native score when present (Fastino's `score` is the integer argmax); snapshots `clef` / `clef-flash` (joint per the launch post, 64 questions, 255 options, 10 levels, 13 MiB, 65,536 / 24,576-token windows, tolerance 0.0128 for 4-decimal rounding, assumed) and `fastino` (`X-API-Key`, independent, text descriptions, 255 options and levels, 40,000 tokens per rendered prompt, retry 425/429/502/503); `Provider.clef({ model })` (token `CLOUDFLARE_API_TOKEN`, `account_id` from `CLOUDFLARE_ACCOUNT_ID`) and `Provider.fastino` (300 s timeout, as recommended); 19 tests red first, 186 green; live: clef and clef-flash answer triage in 3 isolated calls (165–357 ms, cf-ray ids), Fastino in one call (459 ms, resolved `glide_v2`), no corrections, bad keys → `AuthenticationError` with the provider message |
| 22 | Jeff, Laya | Self-hosted System One servers, from upstream sources (jeff @34b32f9, laya-serve @d74e8be) with typed-decision-lab as a second target: `Deployment.jeff` (joint: upstream `JEFF_ISOLATE=nouls` scores choice and score together), `jeffIsolated` (`JEFF_ISOLATE=all`), 64 questions/labels, 20,000 state chars, retry 429/529; `Deployment.laya` (independent rows, 100 options, 32 levels, 64 questions, 1 MiB conservative body, retry 408/429/502/503/504); `Provider.jeff({ baseUrl, isolate })`, `Provider.laya({ baseUrl })`, no key unless given; `retry-after-ms` honoured when `Retry-After` is absent; `error.code` used when `error.type` is missing; 429/425 keep the provider message in metadata; laya-serve's extra fields (`routing`, `answer_confidence`, `x_jev_confidence`, `action`) kept as native fields; 15 tests red first, 201 green; live (local, loopback): Laya via the lab (MLX, 72 ms, one call), upstream Jeff with defaults (3 isolated calls, ~590 ms; T=3.2 native score 1.8795 vs probabilities 1.3633 recorded as a correction, as documented) and with `JEFF_ISOLATE=all JEFF_TEMPERATURE=1` (one call, 324 ms, no corrections) |
| 23 | Classifier.dev | `ClassifierDev.codec` from the official OpenAPI (`ClassifyRequest` dimensions mode, `DimensionResult`): one text item, positional dimensions `q0..` mapped back to question ids, booleans as `yes`/`no`, scores as `level <i>: <level>`, options as `id` / `id: description` (polyglot conventions; the API only has choices), `share_data: false` always (the API retains requests for training by default), no `Idempotency-Key` (a reused key is a 409, not a replay, so retries would fail); null (unscored) or unknown-label scores malformed per question, one result row required; provider confidence (a top-1 minus top-2 margin) kept native; usage tokens decoded; preflight: distinct labels, ≤200 characters, instructions ≤4,000, input 1..32,000 characters; `{ error, code }` bodies → `code: error`; `Deployment.classifierDev` (independent, 20 dimensions per call, 100 labels, text input only, tolerance 0.02 assumed for two-decimal scores, retry 429/500/502/503) and `Provider.classifierDev` (keyless by default); 13 tests red first, 214 green; live (keyless): triage in one call, 2.2 s, resolved `jev-1.13.0`, 558/146 tokens, no corrections; unknown model → `InvalidRequestError` `bad_model` |
| 24 | Decision model integration | `Bridge` settles per question: refusal → upstream `Refusal`, invalid → left out (`Missing`), label-only → no probabilities (`NoDistribution`), status/problem/origin in `metadata["@decisions/api"]` (`Bridge.metadataOf`), `modelId` and request id set. `Engine.local({ deployment, model, provider, answer, usage, fail })`: offline engine with the real planner and validator, `answer` sees definition, question id, question and input; `FakeEngine.layer` now built on it, function tables get the question, `distribution(p, { confidence })`. `wireIds: "neutral"` on `Provider`/`Planner.Options`: `q0…` on the wire, caller ids in answers, origins and ledger, part of the fingerprint, `plan.wireIds`. `Errors.classify`: `unavailable`/`exhausted`/`rejected`/`misconfigured` with `source`, `status`, `retryable`. Option order tested on every choice-capable codec with integer-like labels. Version 0.2.0; 254 tests |

## Package layout verification

On 2026-11-17, the source and offline tests were grouped by responsibility.
Provider presets and deployment snapshots moved into provider directories,
alongside provider-specific codecs where applicable. All three package entry
points, all 11 preset configurations, deployment snapshots, and the built-in
capability catalog matched the prior revision in a before-and-after comparison.
`just gate` passed 254 offline tests. `just live` passed 16 live tests and
skipped 4 under the suite's environment gates.

## Native capabilities and release 0.3.0

1. Jev 1.13 and 1.14 accept typed PNG and JPEG input. A live boolean request
   on pinned 1.14 answered a synthetic visual question. Fixtures cover the
   Jev 1.14 Box wire format and normalized coordinates.
2. The planner checks state length and estimates request and per-question
   context separately. Preview surfaces the estimate and possible truncation.
   Jev image token costs remain unknown.
3. Clef and Clef Flash encode image payloads. A live Clef request answered the
   same visual question. Offline fallback tests verify that the surviving
   provider receives the image and text-only fallbacks fail before HTTP.
4. Sage native abstention stays distinct from refusal and preserves answered
   siblings in fixtures. A live native request returned a typed decision and
   reasoning metadata. In a six-case paired synthetic run both modes scored
   6/6. Median latency was 358 ms with reasoning off and 1,074.5 ms with
   reasoning on. Reported input/output tokens totaled 494/0 and 1,420/181.
   The run does not establish a quality difference.

`just gate` passed 268 offline tests. `just live` passed 19 tests and skipped 4.
The packaged JavaScript loaded from all three entry points in a clean install.
