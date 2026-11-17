# 01: Concept and developer experience

All APIs below are **proposed**, including library helpers and imports. No library
code exists. Effect integration targets the inspected 4.0.5 API; examples describe
contracts that the implementation's type tests must validate.

## 1. Problem and scope

Decision APIs answer typed questions about application state. Similar payloads conceal
important differences: independent versus joint questions, native confidence meanings,
missing probabilities, refusal, truncation, image placement, billing and drifting model
aliases. Extensions include boxes, extracted values and numeric estimates, which cannot
all be represented as distributions over finite labels.

The library provides typed definitions, explicit capabilities, inspectable plans,
per-answer provenance, deterministic tests, and application-owned policy. Selecting a
provider is a layer change only when that deployment supports the requested semantics.

The first release is a library for TypeSafe, Basal, Perplexity and OpenAI. Node is the
first runtime gate; Bun follows. Pure core and injected HTTP transport should remain
portable to Workers. A gateway, cross-caller batching, additional provider presets,
media extensions and program combinators are later work. Text generation and tool
execution are outside scope; a tool decision selects a tool but never executes it.

## 2. Principles

| Principle | Consequence |
| --- | --- |
| Typed value plus explicit evidence | A label-only answer remains label-only; no invented distribution or confidence |
| Preserve semantics | Joint groups stay together; order matters; lossy rewrites require named opt-ins |
| Inspect before execution | Prepared plans expose bodies, semantic groups, lowerings, limits and uncertain estimates |
| Trace every answer | Each answer links to the actual deployment, call, attempt, evidence transform and policy evidence |
| Pure planning | Schema encoding, files, identifiers and profile loading happen at effectful boundaries |
| Qualify policy separately | A calibrated probability alone does not authorize automation |
| Failures have explicit ownership | Transport errors drive retries; refusal and invalid answers require result inspection |

## 3. Define a decision

```ts
import { Schema } from "effect"
import { Decision, Q } from "@decisions/api"

export const Triage = Decision.make("ticket-triage", {
  revision: "1",
  input: Schema.Struct({
    subject: Schema.String,
    body: Schema.String,
    plan: Schema.Literals(["free", "pro"])
  }),
  mode: "independent",
  questions: [
    ["refund", Q.boolean("Is the customer asking for money back?")],
    ["team", Q.choice({
      instructions: { question: "Which team should own this?", inspect: "body" },
      options: [
        ["billing", { what: "Charges, invoices, refunds", not_for: ["pricing questions"] }],
        ["technical", "Bugs, outages, error messages"],
        ["sales", null]
      ]
    })],
    ["urgency", Q.score("How urgent is it?", ["routine", "soon", "immediate"])]
  ]
})
```

Const-generic constructors retain literal question IDs, option labels and level labels.
Ordered entry arrays avoid JavaScript's numeric object-key reordering. Duplicate IDs or
labels fail definition validation. A codec must preserve the order on the wire or reject
the request; it cannot silently rebuild ordered options as a JavaScript object.

`revision` is application-owned: change it when input encoding or other behavioral code
changes. Hashes also cover the serialized question specifications, primitive versions,
order, mode and prepared asset digests. They do not pretend to hash arbitrary functions.
Descriptions may be strings or structured JSON trees. Stringifying a structured
description is an explicit named lowering, even when the complete text is retained.

## 4. Ask and inspect the answer

```ts
import { Effect } from "effect"
import { Engine } from "@decisions/api"

const input = { subject: "Double charge", body: "I was charged twice", plan: "pro" as const }
const program = Effect.gen(function*() {
  const r = yield* Engine.decide(Triage, input)
  const team = r.answers.team
  if (team.status === "answered") {
    team.value                         // "billing" | "technical" | "sales"
    if (team.evidence.kind === "finite-distribution") {
      team.evidence.probabilities.billing
    }
    team.origin.callId                 // links to r.meta.calls and attempts
    team.origin.resolvedModel          // string | null, never inferred from an alias
  }
  r.meta.usage                          // unknown usage remains unknown
  return r
})
```

`boolean` returns the probability of true as its numeric value; it does not implicitly
apply an action threshold. `choice` returns a label; `score` returns an expected ordinal
index when a distribution is present. The answer also carries its evidence and native
fields. A score derived from probabilities is recomputed locally; an inconsistent native
score is retained only as diagnostic data.

`Engine.decideAll(Triage, input)` returns the plain values after requiring every answer
to be answered. Its error channel includes preparation, planning and transport errors,
plus `DecisionIncomplete` for refusals or invalid answers. It does not implicitly retry
a refusal or give policy permission to act on those values.

The `{ answers, meta }` envelope avoids reserving a question name such as `$meta`.
Metadata includes all attempts, even when their results were discarded by fallback.

## 5. Choose a provider and build the Engine

