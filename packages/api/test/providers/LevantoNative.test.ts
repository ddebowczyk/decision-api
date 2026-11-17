import { assert, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Schema } from "effect"
import { Decision, Engine, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"

const Compare = Decision.make("native", {
  revision: "1", input: Schema.String,
  questions: [["missing", Q.boolean("Does the text prove X?")], ["choice", Q.choice("Which?", ["A", "B"])]]
})
const fixture = {
  results: [{ answers: [
    { ok: true, result: { id: "missing", kind: "yesno", result: { answer: null, probability: 0.47 },
      meta: { model: "levanto-sage-2", reasoning: { ran: true, finished: true, tokens: 6 } } } },
    { ok: true, result: { id: "choice", kind: "choice", result: { chosen: "B", probabilities: [
      { option: "A", probability: 0.25 }, { option: "B", probability: 0.75 }
    ] }, meta: { model: "levanto-sage-2" } } }
  ] }],
  meta: { model: "levanto-sage-2", usage: { input_tokens: 58, output_tokens: 6 } }
}
const key = Redacted.make("test-key")
const http = ScriptedHttp.layer([{ status: 200, body: fixture }])

it.effect("preserves a native abstention, its evidence and the answered sibling", () =>
  Effect.gen(function*() {
    const result = yield* Engine.decide(Compare, "Unknown.", { requireNativeAbstention: true })
    const [request] = yield* (yield* ScriptedHttp.Requests).all
    const body = JSON.parse(request!.body!)
    assert.strictEqual(new URL(request!.url).pathname, "/decide/batch")
    assert.strictEqual(body.reasoning, "auto")
    assert.strictEqual(body.requests[0].questions[0].kind, "yesno")
    assert.notProperty(body, "model")
    assert.strictEqual(result.answers.missing.status, "abstained")
    assert.deepEqual(result.answers.missing.native.fields["result"], { answer: null, probability: 0.47 })
    assert.deepEqual(result.answers.missing.origin.request, { reasoning: "auto", nativeAbstention: true })
    assert.isTrue(result.answers.choice.status === "answered" && result.answers.choice.value === "B")
    assert.deepEqual(result.usage, { inputTokens: 58, outputTokens: 6 })
  }).pipe(Effect.provide(Engine.layerFor(Provider.levanto({ mode: "native", reasoning: "auto", apiKey: key })).pipe(Layer.provideMerge(http)))))

it.effect("rejects the ordinary Sage endpoint when native abstention is required", () =>
  Effect.gen(function*() {
    const result = yield* Effect.result(Engine.decide(Compare, "Unknown.", { requireNativeAbstention: true }))
    assert.isTrue(result._tag === "Failure" && result.failure._tag === "PlanError" && result.failure.reason === "unsupported")
    assert.deepEqual(yield* (yield* ScriptedHttp.Requests).all, [])
  }).pipe(Effect.provide(Engine.layerFor(Provider.levanto({ apiKey: key })).pipe(Layer.provideMerge(http)))))

it.effect("uses the requested reasoning mode in System One without changing the default wire shape", () =>
  Effect.gen(function*() {
    const base = yield* Engine.plan(Compare, "Unknown.").pipe(Effect.provide(Engine.layerFor(Provider.levanto({ apiKey: key }))))
    const auto = yield* Engine.plan(Compare, "Unknown.").pipe(Effect.provide(Engine.layerFor(Provider.levanto({ apiKey: key, reasoning: "auto" }))))
    assert.notProperty(JSON.parse(base.calls[0]!.body), "reasoning")
    assert.strictEqual(JSON.parse(auto.calls[0]!.body).reasoning, "auto")
    assert.notStrictEqual(base.fingerprint, auto.fingerprint)
  }).pipe(Effect.provide(http)))
