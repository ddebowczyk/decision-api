import { assert, it } from "@effect/vitest"
import { Effect, Layer, Redacted } from "effect"
import { Engine, Fallback } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { redImage, Visual } from "../fixtures/visual.ts"

const key = Redacted.make("test-key")
const jev = Engine.layerFor(Provider.typesafe({ apiKey: key, retry: { times: 0 } }))
const clef = Engine.layerFor(Provider.clef({
  apiKey: key, urlParams: { account_id: "account" }, allow: ["split-for-isolation"]
}))
const basal = Engine.layerFor(Provider.basal())
const request = () => Engine.decide(Visual, "Inspect the image", { images: [redImage] })
const unavailable = { status: 503, body: { error: "unavailable" } }

it.effect("keeps the image on fallback from Jev to Clef", () =>
  Effect.gen(function*() {
    const answer = yield* request().pipe(Fallback.run(Fallback.make(jev, clef)))
    const requests = yield* (yield* ScriptedHttp.Requests).all
    assert.lengthOf(requests, 2)
    const body = JSON.parse(requests[1]!.body!)
    assert.strictEqual(body.state, "Inspect the image")
    assert.deepEqual(body.images, [`data:image/png;base64,${redImage.dataBase64}`])
    assert.strictEqual(answer.answers.red.origin.resolvedModel, "clef")
    assert.deepEqual(answer.answers.red.origin.request, { images: 1 })
  }).pipe(Effect.provide(ScriptedHttp.layer([
    unavailable,
    { status: 200, body: { success: true, result: { model: "clef", answers: { red: { noul: 0.99 } } } } }
  ]))))

it.effect("never issues a text-only request on an image fallback chain", () =>
  Effect.gen(function*() {
    const result = yield* Effect.result(request().pipe(Fallback.run(Fallback.make(jev, basal))))
    assert.isTrue(result._tag === "Failure" && result.failure._tag === "PlanError" && result.failure.reason === "unsupported")
    assert.lengthOf(yield* (yield* ScriptedHttp.Requests).all, 1)
  }).pipe(Effect.provide(ScriptedHttp.layer([unavailable]))))

it.effect("rejects a fifth image before reaching Clef", () =>
  Effect.gen(function*() {
    const result = yield* Effect.result(Engine.decide(Visual, "", { images: Array.from({ length: 5 }, () => redImage) }))
    assert.isTrue(result._tag === "Failure" && result.failure._tag === "PlanError" && result.failure.reason === "provider-constraint")
    assert.deepEqual(yield* (yield* ScriptedHttp.Requests).all, [])
  }).pipe(Effect.provide(clef.pipe(Layer.provideMerge(ScriptedHttp.layer([]))))))
