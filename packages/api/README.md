# @decisions/api

Typed questions to decision models on Effect v4: TypeSafe, Levanto Sage, Perplexity, OpenAI Decisions, RESPAN, Cloudflare Clef, Fastino, Classifier.dev, and self-hosted Jeff, Laya and Basal.
Answers carry their evidence, so you can see how each one was reached and from which model.

```ts
import { Effect, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { Decision, Engine, Fallback, Q } from "@decisions/api"
import { Provider } from "@decisions/api/providers"

const Triage = Decision.make("ticket-triage", {
  revision: "1",
  input: Schema.Struct({ subject: Schema.String, body: Schema.String }),
  questions: [
    ["refund", Q.boolean("Is the customer asking for money back?")],
    ["team", Q.choice("Which team should own this?", [
      ["billing", "Charges, invoices, refunds"],
      ["technical", "Bugs, outages, error messages"]
    ])],
    ["urgency", Q.score("How urgent is it?", ["routine", "soon", "immediate"])]
  ]
})

const TypeSafe = Engine.layerFor(Provider.typesafe({ model: "jev-latest" }))
const OpenAi = Engine.layerFor(Provider.openai({ allow: ["stringify-state"] }))

const program = Engine.decide(Triage, { subject: "Double charge", body: "Charged twice" }).pipe(
  Fallback.run(Fallback.make(TypeSafe, OpenAi)),
  Effect.provide(FetchHttpClient.layer)
)
```

`r.answers.team` is an `Answer<"billing" | "technical">`:

- `status: "answered"`: has `value`, `evidence` (a `finite-distribution` with `probabilities`, or `label-only`), any `corrections` validation made, and `origin` (deployment, requested and resolved model, call id, attempt, lowerings).
- `status: "refused"`: has the provider's `reason`, if it gave one.
- `status: "error"`: has a `problem`, for example "probabilities sum to 0.91".

Answers that are refused or invalid are values in the result. Failures of the call itself (network, auth, rate limit, provider error) go to the error channel as `AiError`, where retry and fallback handle them.

## Concepts

| Module | Purpose |
| --- | --- |
| `Q`, `Decision` | Define questions. `Decision.make` infers outcome literals; `Decision.describe` returns the definition as JSON |
| `Deployment` | Versioned capability snapshots: grouping, limits, aliases, retryable statuses, sources |
| `Capabilities` | Static declarations by exact provider + model, JSON metadata validation, runtime catalog overrides, extensible feature metadata |
| `Planner` | Pure `plan(prepared, deployment)`: a `Result` with the calls to send, or a `PlanError` with a `reason` and a `hint`. `preview` gives JSON |
| `Provider` | One preset per provider (see below) and `make`: deployment + model + credentials + URL parameters + retry + timeout |
| `Engine` | `layerFor(provider)`, `decide`, `decideAll`, `plan`, `execute`; `local({ deployment, model, answer })` answers offline from a function with the real planner and validator |
| `Budget` | `Budget.limit({ attempts, within })`: a limit shared by every call, retry and fallback step inside it |
| `Fallback` | `make(...engines)` and `run(chain)`. Each step makes one attempt and the answers never mix providers |
| `Ledger` | Every attempt: status, request id, duration, usage, error. `Ledger.capture(effect)` |
| `Errors` | `explain(error)`: `{ tag, message, hint, retryable }` for any error the library raises; `classify(error)`: `unavailable`, `exhausted` (budget), `rejected` or `misconfigured`, with `source` and HTTP `status` |
| `Bridge` | Serves `effect/ai`'s `DecisionModel` from the current `Engine`. Each question settles on its own: a refusal is an upstream `Refusal`, while abstentions and invalid answers are upstream `Missing`. The original status, problem and origin are in `metadata["@decisions/api"]` (`Bridge.metadataOf`) |

## Configuration

Keys and URL parameters come from `Config` (the variables in the table below) when the layer is built. Pass `apiKey` to a preset to override, or provide a `ConfigProvider` layer. Keys stay `Redacted`, and spans, logs, ledger entries and recorded test requests never contain them.

```ts
Provider.typesafe({
  model: "jev-1.14.0",              // pin it; "jev-latest" is an alias
  longContext: true,                // opt-in header for large states
  retry: { times: 3, base: "500 millis", max: "20 seconds" },
  timeout: "30 seconds",
  concurrency: 8
})
```

`wireIds: "neutral"` sends `q0`, `q1`, … instead of your question ids, so ids that carry meaning never reach the provider; answers, origins and the ledger keep your ids.

