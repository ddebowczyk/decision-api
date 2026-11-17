import { assert, describe, it } from "@effect/vitest"
import { Duration, Effect, Layer, Redacted, Result, Schema } from "effect"
import { type Codec, Decision, Deployment, Engine, Planner, Q, SystemOne, Transport, Validate } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import * as Fixture from "./fixtures/wire.ts"

/** The questions of the recorded Clef reply, scored jointly. */
const Incident = Decision.make("incident", {
  revision: "1",
  mode: "joint",
  input: Schema.String,
  questions: [
    ["urgent", Q.boolean("Is this support request urgent?")],
    ["team", Q.choice("Which team should handle this request?", [["billing", "Payments"], ["technical", "Outages and errors"], ["sales", "Plans"]])],
    ["severity", Q.score("How severe is the customer impact?", ["No impact", "Minor", "Major", "Critical"])]
  ]
})
const incident = "Checkout has been failing for every customer for the last hour."

/** The questions of the recorded Fastino reply. */
const Refund = Decision.make("refund", {
  revision: "1",
  input: Schema.String,
  questions: [
    ["refund", Q.boolean("Does this request qualify for a refund?")],
    ["department", Q.choice("Which team should handle this request?", [
      ["billing", "Payment or charge disputes"],
      ["returns", "Refund or return requests"],
      ["shipping", "Delivery or shipping issues"]
    ])],
    ["urgency", Q.score("How urgent is this request?", ["low", "medium", "high"])]
  ]
})
const refund = "Refund request: the receipt is attached, the purchase was 10 days ago, and refunds are allowed within 30 days."

const specOf = (def: Decision.Definition, input: unknown, d: Deployment.Snapshot): Codec.CallSpec =>
  Effect.runSync(Effect.map(Decision.prepare(def as never, input as never), (p) => Result.getOrThrow(Planner.plan(p, d)).calls[0]!.spec))

const callOf = (def: Decision.Definition, input: unknown, d: Deployment.Snapshot): Planner.Call =>
  Effect.runSync(Effect.map(Decision.prepare(def as never, input as never), (p) => Result.getOrThrow(Planner.plan(p, d)).calls[0]!))
type Reply = Parameters<typeof ScriptedHttp.layer>[0][number]
const sendClef = (reply: Reply) =>
  Transport.send(Deployment.clefFlash, callOf(Incident, incident, Deployment.clefFlash), { apiKey: Redacted.make("cf") }).pipe(Effect.provide(ScriptedHttp.layer([reply])))
const sendFastino = (reply: Reply) =>
  Transport.send(Deployment.fastino, callOf(Refund, refund, Deployment.fastino), { apiKey: Redacted.make("fk") }).pipe(Effect.provide(ScriptedHttp.layer([reply])))

describe("Cloudflare envelope", () => {
  it.effect("a successful envelope is unwrapped to its result; cf-ray is the request id", () =>
    Effect.gen(function*() {
      const x = yield* sendClef({ status: 200, body: Fixture.json("clef-flash-200"), headers: { "cf-ray": "ray-1" } })
      assert.strictEqual((x.body as { model: string }).model, "clef-flash")
      assert.strictEqual(x.requestId, "ray-1")
    }))

  it.effect("success: false on HTTP 200 is an error with Cloudflare's messages", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(sendClef({ status: 200, body: { result: {}, success: false, errors: [{ code: 5006, message: "Bad input" }], messages: [] } }))
      assert.strictEqual(e.reason._tag, "InvalidOutputError")
      assert.include(e.message, "5006: Bad input")
    }))

  it.effect("an error envelope's messages are the description", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(sendClef({ status: 401, body: Fixture.json("clef-401") }))
      assert.strictEqual(e.reason._tag, "AuthenticationError")
      assert.include(e.message, "10000: Authentication error")
    }))

  it.effect("deployments without an envelope keep the body as sent", () =>
    Effect.gen(function*() {
      const x = yield* sendFastino({ status: 200, body: Fixture.json("fastino-200") })
      assert.strictEqual((x.body as { model: string }).model, "glide")
    }))
})

