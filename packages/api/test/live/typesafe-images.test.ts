import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { FetchHttpClient } from "effect/http"
import { Engine } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { redImage, Visual } from "../fixtures/visual.ts"
import { has } from "./support.ts"

describe.runIf(has("TYPESAFE_API_KEY"))("Jev 1.14 images live", () => {
  it.effect("answers a bounded question about a synthetic PNG", () =>
    Effect.gen(function*() {
      const result = yield* Engine.decide(Visual, "Inspect the image.", { images: [redImage] })
      const answer = result.answers.red
      assert.strictEqual(answer.status, "answered")
      if (answer.status === "answered") assert.isAbove(answer.value, 0.5)
    }).pipe(Effect.provide(Engine.layerFor(Provider.typesafe({ model: "jev-1.14.0" })).pipe(Layer.provide(FetchHttpClient.layer)))))
})
