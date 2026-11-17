import { assert, describe, it } from "@effect/vitest"
import { Duration, Effect, Layer, Redacted, Result, Schema } from "effect"
import { Decision, Deployment, Engine, Planner, Q, SystemOne, Transport, Validate } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import * as Fixture from "./fixtures/wire.ts"

/** The questions of the lab's Jeff profile test. */
const Ticket = Decision.make("ticket", {
  revision: "1",
  input: Schema.String,
  questions: [
    ["refund", Q.boolean("Is the customer asking for money back?")],
    ["route", Q.choice("Which team?", ["billing", "technical"])],
    ["urgency", Q.score("How urgent?", ["low", "high"])]
  ]
})
const ticket = "I was charged twice and need a refund."

/** The questions of the polyglot Laya fixture. */
const Review = Decision.make("review", {
  revision: "1",
  input: Schema.Struct({ message: Schema.String }),
  questions: [
    ["route", Q.choice("Route it", [["billing", "charge"], "technical"])],
    ["safe", Q.boolean("Is this safe?", { true: "safe", false: "unsafe" })],
    ["impact", Q.score("Rate the impact", ["low", "high"])]
  ]
})

/** The questions of the laya-serve documentation example. */
const Queue = Decision.make("queue", {
  revision: "1",
  input: Schema.String,
  questions: [
    ["queue", Q.choice("Which team?", [["billing", "billing and refunds"], ["tech", "login and app issues"], ["other", "everything else"]])],
    ["urgency", Q.score("How urgent?", ["calm", "firm", "angry", "furious"])]
  ]
})

const plan = (def: Decision.Definition, input: unknown, d: Deployment.Snapshot, options: Planner.Options = {}) =>
  Effect.runSync(Effect.map(Decision.prepare(def as never, input as never), (p) => Planner.plan(p, d, options)))

const verdicts = (def: Decision.Definition, input: unknown, d: Deployment.Snapshot, body: unknown) => {
  const spec = Result.getOrThrow(plan(def, input, d, { allow: ["split-for-isolation"] })).calls[0]!.spec
  const all = Result.getOrThrow(plan(def, input, d, { allow: ["split-for-isolation"] })).calls.flatMap((c) => c.spec.questions)
  const r = SystemOne.codec.decode({ ...spec, questions: all }, body)
  if (Result.isFailure(r)) throw new Error(r.failure.message)
  return Object.fromEntries(all.map(({ id, question }) => {
    const a = r.success.answers.get(id)
    if (a?._tag !== "Candidate") return [id, "no candidate"]
    const v = Validate.answer(question, a.candidate, d.tolerance)
    return [id, v._tag === "Valid" ? v.corrections : `invalid: ${v.problem}`]
  }))
}

const options = (n: number) => Array.from({ length: n }, (_, i) => `o${i}`)
const oneChoice = (n: number) => Decision.make("c", { revision: "1", input: Schema.String, questions: [["c", Q.choice("Which?", options(n))]] })
const oneScore = (n: number) => Decision.make("s", { revision: "1", input: Schema.String, questions: [["s", Q.score("How much?", options(n))]] })
const isFailure = (r: Result.Result<unknown, Planner.PlanError>, reason: Planner.PlanErrorReason) => Result.isFailure(r) && r.failure.reason === reason

describe("Jeff", () => {
  it("upstream's default isolation (nouls) scores choice and score questions jointly", () => {
    assert.strictEqual(Provider.jeff().deployment.grouping, "joint")
    assert.isTrue(isFailure(plan(Ticket, ticket, Deployment.jeff), "isolation-required"))
  })

  it("a server run with JEFF_ISOLATE=all is independent: isolate: \"all\"", () => {
    const p = Provider.jeff({ isolate: "all" })
    assert.strictEqual(p.deployment.grouping, "independent")
    assert.strictEqual(Result.getOrThrow(plan(Ticket, ticket, p.deployment)).calls.length, 1)
  })

  it("64 labels per question, 64 questions per call", () => {
    const d = Deployment.jeffIsolated
    assert.isTrue(Result.isSuccess(plan(oneChoice(64), "x", d)))
    assert.isTrue(isFailure(plan(oneChoice(65), "x", d), "unsupported"))
    assert.isTrue(isFailure(plan(oneScore(65), "x", d), "unsupported"))
    assert.deepStrictEqual(d.limits.questionsPerCall, { value: 64, evidence: "exact" })
  })

  it("self-hosted: default base URL, a custom one, model and aliases", () => {
    assert.strictEqual(Provider.jeff().deployment.baseUrl, "http://localhost:8000")
    assert.strictEqual(Provider.jeff({ baseUrl: "http://10.0.0.2:8091" }).deployment.baseUrl, "http://10.0.0.2:8091")
    assert.strictEqual(Provider.jeff().model, "gliformer-large-v1")
    assert.property(Deployment.jeff.aliases, "jev-latest")
  })

  it("decodes the lab's Jeff answer without corrections (T = 1)", () => {
    assert.deepStrictEqual(verdicts(Ticket, ticket, Deployment.jeff, Fixture.json("jeff-lab-200")), { refund: [], route: [], urgency: [] })
  })

  it.effect("no key, no Authorization header; a key is a bearer token", () =>
    Effect.gen(function*() {
      yield* Engine.decide(Ticket, ticket).pipe(
        Effect.provide(Engine.layerFor(Provider.jeff({ isolate: "all" })).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("jeff-lab-200") }]))))
      )
      const keyed = yield* Effect.gen(function*() {
        yield* Engine.decide(Ticket, ticket)
        return yield* ScriptedHttp.Requests.use((x) => x.all)
      }).pipe(
        Effect.provide(
          Engine.layerFor(Provider.jeff({ isolate: "all", apiKey: Redacted.make("jk") })).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("jeff-lab-200") }])))
        )
      )
      assert.strictEqual(keyed[0]!.headers["authorization"], "<redacted>")
      assert.strictEqual(keyed[0]!.url, "http://localhost:8000/v1/systemone")
    }))

  it.effect("the request carries no Authorization header without a key", () =>
    Effect.gen(function*() {
      yield* Engine.decide(Ticket, ticket)
      const requests = yield* ScriptedHttp.Requests.use((x) => x.all)
      assert.strictEqual(requests[0]!.headers["authorization"], undefined)
    }).pipe(
      Effect.provide(Engine.layerFor(Provider.jeff({ isolate: "all" })).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("jeff-lab-200") }]))))
    ))

  it.effect("retry-after-ms is honoured when retry-after is absent", () =>
    Effect.gen(function*() {
      const call = Result.getOrThrow(plan(Ticket, ticket, Deployment.jeffIsolated)).calls[0]!
      const e = yield* Effect.flip(Transport.send(Deployment.jeffIsolated, call, { apiKey: undefined })).pipe(
        Effect.provide(ScriptedHttp.layer([{ status: 429, body: { error: { type: "rate_limit_error", message: "Rate limit exceeded" } }, headers: { "retry-after-ms": "1500" } }]))
      )
      assert.strictEqual(Duration.toMillis(e.retryAfter!), 1500)
      assert.strictEqual((e.reason as { metadata: Record<string, unknown> }).metadata["description"], "rate_limit_error: Rate limit exceeded")
    }))

  it("529 (queue full) is retryable", () => {
    assert.include(Deployment.jeff.retryableStatuses, 529)
  })
})

