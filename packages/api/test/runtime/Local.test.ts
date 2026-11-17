import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { Engine, Q } from "../../src/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"

describe("Engine.local", () => {
  it.effect("answers offline from a function that sees the definition, question and input, under its own name", () => {
    const asked: Array<string> = []
    return Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.strictEqual(r.deployment, "simulated@local")
      assert.strictEqual(r.model, "simulated-0.1")
      const team = r.answers.team
      if (team.status !== "answered") return assert.fail(team.status)
      assert.strictEqual(team.value, "billing")
      assert.strictEqual(team.native.confidence, 0.6)
      assert.deepStrictEqual(team.origin, {
        questionId: "team",
        callId: team.origin.callId,
        attempt: 1,
        provider: "simulated",
        deployment: "simulated@local",
        requestedModel: "simulated-0.1",
        resolvedModel: "simulated-0.1",
        lowerings: []
      })
      assert.isTrue(r.answers.refund.status === "refused")
      assert.isTrue(r.answers.urgency.status === "error")
      assert.deepStrictEqual(asked, ["ticket-triage:refund:boolean", "ticket-triage:team:billing,technical,sales", "ticket-triage:urgency:routine,soon,immediate"])
    }).pipe(Effect.provide(Engine.local({
      deployment: "simulated",
      model: "simulated-0.1",
      answer: ({ definition, input, question, questionId }) => {
        asked.push(`${definition.name}:${questionId}:${question.kind === "boolean" ? "boolean" : Q.outcomes(question).join(",")}`)
        assert.deepStrictEqual(input, triageInput)
        if (question.kind === "boolean") return { _tag: "Refused", reason: null }
        if (question.kind === "choice") return { _tag: "Distribution", probabilities: { billing: 0.6, technical: 0.3, sales: 0.1 }, confidence: 0.6 }
        return undefined
      }
    })))
  })
})