Providers differ, and the planner fails rather than hiding a difference. Perplexity lets questions in one call see each other: independent questions need `allow: ["split-for-isolation"]`. OpenAI takes text state only: object inputs need `allow: ["stringify-state"]`. Every lowering that gets applied is recorded on the plan and on each answer's origin.

## Providers

| Preset | Configuration | Questions in one call | Notes |
| --- | --- | --- | --- |
| `Provider.typesafe()` | `TYPESAFE_API_KEY` | independent | `longContext: true` for large states |
| `Provider.levanto()` | `LEVANTO_API_KEY` (or `SAGE_API_KEY`) | independent | SystemOne; `levanto-sage-2` default or `sage-latest`; 256 choices, 26 score levels |
| `Provider.perplexity()` | `PERPLEXITY_API_KEY` | joint: `split-for-isolation` | |
| `Provider.openai()` | `OPENAI_API_KEY` | independent | text state: `stringify-state` |
| `Provider.respan()` | `RESPAN_API_KEY` | independent | boolean only, input `Respan.Span`; `p_not_observable` is `evidence.undetermined` |
| `Provider.clef({ model: "clef" \| "clef-flash" })` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | joint: `split-for-isolation` | Workers AI envelope unwrapped; text state over the window is truncated by the provider |
| `Provider.fastino()` | `FASTINO_API_KEY` (`X-API-Key`) | independent | text descriptions; 300 s timeout; 425 (warming) retried after `Retry-After` |
| `Provider.classifierDev()` | none; `apiKey` optional | independent, 20 per call | text input; sends `share_data: false` |
| `Provider.jeff({ baseUrl, isolate })` | self-hosted, key optional | `isolate: "nouls"` (upstream default) joint, `"all"` independent | run with `JEFF_TEMPERATURE=1` for consistent scores |
| `Provider.laya({ baseUrl })` | self-hosted, key optional | independent | `laya-serve` or typed-decision-lab |
| `Provider.basal({ baseUrl })` | self-hosted, key optional | independent | |

Each preset's snapshot (`Deployment.<name>`) lists its limits, tolerance, retryable statuses and the official sources it was built from.

## Images and provider-specific decisions

Pass ordered PNG or JPEG images with the prepared input. For example, a
decision named `visualQuestion` can use the same PNG with Jev or Clef.

```ts
Engine.decide(visualQuestion, "Inspect the attached image.", {
  images: [{ format: "png", dataBase64 }]
})
```

Use a pinned Jev 1.14 or 1.13 deployment, or Clef or Clef Flash configured
with `allow: ["split-for-isolation"]` for independent questions. Jev 1.14
also supports `Q.box(instructions)`, which returns normalized bounding-box
edges. The planner rejects incompatible image inputs before HTTP, including
during fallbacks. The Effect AI bridge currently handles text questions.

`Provider.levanto({ mode: "native", reasoning: "on" })` selects native Sage
with typed reasoning (`"off"`, `"auto"` or `"on"`). To require native
abstention for boolean or choice questions, pass
`{ requireNativeAbstention: true }` to `Engine.decide`. A provider
abstention appears as `status: "abstained"`. Sage's default SystemOne endpoint
supports reasoning and always returns a result. Structured descriptions on
SystemOne require `allow: ["stringify-description"]`.

## Capabilities by provider and model

`Capabilities.builtIn` is a static, JSON-serializable catalog. Each declaration
identifies an exact `provider` and `model`, a version, sources and verification,
the capabilities used by the adapter, and extensible feature metadata.
`Capabilities.get(catalog, provider, model)` performs an exact lookup. Provider
ids come from the snapshot's `provider` field, such as `levanto`, `typesafe` and `cloudflare`; model aliases
have separate entries from pinned model names.

```ts
import { Capabilities, Decision, Planner } from "@decisions/api"
import { Provider } from "@decisions/api/providers"

const catalog = Capabilities.override(
  Capabilities.builtIn, "levanto", "levanto-sage-2", {
    version: "my-configuration-1",
    verification: "unknown", // application-owned override, not a live test
    capabilities: {
      limits: { questionsPerCall: { value: 1, evidence: "conservative-bound" } }
    },
    features: {
      "my-app.audit": { support: "supported", adapterSupport: "unknown" }
    }
  }
)

const provider = Provider.levanto({ model: "levanto-sage-2", capabilities: catalog })
console.log(provider.capabilities) // resolved declaration, no keys or network

// Inside an Effect program, using the earlier Triage definition:
const prepared = yield* Decision.prepare(Triage, input)
const plan = Planner.plan(prepared, provider.deployment, {
  model: provider.model, capabilities: [provider.capabilities]
})
```

