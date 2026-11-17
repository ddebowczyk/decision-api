import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted, Result } from "effect"
import { Decision, Deployment, Planner, Q, Transport, Validate } from "../../src/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"

const yes = Q.boolean("Is it?")

describe("undetermined mass", () => {
  it("probabilities become conditional on the question being answerable; the mass is kept as evidence", () => {
    const v = Validate.answer(yes, { probabilities: [["true", 0.45], ["false", 0.45]], undetermined: 0.1 }, 1e-3)
    if (v._tag !== "Valid") return assert.fail(v.problem)
    assert.closeTo(v.value as number, 0.5, 1e-12)
    if (v.evidence.kind !== "finite-distribution") return assert.fail(v.evidence.kind)
    assert.strictEqual(v.evidence.undetermined, 0.1)
    assert.closeTo(v.evidence.probabilities["true"]! + v.evidence.probabilities["false"]!, 1, 1e-12)
    assert.deepStrictEqual(v.corrections, [])
  })

  it("total mass including undetermined must be within tolerance of 1", () => {
    const v = Validate.answer(yes, { probabilities: [["true", 0.5], ["false", 0.3]], undetermined: 0.1 }, 1e-3)
    assert.strictEqual(v._tag, "Invalid")
    if (v._tag === "Invalid") assert.include(v.problem, "undetermined 0.1")
  })

  it("an answer with no determinable mass is invalid, not a guess", () => {
    const v = Validate.answer(yes, { probabilities: [["true", 0], ["false", 0]], undetermined: 1 }, 1e-3)
    assert.strictEqual(v._tag, "Invalid")
    if (v._tag === "Invalid") assert.include(v.problem, "cannot be determined")
  })

  it("undetermined outside [0, 1] is invalid", () => {
    const v = Validate.answer(yes, { probabilities: [["true", 1], ["false", 0]], undetermined: -0.1 }, 1e-3)
    assert.strictEqual(v._tag, "Invalid")
  })

  it("without undetermined, evidence has no such field", () => {
    const v = Validate.answer(yes, { probabilities: [["true", 1], ["false", 0]] }, 1e-3)
    if (v._tag !== "Valid" || v.evidence.kind !== "finite-distribution") return assert.fail("not valid")
    assert.isFalse("undetermined" in v.evidence)
  })
})

const prepared = Effect.runSync(Decision.prepare(Triage, triageInput))
const call = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe)).calls[0]!
const failure = (reply: Parameters<typeof ScriptedHttp.layer>[0][number]) =>
  Effect.flip(Transport.send(Deployment.typesafe, call, { apiKey: Redacted.make("k") })).pipe(Effect.provide(ScriptedHttp.layer([reply])))

describe("more error shapes", () => {
  it.effect("402 is QuotaExhaustedError and keeps the provider's message", () =>
    Effect.gen(function*() {
      const e = yield* failure({ status: 402, body: { detail: "Insufficient credits for span-01-pro" } })
      assert.strictEqual(e.reason._tag, "QuotaExhaustedError")
      assert.strictEqual((e.reason as { metadata: Record<string, unknown> }).metadata["description"], "Insufficient credits for span-01-pro")
      assert.strictEqual(Transport.statusOf(e), 402)
    }))

  it.effect("a string detail is the provider message", () =>
    Effect.gen(function*() {
      const e = yield* failure({ status: 400, body: { detail: "Unknown model: span-9" } })
      assert.strictEqual(e.reason._tag, "InvalidRequestError")
      assert.include(e.message, "Unknown model: span-9")
    }))

  it.effect("x-respan-log-id is a request id", () =>
    Effect.gen(function*() {
      const e = yield* failure({ status: 400, body: {}, headers: { "x-respan-log-id": "log_7" } })
      assert.strictEqual(Transport.requestIdOf(e), "log_7")
    }))
})

describe("float rounding is not a correction", () => {
  it("mass within float32 rounding (1e-6) of 1 leaves corrections empty", () => {
    const yes = Q.boolean("Is it?")
    const a = Validate.answer(yes, { probabilities: [["true", 0.9433637], ["false", 0.04003837]], undetermined: 0.016597953 }, 1e-3)
    const b = Validate.answer(yes, { probabilities: [["true", 0.70000004], ["false", 0.3]] }, 1e-3)
    assert.deepStrictEqual([a._tag === "Valid" && a.corrections, b._tag === "Valid" && b.corrections], [[], []])
  })

  it("larger deviations are still recorded", () => {
    const v = Validate.answer(Q.boolean("Is it?"), { probabilities: [["true", 0.7004], ["false", 0.3]] }, 1e-3)
    assert.isTrue(v._tag === "Valid" && v.corrections.length === 1)
  })
})
