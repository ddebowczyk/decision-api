/**
 * Route a support ticket with TypeSafe, falling back to OpenAI.
 * Run: `just example triage` (reads keys from .env; makes one or two paid calls).
 */
import { Effect, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { Decision, Engine, Errors, Fallback, Q } from "@decisions/api"
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

const program = Effect.gen(function*() {
  const r = yield* Engine.decide(Triage, { subject: "Double charge", body: "I was charged twice. Please refund it." }).pipe(
    Fallback.run(Fallback.make(TypeSafe, OpenAi))
  )
  const team = r.answers.team
  // team.value is typed "billing" | "technical"
  const route = team.status === "answered" ? team.value : "manual-review"
  console.log({ route, deployment: r.deployment, model: team.origin.resolvedModel, attempts: r.attempts.length })
  if (team.status === "answered" && team.evidence.kind === "finite-distribution") console.log(team.evidence.probabilities)
}).pipe(
  Effect.catch((e) => Effect.sync(() => console.error(Errors.explain(e)))),
  Effect.provide(FetchHttpClient.layer)
)

Effect.runPromise(program)
