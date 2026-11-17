import { assert, describe, expectTypeOf, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Metric, Redacted, Tracer } from "effect"
import { type Answer, Decision, Engine, Ledger, Metrics } from "../../src/index.ts"
import { Deployment, Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { perplexityOne, typesafeTriage } from "../fixtures/triage-replies.ts"

const key = Redacted.make("sk-test")
type Script = Parameters<typeof ScriptedHttp.layer>[0]
const engine = (provider: Provider.Provider, script: Script) =>
  Engine.layerFor(provider).pipe(Layer.provideMerge(ScriptedHttp.layer(script)))

const TypeSafe = Provider.typesafe({ apiKey: key })

describe("Engine.decide", () => {
  it.effect("returns typed answers with evidence, native data and origin", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      const team = r.answers.team
      if (team.status !== "answered") return assert.fail(team.status)
      expectTypeOf(team.value).toEqualTypeOf<"billing" | "technical" | "sales">()
      assert.strictEqual(team.value, "billing")
      assert.strictEqual(team.native.confidence, 0.9)
      assert.strictEqual(team.origin.resolvedModel, "jev-1.13.0")
      assert.strictEqual(team.origin.requestedModel, "jev-latest")
      assert.strictEqual(team.origin.attempt, 1)
      const urgency = r.answers.urgency
      if (urgency.status !== "answered") return assert.fail(urgency.status)
      assert.closeTo(urgency.value, 1.1, 1e-12)
      assert.deepStrictEqual(r.usage, { inputTokens: 300, outputTokens: 40 })
      assert.strictEqual(r.attempts.length, 1)
      assert.strictEqual(r.attempts[0]!.outcome, "ok")
      assert.match(r.fingerprint, /^exe1:/)
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: typesafeTriage }]))))

  it.effect("missing and malformed answers are per-question errors; siblings still answer", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.strictEqual(r.answers.refund.status, "answered")
      const team = r.answers.team
      assert.isTrue(team.status === "error" && /no answer/.test(team.problem))
      const urgency = r.answers.urgency
      assert.isTrue(urgency.status === "error" && /sum/.test(urgency.problem))
    }).pipe(Effect.provide(engine(TypeSafe, [{
      status: 200,
      body: {
        model: "jev-1.13.0",
        answers: { refund: typesafeTriage.answers.refund, urgency: { type: "score", score: 1, probabilities: { "0": 0.5, "1": 0.5, "2": 0.5 } } }
      }
    }]))))

  it.effect("split calls: usage sums, alias echo leaves the resolved model unknown", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.strictEqual(r.attempts.length, 3)
      assert.deepStrictEqual(r.usage, { inputTokens: 300, outputTokens: 3 })
      assert.isNull(r.answers.refund.origin.resolvedModel)
      assert.deepStrictEqual(r.answers.team.origin.lowerings, ["split-for-isolation"])
      assert.notStrictEqual(r.answers.refund.origin.callId, r.answers.team.origin.callId)
    }).pipe(Effect.provide(engine(
      Provider.perplexity({ apiKey: key, allow: ["split-for-isolation"], concurrency: 1 }),
      [{ status: 200, body: perplexityOne("refund") }, { status: 200, body: perplexityOne("team") }, { status: 200, body: perplexityOne("urgency") }]
    ))))

  it.effect("one call without usage makes the total unknown, not smaller", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      assert.deepStrictEqual(r.usage, { inputTokens: undefined, outputTokens: undefined })
    }).pipe(Effect.provide(engine(
      Provider.perplexity({ apiKey: key, allow: ["split-for-isolation"], concurrency: 1 }),
      [{ status: 200, body: perplexityOne("refund") }, { status: 200, body: perplexityOne("team", false) }, { status: 200, body: perplexityOne("urgency") }]
    ))))

  it.effect("provider failures are AiErrors and still reach the ledger", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* Ledger.captureExit(Engine.decide(Triage, triageInput))
      assert.strictEqual(exit._tag, "Failure")
      assert.strictEqual(entries.length, 1)
      assert.strictEqual(entries[0]!.outcome, "failed")
      assert.strictEqual(entries[0]!.status, 401)
      assert.strictEqual(entries[0]!.error?.tag, "AuthenticationError")
      assert.strictEqual(entries[0]!.requestId, "req_401")
    }).pipe(Effect.provide(engine(TypeSafe, [{
      status: 401,
      body: { detail: { error_type: "authentication_error", message: "nope" } },
      headers: { "x-typesafe-request-id": "req_401" }
    }]))))

  it.effect("an unusable envelope is an InvalidOutputError", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      assert.strictEqual(e._tag, "AiError")
      if (e._tag === "AiError") assert.strictEqual(e.reason._tag, "InvalidOutputError")
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: { model: "x" } }]))))

  it.effect("records call, token and answer metrics", () =>
    Effect.gen(function*() {
      const attrs = { deployment: Deployment.key(Deployment.typesafe) }
      const before = yield* Metric.value(Metric.withAttributes(Metrics.calls, { ...attrs, outcome: "ok" }))
      yield* Engine.decide(Triage, triageInput)
      const after = yield* Metric.value(Metric.withAttributes(Metrics.calls, { ...attrs, outcome: "ok" }))
      assert.strictEqual(after.count - before.count, 1)
      const tokens = yield* Metric.value(Metric.withAttributes(Metrics.tokens, { ...attrs, kind: "input" }))
      assert.isAtLeast(tokens.count ?? 0, 300)
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: typesafeTriage }]))))
})