describe("Fastino errors", () => {
  it.effect("401 keeps the provider's message", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(sendFastino({ status: 401, body: Fixture.json("fastino-401"), headers: { "x-request-id": "req_1" } }))
      assert.strictEqual(e.reason._tag, "AuthenticationError")
      assert.include(e.message, "Authentication required")
      assert.strictEqual(Transport.requestIdOf(e), "req_1")
    }))

  it.effect("a top-level billing denial is QuotaExhaustedError with code and message", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(sendFastino({ status: 402, body: { code: "out_of_credits", message: "Add credits to continue", resolution_url: "https://x" } }))
      assert.strictEqual(e.reason._tag, "QuotaExhaustedError")
      assert.strictEqual((e.reason as { metadata: Record<string, unknown> }).metadata["description"], "out_of_credits: Add credits to continue")
    }))

  it.effect("425 (model warming) carries Retry-After and is retryable", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(sendFastino({
        status: 425,
        body: { error: { code: "model_warming", message: "Model is warming up", type: "invalid_request_error" } },
        headers: { "retry-after": "10" }
      }))
      assert.strictEqual(e.reason._tag, "RateLimitError")
      assert.strictEqual(Duration.toMillis(e.retryAfter!), 10_000)
      assert.isTrue(Transport.isRetryable(Deployment.fastino, e))
    }))
})

describe("System One decode on Clef and Fastino", () => {
  const corrections = (def: Decision.Definition, d: Deployment.Snapshot, body: unknown, input: unknown) => {
    const spec = specOf(def, input, d)
    const r = SystemOne.codec.decode(spec, body)
    if (Result.isFailure(r)) throw new Error(r.failure.message)
    return Object.fromEntries(spec.questions.map(({ id, question }) => {
      const a = r.success.answers.get(id)
      if (a?._tag !== "Candidate") return [id, "no candidate"]
      const v = Validate.answer(question, a.candidate, d.tolerance)
      return [id, v._tag === "Valid" ? v.corrections : v.problem]
    }))
  }

  it("Fastino's expected_level is the native score; the integer argmax is not a correction", () => {
    assert.deepStrictEqual(corrections(Refund, Deployment.fastino, Fixture.json("fastino-200"), refund), { refund: [], department: [], urgency: [] })
    // The official example answers department and urgency only.
    assert.deepStrictEqual(corrections(Refund, Deployment.fastino, Fixture.json("fastino-doc-200"), refund), { refund: "no candidate", department: [], urgency: [] })
  })

  it("Clef's 4-decimal rounding is within its tolerance", () => {
    const body = (Fixture.json("clef-flash-200") as { result: unknown }).result
    assert.deepStrictEqual(corrections(Incident, Deployment.clefFlash, body, incident), { urgent: [], team: [], severity: [] })
  })
})

describe("planning for Clef and Fastino", () => {
  const plan = (def: Decision.Definition, d: Deployment.Snapshot, options: Planner.Options = {}) =>
    Effect.runSync(Effect.map(Decision.prepare(def as never, "x" as never), (p) => Planner.plan(p, d, options)))
  const many = (n: number) =>
    Decision.make("many", { revision: "1", mode: "joint", input: Schema.String, questions: Array.from({ length: n }, (_, i) => [`q${i}`, Q.boolean(`Is ${i} true?`)] as const) })

  it("Clef scores questions jointly: independent definitions need split-for-isolation", () => {
    const r = plan(Refund, Deployment.clef)
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "isolation-required")
    const split = plan(Refund, Deployment.clef, { allow: ["split-for-isolation"] })
    assert.strictEqual(Result.getOrThrow(split).calls.length, 3)
  })

  it("Clef takes at most 64 questions per call", () => {
    assert.isTrue(Result.isSuccess(plan(many(64), Deployment.clef)))
    const r = plan(many(65), Deployment.clef)
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "too-large")
  })

  it("Clef scores take at most 10 levels; Fastino 255", () => {
    const levels = (n: number) => Decision.make("s", { revision: "1", input: Schema.String, questions: [["s", Q.score("How much?", Array.from({ length: n }, (_, i) => `l${i}`))]] })
    const r = plan(levels(11), Deployment.clef, { allow: ["split-for-isolation"] })
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "unsupported")
    assert.isTrue(Result.isSuccess(plan(levels(11), Deployment.fastino)))
  })

  it("Fastino answers independently, all questions in one call", () => {
    assert.strictEqual(Result.getOrThrow(plan(Refund, Deployment.fastino)).calls.length, 1)
  })

  it("Fastino descriptions are text: structured ones need stringify-description", () => {
    const def = Decision.make("s", { revision: "1", input: Schema.String, questions: [["x", Q.boolean({ ask: "Is it urgent?" })]] })
    const r = plan(def, Deployment.fastino)
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "lowering-required")
  })
})