Overrides return a new catalog. Limits merge by name, primitives replace the
whole list, and features merge by name with each feature's metadata replaced.
Later catalog entries win for the same pair. An override for one model never
affects another model, another provider, or an alias. An absent pair in a custom
catalog falls back to the selected deployment's declared models or the built-in
exact pair. Existing `Deployment.with(...)` settings, including self-hosted
isolation, are honored unless an explicit catalog entry overrides them.
Overrides default to `verification: "unknown"`; callers can supply verification
and sources appropriate to their adjusted declarations.

To add a model, append a full `Capabilities.Declaration`. Use
`Capabilities.declare(deployment, "my-model")` as an explicit starting point,
then adjust its fields and provenance. Unrecognized models require a declaration;
they no longer silently inherit another model's capabilities. A declaration is
the caller's assertion about that model, not a check that the provider serves it.

For metadata loaded at runtime, `Capabilities.decode(parsedJson)` returns a
`Result` containing a validated catalog or a schema error. `CatalogSchema` and
`DeclarationSchema` are exported Effect schemas. Invalid bounds, missing fields
and unknown fields are rejected; constructors and the planner validate selected
declarations too. Code declarations can use `satisfies Capabilities.Declaration`.

Features have independent `support` and `adapterSupport` values:
`supported`, `unsupported` or `unknown`, plus optional JSON `constraints`.
Applications can add feature names without changing the library. An absent name
means unknown. For example, Sage exposes extraction and streaming upstream,
while this adapter implements typed reasoning and native abstention for its
supported question kinds. Enabling a request option also requires a codec
that implements it.

Providers select capabilities at construction. To apply changes, build a new
provider/engine with the updated catalog; no shared global registry is mutated.
Planning, answer validation and retry use the selected capabilities. Plans and
`Planner.preview` expose the exact declaration, and execution fingerprints hash
its content even when its version is unchanged. Engines reject older plans
before HTTP. The planner enforces documented state-character, question-count and body-byte
bounds. It checks per-question and request-wide context limits with a UTF-8
byte heuristic. Preview reports these estimates, possible provider truncation
and any image token costs missing from the estimate.

Run `just example capabilities` for an offline example.

## Resilience

- **Retry:** the `Engine` is the only thing that retries. It retries each call with exponential, jittered backoff up to `retry.max`, honours `Retry-After`, and retries only statuses the deployment documents as retryable, plus transport failures.
- **Budget:** `Budget.limit({ attempts: 6, within: "20 seconds" })` fails with `BudgetExhausted` (carrying `lastError`) rather than starting a retry it cannot finish.
- **Fallback:** moves to the next engine on any `AiError`. It moves on a `PlanError` only for the reasons you list in `on`. It stops on input errors, budget exhaustion and incomplete answers.

## Observability

- **Spans:** `Engine.decide`, `Decision.prepare`, `Engine.execute`, `Engine.call`, `Transport.send`, `Fallback.run`.
- **Metrics:** `decision_calls_total`, `decision_call_duration_ms`, `decision_tokens_total`, `decision_answers_total`.
- **Logs:** annotated with the decision, deployment, call id, attempt, status and request id.

Provide your own `Tracer` or OpenTelemetry layer to export them.

## Testing

```ts
import { FakeEngine, ScriptedHttp, Replies } from "@decisions/api/testing"

route(ticket).pipe(Effect.provide(FakeEngine.layer({ team: "technical" })))
route(ticket).pipe(Effect.provide(FakeEngine.layer({ team: FakeEngine.refused("policy") })))
```

- `FakeEngine` runs real planning and validation over canned answers. A function table gets `(id, input, question)`; options set `model`, `provider`, `usage` and `fail` (an `AiError` or `BudgetExhausted`). It is `Engine.local` with a test deployment.
- `ScriptedHttp` replays status codes, bodies, transport failures and hangs against a real engine, and records requests with the authorization header redacted.
- `Replies.systemOne(definition, values)` builds provider bodies, typed for each question.

## Examples and commands

| Command | What it does |
| --- | --- |
| `just example preview` | Definition and plans as JSON. No network |
| `just example testing` | Application code tested with `FakeEngine` |
| `just example triage` | Live: TypeSafe with a fallback to OpenAI (needs keys in `.env`) |
| `just example sage-reasoning` | Live: paired Sage reasoning comparison on synthetic examples |
| `just gate` | Type-check plus the offline suite |
| `just live` | Live provider suite (costs money; skips any provider without a key) |

See [AGENTS.md](AGENTS.md) for the agent guide and the [operations guide](../../ops/README.md) for versioning, packaging and release commands.