describe("Engine observability", () => {
  it.effect("emits decide, prepare, execute, call and transport spans with decision attributes", () =>
    Effect.gen(function*() {
      const spans: Array<Tracer.NativeSpan> = []
      const tracer = Tracer.make({
        span(options) {
          const span = new Tracer.NativeSpan(options)
          spans.push(span)
          return span
        }
      })
      yield* Engine.decide(Triage, triageInput).pipe(Effect.provideService(Tracer.Tracer, tracer))
      const names = spans.map((s) => s.name)
      for (const n of ["Engine.decide", "Decision.prepare", "Engine.execute", "Engine.call", "Transport.send"]) assert.include(names, n)
      const decide = spans.find((s) => s.name === "Engine.decide")!
      assert.strictEqual(decide.attributes.get("decision.name"), "ticket-triage")
      assert.match(String(decide.attributes.get("decision.fingerprint")), /^exe1:/)
      const send = spans.find((s) => s.name === "Transport.send")!
      assert.strictEqual(send.attributes.get("http.response.status_code"), 200)
      for (const s of spans) assert.strictEqual(s.status._tag, "Ended")
      assert.notInclude(JSON.stringify(spans.map((s) => [...s.attributes])), "sk-test")
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: typesafeTriage }]))))
})

describe("Engine.decideAll", () => {
  it.effect("returns plain values when everything is answered", () =>
    Effect.gen(function*() {
      const v = yield* Engine.decideAll(Triage, triageInput)
      expectTypeOf(v.team).toEqualTypeOf<"billing" | "technical" | "sales">()
      assert.strictEqual(v.team, "billing")
      assert.strictEqual(v.refund, 0.97)
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: typesafeTriage }]))))

  it.effect("fails with DecisionIncomplete listing each problem, carrying the full result", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decideAll(Triage, triageInput))
      if (e._tag !== "DecisionIncomplete") return assert.fail(e._tag)
      assert.deepStrictEqual(e.problems.map((p) => p.questionId), ["team", "urgency"])
      assert.match(e.hint, /Engine.decide/)
      assert.strictEqual((e.result.answers as Record<string, Answer.Any>)["refund"]?.status, "answered")
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 200, body: { answers: { refund: typesafeTriage.answers.refund } } }]))))
})

describe("Engine plan and layer", () => {
  it.effect("plan sends nothing", () =>
    Effect.gen(function*() {
      const p = yield* Engine.plan(Triage, triageInput)
      assert.strictEqual(p.calls.length, 1)
      assert.strictEqual((yield* ScriptedHttp.Requests.use((r) => r.all)).length, 0)
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 500 }]))))

  it.effect("execute rejects a plan made for another input", () =>
    Effect.gen(function*() {
      const e = yield* Engine.Engine
      const a = yield* Decision.prepare(Triage, triageInput)
      const b = yield* Decision.prepare(Triage, { ...triageInput, subject: "Other" })
      const p = yield* e.plan(a)
      const err = yield* Effect.flip(e.execute(b, p))
      assert.isTrue(err._tag === "PlanError" && err.reason === "stale-plan")
    }).pipe(Effect.provide(engine(TypeSafe, [{ status: 500 }]))))

  it("layerFor returns a new layer object per call", () => {
    assert.notStrictEqual(Engine.layerFor(TypeSafe), Engine.layerFor(TypeSafe))
  })

  it.effect("a missing credential fails the layer with a ConfigError naming the variable", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(
        Engine.plan(Triage, triageInput).pipe(
          Effect.provide(engine(Provider.typesafe(), [{ status: 500 }])),
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: {} })))
        )
      )
      assert.match(String(e), /TYPESAFE_API_KEY/)
    }))

  it.effect("reads the credential from config", () =>
    Effect.gen(function*() {
      const p = yield* Engine.plan(Triage, triageInput)
      assert.strictEqual(p.deployment, Deployment.key(Deployment.typesafe))
    }).pipe(
      Effect.provide(engine(Provider.typesafe(), [{ status: 500 }])),
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: { TYPESAFE_API_KEY: "from-env" } })))
    ))
})

