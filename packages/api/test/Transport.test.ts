import { assert, describe, it } from "@effect/vitest"
import { Duration, Effect, Fiber, Layer, Redacted, Result } from "effect"
import { HttpClient, HttpClientResponse } from "effect/http"
import { TestClock } from "effect/testing"
import { Decision, Deployment, Planner, Transport } from "../src/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"
import * as Fixture from "./fixtures/wire.ts"

const prepared = Effect.runSync(Decision.prepare(Triage, triageInput))
const call = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe)).calls[0]!
const key = Redacted.make("sk-test-secret")
type Script = Parameters<typeof ScriptedHttp.layer>[0]

const send = (script: Script, deployment = Deployment.typesafe) =>
  Transport.send(deployment, call, { apiKey: key }).pipe(Effect.provide(ScriptedHttp.layer(script)))
const failure = (script: Script, deployment = Deployment.typesafe) => Effect.flip(send(script, deployment))

describe("Transport.send success", () => {
  it.effect("posts the planned body with auth and extra headers; returns the parsed body and request id", () =>
    Effect.gen(function*() {
      const [ex, requests] = yield* Effect.all([
        Transport.send(Deployment.typesafe, call, { apiKey: key, headers: { "TypeSafe-Danger-Zone-Long-Context": "true" } }),
        ScriptedHttp.Requests.use((r) => r.all)
      ]).pipe(Effect.provide(ScriptedHttp.layer([
        { status: 200, body: Fixture.json("typesafe-200"), headers: { "x-typesafe-request-id": "req_1" } }
      ])))
      assert.strictEqual(ex.requestId, "req_1")
      assert.deepStrictEqual(ex.body, Fixture.json("typesafe-200"))
      const r = requests[0]!
      assert.strictEqual(r.url, "https://api.typesafe.ai/v1/systemone")
      assert.strictEqual(r.body, call.body)
      assert.strictEqual(r.headers["authorization"], "<redacted>")
      assert.strictEqual(r.headers["typesafe-danger-zone-long-context"], "true")
    }))

  it.effect("puts the unredacted token on the wire, and none without a key", () =>
    Effect.gen(function*() {
      const seen: Array<string | undefined> = []
      const Capture = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((req) => {
          seen.push(req.headers["authorization"])
          return Effect.succeed(HttpClientResponse.fromWeb(req, new Response("{}", { status: 200 })))
        })
      )
      yield* Transport.send(Deployment.typesafe, call, { apiKey: key }).pipe(Effect.provide(Capture))
      yield* Transport.send(Deployment.basal, call, { apiKey: undefined }).pipe(Effect.provide(Capture))
      assert.deepStrictEqual(seen, ["Bearer sk-test-secret", undefined])
    }))

  it.effect("keeps x-ratelimit headers", () =>
    Effect.gen(function*() {
      const ex = yield* send([{ status: 200, body: {}, headers: { "x-ratelimit-remaining": "9", "x-request-id": "r" } }], Deployment.perplexity)
      assert.deepStrictEqual(ex.rateLimit, { "x-ratelimit-remaining": "9" })
      assert.strictEqual(ex.requestId, "r")
    }))
})

describe("Transport.send failures", () => {
  it.effect("401 from each provider's live body is an AuthenticationError with the provider message", () =>
    Effect.gen(function*() {
      for (const [name, re] of [["typesafe-401", /authentication_error: Cannot authenticate/], ["perplexity-401", /invalid_api_key/], ["openai-401", /valid API key/]] as const) {
        const e = yield* failure([{ status: 401, body: Fixture.json(name) }])
        assert.strictEqual(e.reason._tag, "AuthenticationError")
        assert.match(e.message, re)
        assert.isFalse(Transport.isRetryable(Deployment.typesafe, e))
      }
    }))

  it.effect("422 and 400 bodies are InvalidRequestError with field paths", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ status: 422, body: Fixture.json("typesafe-422") }])
      assert.strictEqual(e.reason._tag, "InvalidRequestError")
      assert.match(e.message, /body\.questions\.a\.choice\.criteria: Field required/)
      const m = yield* failure([{ status: 400, body: Fixture.json("typesafe-400-model") }])
      assert.match(m.message, /Unknown model: jev-nope/)
      assert.strictEqual(Transport.statusOf(m), 400)
    }))

  it.effect("429 carries Retry-After and is retryable where documented", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ status: 429, body: {}, headers: { "retry-after": "7" } }])
      assert.strictEqual(e.reason._tag, "RateLimitError")
      assert.deepStrictEqual(e.retryAfter, Duration.seconds(7))
      assert.isTrue(Transport.isRetryable(Deployment.typesafe, e))
      assert.isFalse(Transport.isRetryable(Deployment.basal, e))
    }))

  it.effect("529 is a retryable provider error on TypeSafe only", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ status: 529, body: "overloaded" }])
      assert.strictEqual(e.reason._tag, "InternalProviderError")
      assert.isTrue(Transport.isRetryable(Deployment.typesafe, e))
      assert.isFalse(Transport.isRetryable(Deployment.perplexity, e))
    }))

  it.effect("transport failure is a retryable NetworkError", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ transport: "connection reset" }])
      assert.strictEqual(e.reason._tag, "NetworkError")
      assert.isTrue(Transport.isRetryable(Deployment.basal, e))
    }))

  it.effect("a hung request times out as a NetworkError", () =>
    Effect.gen(function*() {
      const fiber = yield* Transport.send(Deployment.typesafe, call, { apiKey: key, timeout: Duration.seconds(5) }).pipe(
        Effect.provide(ScriptedHttp.layer([{ hang: true }])),
        Effect.flip,
        Effect.forkChild
      )
      yield* TestClock.adjust(Duration.seconds(5))
      const e = yield* Fiber.join(fiber)
      assert.strictEqual(e.reason._tag, "NetworkError")
      assert.match(e.message, /no response within 5s/)
    }))

  it.effect("a 200 without JSON is InvalidOutputError", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ status: 200, body: "<html>" }])
      assert.strictEqual(e.reason._tag, "InvalidOutputError")
    }))

  it.effect("the secret never appears in the error", () =>
    Effect.gen(function*() {
      const e = yield* failure([{ status: 401, body: Fixture.json("typesafe-401") }])
      assert.notInclude(JSON.stringify(e) + e.message + String(e), "sk-test-secret")
    }))
})
