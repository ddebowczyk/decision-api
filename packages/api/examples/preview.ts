/**
 * What an agent can learn before sending anything: the definition as JSON,
 * and the plan each deployment would execute, or why it cannot.
 * Run: `just example preview` (no network, no keys).
 */
import { Effect, Result, Schema } from "effect"
import { Decision, Deployment, Errors, Planner, Q } from "@decisions/api"

const Triage = Decision.make("ticket-triage", {
  revision: "1",
  input: Schema.Struct({ subject: Schema.String, body: Schema.String }),
  questions: [
    ["refund", Q.boolean("Is the customer asking for money back?")],
    ["team", Q.choice("Which team should own this?", ["billing", "technical"])]
  ]
})

const program = Effect.gen(function*() {
  console.log(JSON.stringify(Decision.describe(Triage), null, 2))
  const prepared = yield* Decision.prepare(Triage, { subject: "Double charge", body: "Charged twice" })
  for (const d of [Deployment.typesafe, Deployment.perplexity, Deployment.openai]) {
    const plan = Planner.plan(prepared, d)
    console.log(JSON.stringify(Result.isSuccess(plan) ? Planner.preview(plan.success) : Errors.explain(plan.failure), null, 2))
  }
})

Effect.runPromise(program)
