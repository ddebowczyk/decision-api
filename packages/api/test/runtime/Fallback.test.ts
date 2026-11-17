import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Budget, Engine, Fallback } from "../../src/index.ts"
import { Deployment, Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { typesafeTriage } from "../fixtures/triage-replies.ts"
import * as Fixture from "../fixtures/wire.ts"

const k = Redacted.make("k")
const noRetry = { times: 0 }
const typesafe = () => Engine.layerFor(Provider.typesafe({ apiKey: k, retry: noRetry }))
const openai = () => Engine.layerFor(Provider.openai({ apiKey: k, retry: noRetry, allow: ["stringify-state"] }))
const perplexity = () => Engine.layerFor(Provider.perplexity({ apiKey: k, retry: noRetry }))
const basal = () => Engine.layerFor(Provider.basal({ retry: noRetry }))

const openaiTriage = {
  model: "gpt-6-luna",
  answers: [
    { type: "predicate", name: "refund", probability: 0.9 },
    { type: "choice", name: "team", choice: "technical", probabilities: [{ value: "billing", probability: 0.1 }, { value: "technical", probability: 0.8 }, { value: "sales", probability: 0.1 }] },
    { type: "score", name: "urgency", score: 0, probabilities: [{ value: 0, probability: 1 }, { value: 1, probability: 0 }, { value: 2, probability: 0 }] }
  ],
  usage: { input_tokens: 10, output_tokens: 0, total_tokens: 10 }
}

/** Reply by host, so one scripted client can serve every provider. */
const byHost = (replies: Record<string, ScriptedHttp.Reply>) =>
  ScriptedHttp.layer([(_n, r) => replies[new URL(r.url).host] ?? { status: 599, body: `unscripted ${r.url}` }])
const hosts = Effect.map(ScriptedHttp.Requests.use((r) => r.all), (xs) => xs.map((x) => new URL(x.url).host))

describe("Fallback", () => {
  it.effect("a provider failure moves to the next engine; answers come from one provider; attempts span both", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput).pipe(Fallback.run(Fallback.make(typesafe(), openai())))
      assert.strictEqual(r.deployment, "openai@2026-10-18")
      const team = r.answers.team
      assert.isTrue(team.status === "answered" && team.value === "technical")
      for (const a of Object.values(r.answers)) assert.strictEqual(a.origin.deployment, "openai@2026-10-18")
      assert.deepStrictEqual(r.attempts.map((a) => [a.deployment, a.outcome]), [[Deployment.key(Deployment.typesafe), "failed"], ["openai@2026-10-18", "ok"]])
      assert.deepStrictEqual(yield* hosts, ["api.typesafe.ai", "api.openai.com"])
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 401, body: Fixture.json("typesafe-401") }, "api.openai.com": { status: 200, body: openaiTriage } }))))

  it.effect("the first engine answering means the rest are never built or called", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput).pipe(Fallback.run(Fallback.make(typesafe(), openai())))
      assert.strictEqual(r.deployment, Deployment.key(Deployment.typesafe))
      assert.deepStrictEqual(yield* hosts, ["api.typesafe.ai"])
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 200, body: typesafeTriage } }))))

  it.effect("invalid input is terminal: nothing is sent", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(
        Engine.decide(Triage, { subject: 1 } as unknown as typeof triageInput).pipe(Fallback.run(Fallback.make(typesafe(), openai())))
      )
      assert.strictEqual(e._tag, "PreparationError")
      assert.deepStrictEqual(yield* hosts, [])
    }).pipe(Effect.provide(byHost({}))))

  it.effect("plan errors stop unless named in `on`", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput).pipe(Fallback.run(Fallback.make(perplexity(), typesafe()))))
      assert.isTrue(e._tag === "PlanError" && e.reason === "isolation-required")
      const r = yield* Engine.decide(Triage, triageInput).pipe(Fallback.run(Fallback.make({ on: ["isolation-required"] }, perplexity(), typesafe())))
      assert.strictEqual(r.deployment, Deployment.key(Deployment.typesafe))
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 200, body: typesafeTriage } }))))

  it.effect("incomplete answers do not fall back", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decideAll(Triage, triageInput).pipe(Fallback.run(Fallback.make(typesafe(), openai()))))
      assert.strictEqual(e._tag, "DecisionIncomplete")
      assert.deepStrictEqual(yield* hosts, ["api.typesafe.ai"])
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 200, body: { answers: {} } }, "api.openai.com": { status: 200, body: openaiTriage } }))))

  it.effect("a budget is shared across steps", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(
        Engine.decide(Triage, triageInput).pipe(Fallback.run(Fallback.make(typesafe(), openai())), Budget.limit({ attempts: 1 }))
      )
      assert.strictEqual(e._tag, "BudgetExhausted")
      assert.deepStrictEqual(yield* hosts, ["api.typesafe.ai"])
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 529, body: "busy" }, "api.openai.com": { status: 200, body: openaiTriage } }))))

  it.effect("regression: an engine provided outside the fallback never answers for a step", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput).pipe(
        Fallback.run(Fallback.make(typesafe(), openai())),
        Effect.provide(basal())
      )
      assert.strictEqual(r.deployment, "openai@2026-10-18")
      assert.notInclude(yield* hosts, "localhost:8000")
    }).pipe(Effect.provide(byHost({ "api.typesafe.ai": { status: 529, body: "busy" }, "api.openai.com": { status: 200, body: openaiTriage }, "localhost:8000": { status: 200, body: typesafeTriage } }))))

  it.effect("regression: the same layer constant reused as an outer engine and a step is still that provider", () =>
    Effect.gen(function*() {
      const TypeSafe = typesafe()
      const r = yield* Engine.decide(Triage, triageInput).pipe(
        Fallback.run(Fallback.make(basal(), TypeSafe)),
        Effect.provide(TypeSafe)
      )
      assert.strictEqual(r.deployment, Deployment.key(Deployment.typesafe))
      assert.deepStrictEqual(yield* hosts, ["localhost:8000", "api.typesafe.ai"])
    }).pipe(Effect.provide(byHost({ "localhost:8000": { transport: "refused" }, "api.typesafe.ai": { status: 200, body: typesafeTriage } }))))
})

