# 00: Destination for the first implementation

**Date:** 2026-10-18 · **Branch:** `decision-api` (worktree) · **Progress:** [05-progress.md](05-progress.md)

This is the end state the implementation steps move toward. It selects a buildable
subset of [02-solution-design.md](02-solution-design.md); anything not listed here
stays in the design as later work.

## What a user can do at the destination

```ts
import { Effect, Schema } from "effect"
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
  Fallback.run(Fallback.make(TypeSafe, OpenAi))
)
// r.answers.team: Answer<"billing" | "technical">, with evidence, native data and origin
```

## Parts

| Part | Destination |
| --- | --- |
| D1 Domain | `Q` constructors, `Decision.make` with literal inference, ordered entries, duplicate checks, application revision |
| D2 Answers | `answered` / `refused` / `error` answers; finite-distribution and label-only evidence; native fields preserved; per-answer origin |
| D3 Identity | Canonical JSON and SHA-256 identities for definition, input and execution fingerprint |
| D4 Validation | Per-primitive response validation with documented tolerance; score recomputed locally |
| D5 Deployments | Versioned capability snapshots for TypeSafe, Basal, Perplexity and OpenAI with source citations |
| D6 Codecs | System One and OpenAI Decisions codecs; order-preserving serializer; separate request goldens and response fixtures, including live captures |
| D7 Prepare/plan | Effectful `Decision.prepare` (schema encoding services kept in R); pure `Planner.plan` with semantic groups, named lowerings, final-call limits and inspectable preview |
| D8 Transport | One-attempt HttpClient transport per provider; HTTP status → `AiError` reasons with Retry-After; redacted credentials |
| D9 Engine | `Engine.layerFor`, `plan` / `execute` / `decide` / `decideAll`; ledger of every attempt; usage that keeps unknown as unknown |
| D10 Resilience | Budgeted per-call retry (one retry owner), `Fallback.make` with eligibility on every step, nested-memoization regression test |
| D11 Observability | Spans per decision and call, structured logs with annotations, metrics for calls, failures, latency and tokens |
| D12 Testing kit | `@decisions/api/testing`: scripted HTTP, fake provider, fixture helpers |
| D13 Live | Opt-in live suite for TypeSafe, Perplexity and OpenAI; Basal only against a local server |
| D14 Agent DX | Plans and definitions describe themselves as JSON; errors carry an actionable `hint`; an agent guide |

Calibration, qualification, media, programs, batching and the gateway stay in the design as later work.

## Gates

Every step: `just gate` (strict `tsc` on TypeScript 7.0.2 and the offline vitest suite). Behaviour changes start with a failing test.
Steps that touch provider wire formats also run `just live` when credentials exist, and record the result in the progress log.