describe("Laya", () => {
  it("questions are independent rows: one call", () => {
    assert.strictEqual(Provider.laya().deployment.grouping, "independent")
    assert.strictEqual(Result.getOrThrow(plan(Ticket, ticket, Deployment.laya)).calls.length, 1)
  })

  it("100 options, 32 score levels, 64 questions", () => {
    const d = Deployment.laya
    assert.isTrue(Result.isSuccess(plan(oneChoice(100), "x", d)))
    assert.isTrue(isFailure(plan(oneChoice(101), "x", d), "unsupported"))
    assert.isTrue(Result.isSuccess(plan(oneScore(32), "x", d)))
    assert.isTrue(isFailure(plan(oneScore(33), "x", d), "unsupported"))
    assert.deepStrictEqual(d.limits.questionsPerCall, { value: 64, evidence: "exact" })
  })

  it("self-hosted: laya-serve's port by default, the model route", () => {
    assert.strictEqual(Provider.laya().deployment.baseUrl, "http://localhost:8000")
    assert.strictEqual(Provider.laya({ baseUrl: "http://127.0.0.1:8091" }).deployment.baseUrl, "http://127.0.0.1:8091")
    assert.strictEqual(Provider.laya().model, "laya-typed-decisions")
  })

  it("decodes the lab's laya-v1 answers; action.act_probability stays native", () => {
    const body = Fixture.json("laya-lab-200")
    assert.deepStrictEqual(verdicts(Review, { message: "duplicate charge" }, Deployment.laya, body), { route: [], safe: [], impact: [] })
    const spec = Result.getOrThrow(plan(Review, { message: "duplicate charge" }, Deployment.laya)).calls[0]!.spec
    const r = Result.getOrThrow(SystemOne.codec.decode(spec, body))
    assert.deepStrictEqual(r.answers.get("safe")?.native.fields["action"], { act_probability: 0.7 })
    assert.strictEqual(r.reportedModel, "laya-typed-decisions@mlx-checkpoint-abc")
  })

  it("decodes laya-serve's full payload (routing, answer_confidence, x_jev_confidence)", () => {
    const v = verdicts(Queue, "I was charged twice this month, I want my money back", Deployment.laya, Fixture.json("laya-serve-doc-200"))
    assert.deepStrictEqual(v.queue, [])
    // The documented levels sum to 0.9999: 4-decimal rounding, recorded.
    assert.lengthOf(v.urgency as ReadonlyArray<string>, 1)
  })

  it.effect("the lab's error shape and laya-serve's busy reply keep the provider message", () =>
    Effect.gen(function*() {
      const call = Result.getOrThrow(plan(Ticket, ticket, Deployment.laya)).calls[0]!
      const send = (reply: Parameters<typeof ScriptedHttp.layer>[0][number]) =>
        Effect.flip(Transport.send(Deployment.laya, call, { apiKey: undefined })).pipe(Effect.provide(ScriptedHttp.layer([reply])))
      const lab = yield* send({ status: 503, body: { error: { code: "queue_full", message: "Queue is full" } }, headers: { "x-request-id": "r-1" } })
      assert.include(lab.message, "queue_full: Queue is full")
      assert.strictEqual(Transport.requestIdOf(lab), "r-1")
      assert.isTrue(Transport.isRetryable(Deployment.laya, lab))
      const busy = yield* send({ status: 503, body: { detail: "server busy, try again later" } })
      assert.include(busy.message, "server busy")
    }))
})
