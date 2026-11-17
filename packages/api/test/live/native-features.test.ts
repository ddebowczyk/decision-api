import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { Decision, Engine, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { redImage, Visual } from "../fixtures/visual.ts"
import { has } from "./support.ts"

const live = (provider: Provider.Provider) => Engine.layerFor(provider).pipe(Layer.provide(FetchHttpClient.layer))

describe.runIf(has("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"))("Clef images live", () => {
  it.effect("judges a synthetic image sent with the state", () =>
    Effect.gen(function*() {
      const result = yield* Engine.decide(Visual, "Inspect the image.", { images: [redImage] })
      const answer = result.answers.red
      assert.isTrue(answer.status === "answered" && answer.value > 0.5)
    }).pipe(Effect.provide(live(Provider.clef({ allow: ["split-for-isolation"] })))))
})

describe.runIf(has("LEVANTO_API_KEY") || has("SAGE_API_KEY"))("Sage native live", () => {
  const Verify = Decision.make("native-sanity", {
    revision: "1",
    input: Schema.String,
    questions: [["known", Q.boolean("Does the text say the storefront is painted red?")]]
  })
  it.effect("receives a typed native result and reasoning accounting", () =>
    Effect.gen(function*() {
      const result = yield* Engine.decide(Verify, "The storefront is painted red.", { requireNativeAbstention: true })
      const answer = result.answers.known
      assert.isTrue(answer.status === "answered" && answer.value > 0.5)
      assert.strictEqual(answer.origin.resolvedModel, "levanto-sage-2")
      assert.property(answer.native.fields["meta"], "reasoning")
    }).pipe(Effect.provide(live(Provider.levanto({ mode: "native", reasoning: "on" })))))
})