describe("Provider presets", () => {
  it("clef picks the snapshot by model; the default is clef", () => {
    assert.strictEqual(Provider.clef({ urlParams: { account_id: "a" } }).deployment.id, "clef")
    const flash = Provider.clef({ model: "clef-flash", urlParams: { account_id: "a" } })
    assert.strictEqual(flash.deployment.id, "clef-flash")
    assert.strictEqual(flash.model, "clef-flash")
    assert.deepStrictEqual(
      [Deployment.clef.limits.requestTokens, Deployment.clefFlash.limits.requestTokens].map((l) => l !== "unknown" && l.value),
      [65_536, 24_576]
    )
  })

  it("clef reads the account id from CLOUDFLARE_ACCOUNT_ID by default", () => {
    assert.property(Provider.clef().urlParams, "account_id")
  })

  it("fastino waits up to 300 s by default (GLiDE recommends a long read timeout)", () => {
    assert.strictEqual(Duration.toSeconds(Provider.fastino().timeout), 300)
  })
})

describe("Engine on Clef and Fastino", () => {
  it.effect("Clef: account URL, bearer auth, unwrapped envelope, all answered", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Incident, incident)
      for (const a of Object.values(r.answers)) assert.strictEqual(a.status, "answered")
      assert.strictEqual(r.answers.team.status === "answered" && r.answers.team.value, "technical")
      assert.strictEqual(r.attempts[0]!.requestId, "ray-9")
      assert.strictEqual(r.usage.inputTokens, 336)
      const requests = yield* ScriptedHttp.Requests.use((x) => x.all)
      assert.strictEqual(requests[0]!.url, "https://api.cloudflare.com/client/v4/accounts/acct-1/ai/run/@cf/cloudflare/clef-flash")
      assert.strictEqual(requests[0]!.headers["authorization"], "<redacted>")
    }).pipe(
      Effect.provide(
        Engine.layerFor(Provider.clef({ model: "clef-flash", apiKey: Redacted.make("cf"), urlParams: { account_id: "acct-1" } })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("clef-flash-200"), headers: { "cf-ray": "ray-9" } }]))
        )
      )
    ))

  it.effect("Fastino: X-API-Key auth, no corrections, the request id", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Refund, refund)
      for (const a of Object.values(r.answers)) {
        if (a.status !== "answered") return assert.fail(a.status)
        assert.deepStrictEqual(a.corrections, [])
      }
      assert.closeTo(r.answers.urgency.status === "answered" ? r.answers.urgency.value : -1, 0.271362383978579, 1e-3)
      assert.strictEqual(r.attempts[0]!.requestId, "req_9")
      const requests = yield* ScriptedHttp.Requests.use((x) => x.all)
      assert.strictEqual(requests[0]!.url, "https://api.fastino.ai/v1/systemone")
      assert.strictEqual(requests[0]!.headers["x-api-key"], "<redacted>")
      assert.strictEqual(requests[0]!.headers["authorization"], undefined)
      assert.include(requests[0]!.body, "\"model\":\"fastino/GLiDE\"")
    }).pipe(
      Effect.provide(
        Engine.layerFor(Provider.fastino({ apiKey: Redacted.make("fk") })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("fastino-200"), headers: { "x-request-id": "req_9" } }]))
        )
      )
    ))
})
