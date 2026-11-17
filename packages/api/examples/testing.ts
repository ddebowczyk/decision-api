/**
 * Testing application code that makes decisions, without HTTP.
 * Run: `just example testing`.
 */
import { Effect, Schema } from "effect"
import { Decision, Engine, Q } from "@decisions/api"
import { FakeEngine } from "@decisions/api/testing"

const Triage = Decision.make("ticket-triage", {
  revision: "1",
  input: Schema.Struct({ subject: Schema.String, body: Schema.String }),
  questions: [["team", Q.choice("Which team should own this?", ["billing", "technical"])]]
})

/** The application function under test. */
const route = (ticket: { subject: string; body: string }) =>
  Engine.decide(Triage, ticket).pipe(
    Effect.map((r) => (r.answers.team.status === "answered" ? r.answers.team.value : "manual-review"))
  )

const ticket = { subject: "s", body: "b" }
const answered = route(ticket).pipe(Effect.provide(FakeEngine.layer({ team: "technical" })))
const refused = route(ticket).pipe(Effect.provide(FakeEngine.layer({ team: FakeEngine.refused("policy") })))

Effect.runPromise(Effect.all([answered, refused])).then(([a, b]) => console.log({ answered: a, refused: b }))
