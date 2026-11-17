import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Schema } from "effect"
import { Decision, Deployment, Engine, Planner, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { redImage, Visual } from "../fixtures/visual.ts"

const key = Redacted.make("test-key")
const http = ScriptedHttp.layer([{
  status: 200,
  body: { model: "jev-1.14.0", answers: { red: { type: "noul", noul: 0.99 } } }
}])

describe("Jev image state", () => {
  it.effect("sends an asset and the opt-in header with a normal decision", () =>
    Effect.gen(function*() {
      const result = yield* Engine.decide(Visual, "Inspect the first image", { images: [redImage] })
      const [request] = yield* (yield* ScriptedHttp.Requests).all
      const body = JSON.parse(request!.body!)
      assert.strictEqual(request!.headers["typesafe-danger-zone-images"], "true")
      assert.strictEqual(body.model, "jev-1.14.0")
      assert.deepEqual(body.assets[body.state[0]], { type: "image", format: "png", data_base64: redImage.dataBase64 })
      assert.strictEqual(body.state[1], "Inspect the first image")
      assert.strictEqual(result.answers.red.status, "answered")
    }).pipe(Effect.provide(Engine.layerFor(Provider.typesafe({ model: "jev-1.14.0", apiKey: key })).pipe(Layer.provideMerge(http)))))

  it.effect("fails before HTTP when the provider cannot send the image", () =>
    Effect.gen(function*() {
      const result = yield* Effect.result(Engine.decide(Visual, "Inspect the image", { images: [redImage] }))
      assert.strictEqual(result._tag, "Failure")
      if (result._tag === "Failure") assert.strictEqual(result.failure._tag, "PlanError")
      assert.deepEqual(yield* (yield* ScriptedHttp.Requests).all, [])
    }).pipe(Effect.provide(Engine.layerFor(Provider.basal()).pipe(Layer.provideMerge(http)))))

  it.effect("rejects invalid image bytes during preparation", () =>
    Effect.gen(function*() {
      const result = yield* Effect.result(Decision.prepare(Visual, "", { images: [{ ...redImage, dataBase64: "AAAA" }] }))
      assert.strictEqual(result._tag, "Failure")
    }))
})

const Locate = Decision.make("locate", {
  revision: "1",
  input: Schema.String,
  questions: [["square", Q.box("Locate the red square in the image.")]]
})

it.effect("encodes and validates Box on Jev 1.14", () =>
  Effect.gen(function*() {
    const box = { left: 0, top: 0, right: 1, bottom: 1 }
    const response = ScriptedHttp.layer([{ status: 200, body: { answers: { square: { type: "box", box } } } }])
    yield* Effect.gen(function*() {
      const answer = (yield* Engine.decide(Locate, "", { images: [redImage] })).answers.square
      const [request] = yield* (yield* ScriptedHttp.Requests).all
      assert.strictEqual(JSON.parse(request!.body!).questions.square.type, "box")
      assert.isTrue(answer.status === "answered" && answer.evidence.kind === "bounding-box")
      if (answer.status === "answered") assert.deepEqual(answer.value, box)
    }).pipe(Effect.provide(Engine.layerFor(Provider.typesafe({ model: "jev-1.14.0", apiKey: key })).pipe(Layer.provideMerge(response))))
  }))

it("requires images and a Box-capable model", () => {
  const images = Effect.runSync(Decision.prepare(Locate, "", { images: [redImage] }))
  const text = Effect.runSync(Decision.prepare(Locate, ""))
  for (const [input, model] of [[images, "jev-1.13.0"], [text, "jev-1.14.0"]] as const) {
    const result = Planner.plan(input, Deployment.typesafe, { model })
    assert.isTrue(result._tag === "Failure" && result.failure.reason === "unsupported")
  }
})
