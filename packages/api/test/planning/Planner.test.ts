import { assert, describe, it } from "@effect/vitest"
import { Effect, Result, Schema } from "effect"
import { Decision, Deployment, Planner, Q, SystemOne, Wire } from "../../src/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"

const prep = <D extends Decision.Any>(d: D, input: Decision.Input<D>) =>
  Effect.runSync(Decision.prepare(d, input) as Effect.Effect<Decision.Prepared<D>, Decision.PreparationError>)
const triage = prep(Triage, triageInput)

const ok = (r: Result.Result<Planner.DecisionPlan, Planner.PlanError>) => {
  if (Result.isFailure(r)) return assert.fail(`${r.failure.message} / ${r.failure.hint}`)
  return r.success
}
const err = (r: Result.Result<Planner.DecisionPlan, Planner.PlanError>) => {
  if (Result.isSuccess(r)) return assert.fail("expected PlanError")
  return r.failure
}

const Joint = Decision.make("joint", {
  revision: "1",
  mode: "joint",
  input: Schema.String,
  questions: [["a", Q.boolean("a?")], ["b", Q.boolean("b?")]]
})

describe("Planner.plan grouping", () => {
  it("independent definition on an independent deployment: one call in definition order", () => {
    const p = ok(Planner.plan(triage, Deployment.typesafe))
    assert.strictEqual(p.calls.length, 1)
    assert.deepStrictEqual(p.calls[0]!.questionIds, ["refund", "team", "urgency"])
    assert.strictEqual(p.model, "jev-latest")
    assert.strictEqual(p.calls[0]!.body, Wire.stringify(SystemOne.codec.encode(p.calls[0]!.spec)))
    assert.deepStrictEqual(p.lowerings, [])
  })
  it("independent definition on a joint deployment needs split-for-isolation", () => {
    const e = err(Planner.plan(triage, Deployment.perplexity))
    assert.strictEqual(e.reason, "isolation-required")
    assert.match(e.hint, /split-for-isolation/)
    const p = ok(Planner.plan(triage, Deployment.perplexity, { allow: ["split-for-isolation"] }))
    assert.deepStrictEqual(p.calls.map((c) => c.questionIds), [["refund"], ["team"], ["urgency"]])
    assert.deepStrictEqual(p.lowerings, [{ name: "split-for-isolation", questionIds: ["refund", "team", "urgency"] }])
  })
  it("joint definition: one atomic call on a joint deployment, rejected on an independent one", () => {
    const joint = prep(Joint, "s")
    assert.strictEqual(ok(Planner.plan(joint, Deployment.perplexity)).calls.length, 1)
    assert.strictEqual(err(Planner.plan(joint, Deployment.typesafe)).reason, "joint-unsupported")
  })
  it("unknown grouping fails", () => {
    const d = Deployment.with(Deployment.typesafe, { grouping: "unknown" })
    assert.strictEqual(err(Planner.plan(triage, d)).reason, "unknown-grouping")
  })
})

