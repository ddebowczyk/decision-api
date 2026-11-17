/** Live RESPAN span-01 (free tier). Skipped without RESPAN_API_KEY. */
import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Decision, Engine, Q, Respan } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { expectAnswered, has, live, report } from "./support.ts"

const Support = Decision.make("support-review", {
  revision: "1",
  input: Respan.Span,
  questions: [
    ["frustrated", Q.boolean("The user expresses frustration or anger.")],
    ["apology", Q.boolean("The assistant apologizes for a problem.", { true: "The reply contains an apology.", false: "The reply does not apologize." })],
    ["resolved", Q.boolean("The customer confirms the problem is solved.")]
  ]
})
const span = {
  input: [{ role: "user", content: "This is the third time my order is late." }],
  output: { role: "assistant", content: "I am sorry, let me check on that for you." }
}

describe.runIf(has("RESPAN_API_KEY"))("RESPAN live", () => {
  it.live("scores behaviors over a span; unobservable mass is kept as undetermined", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Support, span)
      report("respan", r)
      expectAnswered(r)
      const apology = r.answers.apology
      if (apology.status !== "answered" || apology.evidence.kind !== "finite-distribution") return assert.fail("apology")
      assert.isAbove(apology.value, 0.5)
      assert.isDefined(apology.evidence.undetermined)
      assert.strictEqual(r.attempts.length, 1)
    }).pipe(Effect.provide(live(Provider.respan()))))

  it.live("a bad key is an AuthenticationError", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Support, span))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "AuthenticationError", String(e))
    }).pipe(Effect.provide(live(Provider.respan({ apiKey: Redacted.make("bad-key") })))))
})
