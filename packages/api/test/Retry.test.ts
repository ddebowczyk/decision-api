import { assert, describe, it } from "@effect/vitest"
import { Duration, Effect, Fiber, Layer, Redacted } from "effect"
import { TestClock } from "effect/testing"
import { Budget, Engine, Ledger } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"
import { typesafeTriage } from "./fixtures/triage-replies.ts"

type Script = Parameters<typeof ScriptedHttp.layer>[0]
const ok = { status: 200, body: typesafeTriage } as const
const busy = { status: 529, body: "overloaded" } as const
const provider = (retry?: Provider.Options["retry"]) =>
  Provider.typesafe({ apiKey: Redacted.make("k"), retry: { base: "100 millis", max: "1 second", ...retry } })

/** Run `decide` against a script, advancing the test clock far enough for every scheduled retry. */
const run = <A, E>(
  script: Script,
  self: Effect.Effect<A, E, Engine.Engine>,
  p = provider(),
  advance: Duration.Input = "10 minutes"
) =>
  Effect.gen(function*() {
    const fiber = yield* Ledger.captureExit(Effect.all([self, ScriptedHttp.Requests.use((r) => r.all)])).pipe(
      Effect.provide(Engine.layerFor(p).pipe(Layer.provideMerge(ScriptedHttp.layer(script)))),
      Effect.forkChild
    )
    yield* TestClock.adjust(advance)
    return yield* Fiber.join(fiber)
  })

const decide = Engine.decide(Triage, triageInput)

describe("retry", () => {
  it.effect("retries a documented transient status, then succeeds; the answer names attempt 2", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run([busy, ok], decide)
      if (exit._tag !== "Success") return assert.fail(String(exit.cause))
      const [r] = exit.value
      assert.deepStrictEqual(entries.map((e) => [e.attempt, e.outcome, e.status]), [[1, "failed", 529], [2, "ok", 200]])
      assert.strictEqual(r.answers.team.origin.attempt, 2)
    }))

  it.effect("does not retry non-transient failures", () =>
    Effect.gen(function*() {
      for (const reply of [{ status: 401, body: {} }, { status: 400, body: {} }, { status: 200, body: { nope: 1 } }]) {
        const { exit, entries } = yield* run([reply, ok], decide)
        assert.strictEqual(exit._tag, "Failure")
        assert.strictEqual(entries.length, 1, `status ${reply.status}`)
      }
    }))

  it.effect("does not retry per-question errors inside a successful response", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run([{ status: 200, body: { answers: {} } }, ok], decide)
      assert.strictEqual(exit._tag, "Success")
      assert.strictEqual(entries.length, 1)
    }))

  it.effect("stops after retry.times retries with the provider's error", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run([busy], decide, provider({ times: 2 }))
      assert.strictEqual(entries.length, 3)
      assert.isTrue(exit._tag === "Failure" && String(exit.cause).includes("InternalProviderError"))
    }))

  it.effect("transport failures are retried", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run([{ transport: "reset" }, ok], decide)
      assert.strictEqual(exit._tag, "Success")
      assert.strictEqual(entries.length, 2)
    }))

  it.effect("waits for Retry-After when it is longer than the backoff", () =>
    Effect.gen(function*() {
      const fiber = yield* Effect.all([decide, ScriptedHttp.Requests.use((r) => r.all)]).pipe(
        Effect.flatMap(() => ScriptedHttp.Requests.use((r) => r.all)),
        Effect.provide(Engine.layerFor(provider()).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 429, body: {}, headers: { "retry-after": "7" } }, ok])))),
        Effect.forkChild
      )
      yield* TestClock.adjust("6 seconds")
      assert.isUndefined(fiber.pollUnsafe())
      yield* TestClock.adjust("1 second")
      const requests = yield* Fiber.join(fiber)
      assert.strictEqual(requests.length, 2)
    }))

  it.effect("caps backoff at retry.max", () =>
    Effect.gen(function*() {
      const fiber = yield* decide.pipe(
        Effect.provide(Engine.layerFor(provider({ base: "10 seconds", max: "1 second" })).pipe(Layer.provideMerge(ScriptedHttp.layer([busy, ok])))),
        Effect.forkChild
      )
      yield* TestClock.adjust("1 second")
      const r = yield* Fiber.join(fiber)
      assert.strictEqual(r.attempts.length, 2)
    }))
})

describe("Budget", () => {
  it.effect("an attempt budget bounds retries across the scope", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run([busy], decide.pipe(Budget.limit({ attempts: 2 })), provider({ times: 10 }))
      assert.strictEqual(entries.length, 2)
      assert.isTrue(exit._tag === "Failure" && String(exit.cause).includes("BudgetExhausted"))
    }))

  it.effect("a retry that would pass the deadline stops with BudgetExhausted carrying the provider error", () =>
    Effect.gen(function*() {
      const { exit, entries } = yield* run(
        [{ status: 429, body: {}, headers: { "retry-after": "30" } }, ok],
        decide.pipe(Budget.limit({ within: "5 seconds" }), Effect.flip)
      )
      assert.strictEqual(entries.length, 1)
      if (exit._tag !== "Success") return assert.fail("expected flipped failure")
      const [e] = exit.value
      assert.strictEqual(e._tag, "BudgetExhausted")
      if (e._tag === "BudgetExhausted") {
        assert.strictEqual(e.kind, "deadline")
        assert.strictEqual((e.lastError as { reason: { _tag: string } }).reason._tag, "RateLimitError")
      }
    }))

  it.effect("the deadline also bounds a hanging call", () =>
    Effect.gen(function*() {
      const { exit } = yield* run([{ hang: true }], decide.pipe(Budget.limit({ within: "2 seconds" }), Effect.flip))
      assert.isTrue(exit._tag === "Success" && exit.value[0]._tag === "BudgetExhausted")
    }))

  it.effect("nested limits apply together", () =>
    Effect.gen(function*() {
      const { entries } = yield* run([busy], decide.pipe(Budget.limit({ attempts: 5 }), Budget.limit({ attempts: 1 })), provider({ times: 10 }))
      assert.strictEqual(entries.length, 1)
    }))
})