describe("Planner.plan lowerings", () => {
  it("object state on OpenAI needs stringify-state, which is recorded", () => {
    const e = err(Planner.plan(triage, Deployment.openai))
    assert.strictEqual(e.reason, "lowering-required")
    assert.match(e.hint, /allow: \["stringify-state"\]/)
    const p = ok(Planner.plan(triage, Deployment.openai, { allow: ["stringify-state"] }))
    assert.strictEqual(p.calls[0]!.spec.state, JSON.stringify(triageInput))
    assert.deepStrictEqual(p.lowerings, [{ name: "stringify-state", questionIds: [] }])
  })
  it("structured descriptions on OpenAI need stringify-description", () => {
    const D = Decision.make("structured", {
      revision: "1",
      input: Schema.String,
      questions: [["c", Q.choice({ ask: "which?", context: "x" }, ["p", ["q", { rule: "r" }]])], ["b", Q.boolean("b?")]]
    })
    const prepared = prep(D, "s")
    assert.strictEqual(err(Planner.plan(prepared, Deployment.openai)).reason, "lowering-required")
    const p = ok(Planner.plan(prepared, Deployment.openai, { allow: ["stringify-description"] }))
    assert.deepStrictEqual(p.lowerings, [{ name: "stringify-description", questionIds: ["c"] }])
    assert.include(p.calls[0]!.body, `"instructions":"{\\"ask\\":\\"which?\\",\\"context\\":\\"x\\"}"`)
  })
  it("boolean criteria on OpenAI are rejected", () => {
    const D = Decision.make("crit", { revision: "1", input: Schema.String, questions: [["b", Q.boolean("b?", { true: "yes" })]] })
    assert.strictEqual(err(Planner.plan(prep(D, "s"), Deployment.openai)).reason, "unsupported")
  })
  it("an unused permission is not recorded", () => {
    assert.deepStrictEqual(ok(Planner.plan(triage, Deployment.typesafe, { allow: ["stringify-state"] })).lowerings, [])
  })
})

describe("Planner.plan limits", () => {
  it("partitions independent questions by questionsPerCall", () => {
    const d = Deployment.with(Deployment.typesafe, { limits: { ...Deployment.typesafe.limits, questionsPerCall: { value: 2, evidence: "exact" } } })
    assert.deepStrictEqual(ok(Planner.plan(triage, d)).calls.map((c) => c.questionIds), [["refund", "team"], ["urgency"]])
  })
  it("repartitions when the final body is too large, and fails when one question cannot fit", () => {
    const one = ok(Planner.plan(triage, Deployment.typesafe)).calls[0]!.bytes
    const d = (bytes: number) => Deployment.with(Deployment.typesafe, { limits: { ...Deployment.typesafe.limits, bodyBytes: { value: bytes, evidence: "exact" } } })
    const p = ok(Planner.plan(triage, d(one - 1)))
    assert.isAbove(p.calls.length, 1)
    for (const c of p.calls) assert.isAtMost(c.bytes, one - 1)
    assert.strictEqual(err(Planner.plan(triage, d(100))).reason, "too-large")
  })
  it("too many levels is unsupported with the deployment's bound", () => {
    const D = Decision.make("many", { revision: "1", input: Schema.String, questions: [["s", Q.score("s?", Array.from({ length: 11 }, (_, i) => `l${i}`))]] })
    const e = err(Planner.plan(prep(D, "s"), Deployment.typesafe))
    assert.strictEqual(e.reason, "unsupported")
    assert.match(e.message, /at most 10/)
  })
  it("unknown limits become warnings, not support", () => {
    assert.isTrue(ok(Planner.plan(triage, Deployment.typesafe)).warnings.some((w) => /questionsPerCall/.test(w)))
  })
})

describe("Planner.plan identity and preview", () => {
  it("is deterministic and fingerprints model and lowerings", () => {
    const a = ok(Planner.plan(triage, Deployment.typesafe))
    assert.deepStrictEqual(ok(Planner.plan(triage, Deployment.typesafe)), a)
    assert.notStrictEqual(ok(Planner.plan(triage, Deployment.typesafe, { model: "jev-preview" })).fingerprint, a.fingerprint)
    assert.match(a.fingerprint, /^exe1:/)
    assert.match(a.calls[0]!.callId, /^call-[0-9a-f]{12}-0$/)
  })
  it("preview is JSON an agent can read; bodies only on request", () => {
    const p = ok(Planner.plan(triage, Deployment.openai, { allow: ["stringify-state"] }))
    const v = Planner.preview(p) as Record<string, unknown>
    assert.deepStrictEqual(JSON.parse(JSON.stringify(v)), v)
    assert.strictEqual(v["deployment"], "openai@2026-10-18")
    assert.notInclude(JSON.stringify(v), "Double charge")
    assert.include(JSON.stringify(Planner.preview(p, { bodies: true })), "Double charge")
  })
})
