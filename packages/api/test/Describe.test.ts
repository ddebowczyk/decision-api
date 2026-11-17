import { assert, describe, it } from "@effect/vitest"
import { Effect, Result } from "effect"
import * as AiError from "effect/ai/AiError"
import { Budget, Decision, Deployment, Errors, Identity, Planner } from "../src/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"

describe("Decision.describe", () => {
  it("is JSON with the identity, mode and every outcome in order", () => {
    const d = Decision.describe(Triage) as Record<string, unknown>
    assert.deepStrictEqual(JSON.parse(JSON.stringify(d)), d)
    assert.strictEqual(d["id"], Identity.definition(Triage))
    assert.strictEqual(d["mode"], "independent")
    const qs = d["questions"] as ReadonlyArray<Record<string, unknown>>
    assert.deepStrictEqual(qs.map((q) => [q["id"], q["kind"], q["outcomes"]]), [
      ["refund", "boolean", ["true", "false"]],
      ["team", "choice", ["billing", "technical", "sales"]],
      ["urgency", "score", ["routine", "soon", "immediate"]]
    ])
    assert.match(String(qs[0]!["value"]), /probability/)
  })
})

describe("Errors.explain", () => {
  const ai = (reason: AiError.AiErrorReason) => AiError.make({ module: "typesafe", method: "decide", reason })

  it("gives every library error a tag, message and hint", () => {
    const plan = Planner.plan(Effect.runSync(Decision.prepare(Triage, triageInput)), Deployment.openai)
    const e = Result.isFailure(plan) ? plan.failure : assert.fail("expected PlanError")
    const x = Errors.explain(e)
    assert.strictEqual(x.tag, "PlanError")
    assert.match(x.hint, /stringify-state/)
    assert.isFalse(x.retryable)
    const b = Errors.explain(new Budget.BudgetExhausted({ kind: "attempts", message: "m", hint: "h", lastError: undefined }))
    assert.strictEqual(b.hint, "h")
  })

  it("explains provider errors with an action", () => {
    assert.match(Errors.explain(ai(new AiError.AuthenticationError({ kind: "InvalidKey" }))).hint, /_API_KEY/)
    const rl = Errors.explain(ai(new AiError.RateLimitError({})))
    assert.isTrue(rl.retryable)
    assert.match(rl.hint, /Budget|retry/)
    assert.match(Errors.explain(ai(new AiError.InvalidRequestError({ description: "Unknown model: x" }))).hint, /model|request/)
    assert.strictEqual(Errors.explain(ai(new AiError.InvalidRequestError({}))).tag, "AiError.InvalidRequestError")
  })

  it("handles unknown values", () => {
    assert.strictEqual(Errors.explain(new Error("boom")).message, "boom")
    assert.strictEqual(Errors.explain("x").tag, "Unknown")
  })
})
