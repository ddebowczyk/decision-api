import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Result, Schema } from "effect"
import * as AiError from "effect/ai/AiError"
import * as UpDecision from "effect/ai/Decision"
import * as DecisionModel from "effect/ai/DecisionModel"
import { Bridge } from "../../src/index.ts"
import { FakeEngine } from "../../src/testing/index.ts"

const Up = UpDecision.make({
  input: Schema.Struct({ text: Schema.String }),
  decisions: {
    refund: UpDecision.probability({ instructions: "Refund?" }),
    team: UpDecision.classify({ instructions: "Team?", criteria: { billing: "Payments", technical: null } }),
    urgency: UpDecision.rate({ instructions: "Urgency?", criteria: ["routine", { label: "soon", description: "Within a day" }, "immediate"] })
  }
})

const bridged = (table: FakeEngine.Table) => Bridge.layerDecisionModel.pipe(Layer.provide(FakeEngine.layer(table)))

describe("Bridge.layerDecisionModel", () => {
  it.effect("serves effect/ai DecisionModel from an Engine", () =>
    Effect.gen(function*() {
      const r = yield* DecisionModel.decide(Up, { input: { text: "Charged twice" } })
      assert.strictEqual(r.answers.refund.probability, 0.9)
      assert.strictEqual(r.answers.team.label, "billing")
      assert.deepStrictEqual(r.answers.team.probabilities, { billing: 0.8, technical: 0.2 })
      assert.strictEqual(r.answers.urgency.label, "soon")
      assert.closeTo(r.answers.urgency.rating, 1, 1e-12)
      assert.isUndefined(r.usage.inputTokens)
    }).pipe(Effect.provide(bridged({
      refund: 0.9,
      team: FakeEngine.distribution({ billing: 0.8, technical: 0.2 }),
      urgency: "soon"
    }))))

  it.effect("decideSettled keeps a refusal, an invalid answer and a label-only choice local to their questions", () =>
    Effect.gen(function*() {
      const r = yield* DecisionModel.decideSettled(Up, { input: { text: "x" } })
      assert.isTrue(Result.isSuccess(r.outcomes.refund))
      if (Result.isSuccess(r.outcomes.refund)) assert.strictEqual(r.outcomes.refund.success.probability, 0.5)
      assert.isTrue(Result.isFailure(r.outcomes.team))
      if (Result.isFailure(r.outcomes.team)) assert.strictEqual(r.outcomes.team.failure.reason, "Refused")
      assert.isTrue(Result.isFailure(r.outcomes.urgency))
      if (Result.isFailure(r.outcomes.urgency)) assert.strictEqual(r.outcomes.urgency.failure.reason, "Missing")
      const m = Bridge.metadataOf(r)!
      assert.deepStrictEqual(m.answers.team!.status, "refused")
      assert.strictEqual(m.answers.team!.detail, "policy")
      assert.strictEqual(m.answers.urgency!.status, "error")
      assert.strictEqual(m.answers.urgency!.detail, "bad mass")
      assert.strictEqual(m.answers.refund!.origin.deployment, m.deployment)
      assert.strictEqual(r.modelId, "fake")
    }).pipe(Effect.provide(bridged({ refund: 0.5, team: FakeEngine.refused("policy"), urgency: FakeEngine.invalid("bad mass") }))))

  it.effect("a label without probabilities settles as NoDistribution, never as certainty", () =>
    Effect.gen(function*() {
      const r = yield* DecisionModel.decideSettled(Up, { input: { text: "x" } })
      assert.isTrue(Result.isFailure(r.outcomes.team))
      if (Result.isFailure(r.outcomes.team)) assert.strictEqual(r.outcomes.team.failure.reason, "NoDistribution")
      assert.isTrue(Result.isSuccess(r.outcomes.urgency))
    }).pipe(Effect.provide(bridged({ refund: 0.5, team: "billing", urgency: "soon" }))))

  it.effect("decide fails the whole call on a refusal, as upstream documents", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(DecisionModel.decide(Up, { input: { text: "x" } }))
      assert.strictEqual(e.reason._tag, "ContentPolicyError")
      assert.match(e.message, /team/)
    }).pipe(Effect.provide(bridged({ refund: 0.5, team: FakeEngine.refused(), urgency: "soon" }))))

  it.effect("a provider failure passes through with its retryability", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(DecisionModel.decideSettled(Up, { input: { text: "x" } }))
      assert.strictEqual(e.reason._tag, "RateLimitError")
      assert.isTrue(e.isRetryable)
    }).pipe(Effect.provide(
      Bridge.layerDecisionModel.pipe(Layer.provide(FakeEngine.layer({}, {
        fail: AiError.make({ module: "fake", method: "decide", reason: new AiError.RateLimitError({}) })
      })))
    )))
})
