import { assert, describe, it } from "@effect/vitest"
import * as AiError from "effect/ai/AiError"
import { Budget, Errors, Planner } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"

const ai = (reason: AiError.AiErrorReason) => AiError.make({ module: "p", method: "decide", reason })

describe("Errors.classify", () => {
  it("a retryable provider failure is unavailable, with its status", () => {
    const c = Errors.classify(ai(new AiError.InternalProviderError({ description: "HTTP 503", metadata: { status: 503 } })))
    assert.strictEqual(c.kind, "unavailable")
    assert.strictEqual(c.status, 503)
    assert.isTrue(c.retryable)
    assert.strictEqual(Errors.classify(ai(new AiError.NetworkError({ reason: "TransportError", method: "POST", url: "x://y" }))).kind, "unavailable")
  })

  it("a non-retryable provider failure is rejected, with its status", () => {
    const c = Errors.classify(ai(new AiError.InvalidRequestError({ description: "bad", metadata: { status: 422 } })))
    assert.strictEqual(c.kind, "rejected")
    assert.strictEqual(c.status, 422)
    assert.strictEqual(Errors.classify(ai(new AiError.AuthenticationError({ kind: "InvalidKey" }))).kind, "rejected")
  })

  it("budget exhaustion is its own kind, never rejected", () => {
    const c = Errors.classify(new Budget.BudgetExhausted({ kind: "deadline", message: "deadline", hint: "h", lastError: undefined }))
    assert.strictEqual(c.kind, "exhausted")
    assert.strictEqual(c.budget, "deadline")
    assert.isFalse(c.retryable)
  })

  it("plan errors and unknown values are rejected", () => {
    const plan = new Planner.PlanError({ definition: "d", deployment: "x", reason: "unsupported", message: "m", hint: "h" })
    assert.deepStrictEqual(Errors.classify(plan), { kind: "rejected", source: "plan", tag: "PlanError", message: "m", status: null, retryable: false })
    assert.deepStrictEqual(Errors.classify("boom").source, "unknown")
    assert.strictEqual(Errors.classify("boom").kind, "rejected")
  })

  it("configuration errors are misconfigured", () => {
    const e = Errors.classify(new Provider.ProviderError({ provider: "x", message: "no key", hint: "h" }))
    assert.strictEqual(e.kind, "misconfigured")
    assert.strictEqual(e.source, "configuration")
  })
})