```ts
import { Config, Effect, Layer } from "effect"
import { Engine } from "@decisions/api"
import { Provider } from "@decisions/api/providers"

const TypeSafe = Provider.typesafe({
  model: "jev-latest",
  apiKey: Config.Redacted("TYPESAFE_API_KEY")
})
const Basal = Provider.basal({
  baseUrl: "http://localhost:8000",
  model: "basal-2.0"
})

const TypeSafeEngine = Engine.layerFor(TypeSafe)
const BasalEngine = Engine.layerFor(Basal)
program.pipe(Effect.provide(TypeSafeEngine))
```

Provider layers supply Provider, not Engine. Engine construction captures its Provider;
fallback therefore needs a freshly constructed Engine for each step. Config, HTTP client
and any other layer requirements must also be supplied by the application.

`Engine.layerFor(provider)` returns a new layer object on every call. That is deliberate:
Effect v4 memoizes layers by identity, and a nested `Effect.provide` reuses a layer that
an enclosing `provide` already built. A single shared `Engine.layer`, composed as
`Engine.layer.pipe(Layer.provide(p))`, would be built once by an application-level
provide and then reused inside every fallback step with the first captured provider.
A reused `layerFor` constant is still built only once.

The structured `team` description works natively on TypeSafe. A Basal deployment that
only accepts strings needs an explicit `stringify-description` permission. Merely
swapping the layer must not silently change the definition.

## 6. Prepare, plan, inspect, execute

```ts
const prepared = yield* Decision.prepare(Triage, input)
const plan = yield* Engine.plan(prepared, {
  allowLowerings: ["stringify-description"],
  splitForIsolation: true,
  coverage: "require-full"
})
plan.calls              // ordered, immutable calls with semantic group membership
plan.preview            // native adapters: exact body and semantic headers, auth redacted
plan.lowerings          // named transformations, affected questions and versions
plan.limitEvidence     // exact counts, conservative bounds, estimates or unknowns
plan.estimate          // cost estimate or unknown, never a promise of actual usage
const r = yield* Engine.execute(plan)
```

`Decision.prepare` is effectful: it actually encodes through the input schema, resolves
media and assigns stable references. Its Effect requirements include the schema's
encoding services and the configured asset services. It does not call an inference API.
`Planner.plan(prepared, deploymentSnapshot, options)` is pure. `Engine.plan` delegates to
it using the configured provider. `Engine.decide` composes preparation, planning and
execution as a convenience.

`Engine.execute` verifies that a plan belongs to its deployment/configuration snapshot.
It sends that plan without silently replanning. `Engine.verify` checks static definition
compatibility; it cannot validate input size or media that have not been prepared.
Upstream `effect/ai` adapters expose logical plans, because they cannot promise the
exact underlying wire body. Preview availability is explicit.

Independent questions can be partitioned to satisfy limits. On Perplexity V1.2 they
need isolated calls to preserve independence, enabled by `splitForIsolation`. A joint
definition is one atomic semantic group. If it does not fit a single supported group,
planning fails; question-count or cost optimization never splits it.

## 7. Media, later

```ts
const photo = yield* Media.fromFile("parcel.jpg")
const example = yield* Media.fromFile("fixtures/crushed.jpg")
const prepared = yield* Decision.prepare(Inspect, { photo }, {
  assets: { "example-crushed": example }
})
```

Definitions contain asset references; preparation supplies materialized bytes and
verified digests. File I/O is never embedded in a pure definition constructor. The
planner checks placement and encoded sizes per deployment: TypeSafe asset references,
Perplexity inline parts, and other providers' top-level lists remain distinct. A
criteria image on a deployment that only accepts state images is rejected. Box answers
carry coordinates and optional native evidence; they do not acquire label distributions.

## 8. Calibration and automation qualification

```ts
const calibrated = Calibration.apply(team, matchingProfile)
const recommendation = Policy.evaluate(calibrated, {
  qualification: matchingQualification,
  costs: routingCosts,
  onUnqualified: "shadow"
})
// { mode: "shadow" | "qualified", action, expectedCosts, evidence, reason }
```

These are pure operations after profiles and evaluation evidence have been loaded.
Calibration preserves raw evidence, produces a separately identified calibrated view,
and recomputes derived values. Supported evidence is required: a label-only answer
cannot be turned into a per-example probability by attaching a profile.

A qualification records an application risk target, policy/threshold version, evaluation
population, held-out sample support and an acceptance criterion such as an upper bound
on error among accepted decisions. Calibration fitting, threshold selection and final
qualification use separate groups or an explicitly justified statistical procedure.
Records from one customer or document must not leak across those splits.

A missing, mismatched, expired or insufficient qualification leaves policy in shadow
mode: it may recommend an action but does not authorize automatic execution. Matching
includes actual question grouping, order, lowerings, model identity, settings and coverage.
Unknown model revision or coverage requires explicit treatment in the qualification;
matching an alias string alone is insufficient. Production monitoring and requalification
remain necessary after deployment changes or distribution shift.

