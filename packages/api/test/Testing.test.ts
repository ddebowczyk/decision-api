import { assert, describe, expectTypeOf, it } from "@effect/vitest"
import { Effect, Layer, Redacted } from "effect"
import * as AiError from "effect/ai/AiError"
import { Budget, Engine, Ledger, Q } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { FakeEngine, Replies, ScriptedHttp } from "../src/testing/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"

/** Application code under test: routes a ticket. */
const route = (ticket: typeof triageInput) =>
  Engine.decide(Triage, ticket).pipe(
    Effect.map((r) => (r.answers.team.status === "answered" ? r.answers.team.value : "manual-review" as const))
  )

describe("FakeEngine", () => {
  it.effect("answers from a table, through real planning and validation", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      const team = r.answers.team
      if (team.status !== "answered") return assert.fail(team.status)
      assert.strictEqual(team.value, "technical")
      assert.deepStrictEqual(team.evidence, { kind: "label-only" })
      const urgency = r.answers.urgency
      assert.isTrue(urgency.status === "answered" && urgency.value === 2)
      assert.isTrue(r.answers.refund.status === "answered" && r.answers.refund.value === 0.25)
      assert.strictEqual(r.deployment, "fake@test")
      assert.strictEqual(r.attempts.length, 1)
      expectTypeOf(yield* route(triageInput)).toEqualTypeOf<"billing" | "technical" | "sales" | "manual-review">()
    }).pipe(Effect.provide(FakeEngine.layer({ refund: 0.25, team: "technical", urgency: "immediate" }))))

  it.effect("drives the application's own branches: refusal, invalid, missing", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.isTrue(r.answers.team.status === "refused" && r.answers.team.reason === "policy")
      assert.isTrue(r.answers.urgency.status === "error" && /sum/.test(r.answers.urgency.problem))
      assert.isTrue(r.answers.refund.status === "error" && /no answer/.test(r.answers.refund.problem))
      assert.strictEqual(yield* route(triageInput), "manual-review")
    }).pipe(Effect.provide(FakeEngine.layer({
      team: FakeEngine.refused("policy"),
      urgency: FakeEngine.distribution({ routine: 0.5, soon: 0.6, immediate: 0 })
    }))))

  it.effect("a function table sees the question id and input", () =>
    Effect.gen(function*() {
      assert.strictEqual(yield* route({ subject: "Bug", body: "crash" }), "technical")
      assert.strictEqual(yield* route(triageInput), "billing")
    }).pipe(Effect.provide(FakeEngine.layer((id, input) =>
      id === "team" ? (JSON.stringify(input).includes("crash") ? "technical" : "billing") : undefined
    ))))

  it.effect("fails with a provider error and records it", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* Ledger.captureExit(Engine.decide(Triage, triageInput))
      assert.strictEqual(exit._tag, "Failure")
      assert.strictEqual(entries[0]?.error?.tag, "RateLimitError")
    }).pipe(Effect.provide(FakeEngine.layer({}, {
      fail: AiError.make({ module: "fake", method: "decide", reason: new AiError.RateLimitError({}) })
    }))))
})

describe("Replies.systemOne", () => {
  it.effect("builds a provider body the real engine accepts", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.isTrue(r.answers.team.status === "answered" && r.answers.team.value === "sales")
      assert.isTrue(r.answers.urgency.status === "answered" && r.answers.urgency.value === 1)
    }).pipe(Effect.provide(
      Engine.layerFor(Provider.typesafe({ apiKey: Redacted.make("k") })).pipe(Layer.provideMerge(ScriptedHttp.layer([
        { status: 200, body: Replies.systemOne(Triage, { refund: 0.1, team: "sales", urgency: "soon" }) }
      ])))
    )))

  it.effect("a function table sees the question; options set model, provider, usage and confidence", () =>
    Effect.gen(function*() {
      const [r, entries] = yield* Ledger.capture(Engine.decide(Triage, triageInput))
      const team = r.answers.team
      if (team.status !== "answered") return assert.fail(team.status)
      assert.strictEqual(team.value, "billing")
      assert.strictEqual(team.native.confidence, 0.7)
      assert.strictEqual(team.origin.provider, "simulated")
      assert.strictEqual(team.origin.requestedModel, "sim-1")
      assert.strictEqual(team.origin.resolvedModel, "sim-1")
      assert.strictEqual(r.model, "sim-1")
      assert.deepStrictEqual(r.usage, { inputTokens: 12, outputTokens: undefined })
      assert.strictEqual(entries[0]!.usage!.inputTokens, 12)
    }).pipe(Effect.provide(FakeEngine.layer(
      (_id, _input, q) =>
        q.kind === "choice"
          ? FakeEngine.distribution(Object.fromEntries(Q.outcomes(q).map((o, i) => [o, i === 0 ? 0.7 : 0.3 / (Q.outcomes(q).length - 1)])), { confidence: 0.7 })
          : q.kind === "boolean"
          ? 0.5
          : "soon",
      { model: "sim-1", provider: "simulated", usage: { inputTokens: 12, outputTokens: undefined } }
    ))))

  it.effect("fails with BudgetExhausted when told to, after recording the attempt", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* Ledger.captureExit(Engine.decide(Triage, triageInput))
      assert.isTrue(exit._tag === "Failure" && String(exit.cause).includes("BudgetExhausted"))
      assert.strictEqual(entries[0]!.error!.tag, "BudgetExhausted")
    }).pipe(Effect.provide(FakeEngine.layer({}, {
      fail: new Budget.BudgetExhausted({ kind: "deadline", message: "deadline of 1s reached", hint: "", lastError: undefined })
    }))))
})
