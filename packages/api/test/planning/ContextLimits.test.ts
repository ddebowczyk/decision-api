import { assert, describe, it } from "@effect/vitest"
import { Effect, Result, Schema } from "effect"
import { Decision, Deployment, Planner, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"

const Questions = Decision.make("context", {
  revision: "1",
  input: Schema.String,
  questions: [["a", Q.boolean("A".repeat(120))], ["b", Q.boolean("B".repeat(120))]]
})
const prepared = Effect.runSync(Decision.prepare(Questions, "short"))
const exact = (value: number) => ({ value, evidence: "exact" } as const)
const withLimits = (limits: Partial<Deployment.Snapshot["limits"]>) =>
  Deployment.with(Deployment.typesafe, { limits: { ...Deployment.typesafe.limits, ...limits } })

describe("scoped context limits", () => {
  it("enforces character limits and splits request context only between independent questions", () => {
    const state = Planner.plan(prepared, withLimits({ stateChars: exact(4) }))
    assert.isTrue(Result.isFailure(state) && state.failure.reason === "too-large")
    const plan = Result.getOrThrow(Planner.plan(prepared, withLimits({ requestTokens: exact(85) })))
    assert.deepEqual(plan.calls.map((call) => call.questionIds), [["a"], ["b"]])
    assert.isTrue(plan.warnings.some((warning) => warning.includes("heuristic")))
  })

  it("rejects an oversized individual question even when the request limit permits it", () => {
    const result = Planner.plan(prepared, withLimits({ questionTokens: exact(30) }))
    assert.isTrue(Result.isFailure(result) && result.failure.message.includes("per-question context"))
  })

  it("records the effective Jev long-context limits, header and identity", () => {
    const long = Provider.typesafe({ longContext: true })
    const standard = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe))
    const plan = Result.getOrThrow(Planner.plan(prepared, long.deployment))
    assert.deepEqual(plan.capabilities.capabilities.limits.questionTokens, exact(262_144))
    assert.strictEqual(plan.calls[0]!.headers?.["TypeSafe-Danger-Zone-Long-Context"], "true")
    assert.notStrictEqual(plan.fingerprint, standard.fingerprint)
  })
})