Basal's native `act` deferral is an answered decision to use a human, with expected costs
and native details. It is not a model refusal. Local policy likewise keeps `deferred`
separate from the inference answer's status.

## 9. Retry and fallback

```ts
import { ExecutionPlan, Schedule } from "effect"
import { Retry } from "@decisions/api"

const fallback = ExecutionPlan.make(
  {
    provide: TypeSafeEngine,
    attempts: 3,
    schedule: Retry.schedule({ backoff: Schedule.exponential("200 millis") }),
    while: (error) => Retry.isEligible(error)
  },
  {
    provide: BasalEngine,
    attempts: 1,
    while: (error) => Retry.isEligible(error)
  }
)

// Engine is resolved inside each step; no Engine is provided outside this plan.
const result = yield* Engine.decide(Triage, input, {
  allowLowerings: ["stringify-description"],
  retry: "none"
}).pipe(Effect.withExecutionPlan(fallback))
```

`Retry.isEligible` is a proposed library predicate over the full error union, not an
assumption that every error has `isRetryable`. Apply an eligibility predicate to every
step: in Effect 4.0.5 a later step's predicate gates entry using the preceding failure.
The first step's predicate alone does not prohibit fallback on a terminal error.
`attempts` counts total attempts within a step, including the first. A step with a
`schedule` but no `attempts` retries for as long as its `while` predicate holds, so
always bound it. The example uses plan-level retries and explicitly disables per-call retries to avoid
multiplying attempts. The proposed `Retry.schedule` combines backoff with Retry-After;
all attempts also consume the shared budget. Separate predicates may allow named planning
failures to advance to another provider while keeping them ineligible for same-provider retry.

Fallback reruns the whole decision with the next provider after an eligible failed
Effect. Already completed calls from an abandoned attempt are not mixed into the final
result, but remain in the execution ledger. Each step prepares/plans against its own
provider. A refused or invalid answer is a successful result value and does not trigger
`Effect.retry` or `ExecutionPlan`. Explicit application escalation can inspect these
values and request a new whole decision. Joint groups are never retried as fragments.

Retries can duplicate billing and can produce different judgments. Attempt, latency and
cost budgets apply across steps and retries, including failed or cancelled calls whose
usage is unknown. The execution ledger and budget live outside the per-step Engine.

## 10. Extensions, interop and testing

An extension supplies a primitive's schemas and pure validator plus a versioned handler
for each supported dialect. Optional derivation, metrics and calibration registrations
must state their evidence requirements. Registering a name or schema alone does not
make a provider able to encode that primitive.

`Provider.fromDecisionModel` requires explicit capabilities. Upstream `DecisionModel`
covers probability/classify/rate; media support depends on the adapter. It exposes
answers and token usage, not arbitrary raw HTTP data or resolved checkpoint metadata.
Those fields stay unavailable. `Engine.toDecisionModel` supports the same subset and
explicitly maps a partial result to the upstream whole-call failure contract.

Start tests with request goldens and independent response fixtures from the captured
provider documentation. Record/replay keys include prepared input and execution
fingerprints; use synthetic inputs by default and opt-in redacted recordings. A recorded
response proves decoding behavior, not model accuracy or calibration. The first S1–S8
result is an offline typed triage example derived from documented TypeSafe fixtures.

Later program helpers are ordinary Effect code with explicit budgets. A taxonomy path's
product of step probabilities is a path score unless the conditional semantics and
calibration required for a probability interpretation have been established.

## 11. Error and result glossary

| Item | Meaning and handling |
| --- | --- |
| `PreparationError` | Input encoding or asset resolution failed; Effect error, no inference call |
| `PlanError` | Unsupported primitive/mode/lowering, unverified required coverage or exceeded limit; Effect error |
| `AiError` | Transport, HTTP or unusable whole response; stays in Effect's error channel during resilience |
| `BudgetExceeded` | Further attempts would exceed execution budget; terminal Effect error |
| `status: "refused"` | Model declined this question; result value, inspect explicitly |
| `status: "error"` | This question's answer was missing or invalid in an otherwise usable response; result value |
| `DecisionIncomplete` | Strict projection rejected a partial result; terminal unless application explicitly escalates |
| Deferral | A completed policy/native-act decision to ask a human, not an inference refusal |
| Lowering | Named, versioned semantic rewrite authorized by the caller and recorded in provenance |
| Execution fingerprint | Identity of the definition, grouping, deployment, settings and transformations relevant to behavior |
| Qualification | Evidence supporting a particular automation policy on a declared population and risk target |

Use Effect error handlers for failures in the error channel; use ordinary branching on
answer statuses for successful partial results. A refusal is not caught by `catchTag` or
`catchReason` until an explicit projection has converted it into a typed failure.
