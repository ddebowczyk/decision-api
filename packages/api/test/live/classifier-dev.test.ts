/**
 * Live calls to Classifier.dev. Keyless (free per-IP limits), so opt-in with
 * `CLASSIFIER_DEV_LIVE=1`; `CLASSIFIER_API_KEY` is sent when present.
 */
import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Capabilities, Deployment, Engine } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { expectAnswered, has, live, report } from "./support.ts"

const key = has("CLASSIFIER_API_KEY") ? { apiKey: Redacted.make(process.env["CLASSIFIER_API_KEY"]!) } : {}

describe.runIf(has("CLASSIFIER_DEV_LIVE"))("Classifier.dev live", () => {
  it.live("decides the triage example in one call (object input as JSON text)", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("classifier-dev", r)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, 1)
      assert.isDefined(r.usage.inputTokens)
    }).pipe(Effect.provide(live(Provider.classifierDev({ allow: ["stringify-state"], ...key })))), 60_000)

  it.live("an unknown model is an InvalidRequestError with the provider's code", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      console.log(JSON.stringify({ label: "classifier-dev bad model", error: String(e) }))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "InvalidRequestError", String(e))
    }).pipe(Effect.provide(live(Provider.classifierDev({ model: "no-such-model", capabilities: [Capabilities.declare(Deployment.classifierDev, "no-such-model")], allow: ["stringify-state"], ...key })))), 60_000)
})
