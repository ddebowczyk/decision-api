import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Capabilities, Engine } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { expectAnswered, has, live, report } from "./support.ts"

describe.runIf(has("LEVANTO_API_KEY") || has("SAGE_API_KEY"))("Levanto live", () => {
  it.live("applies runtime capabilities for this exact model: one question per call", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, 3)
    }).pipe(Effect.provide(live(Provider.levanto({
      capabilities: Capabilities.override(Capabilities.builtIn, "levanto", "levanto-sage-2", {
        capabilities: { limits: { questionsPerCall: { value: 1, evidence: "conservative-bound" } } }
      })
    })))))

  it.live("answers all three primitives in one SystemOne call", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("levanto", r)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, 1)
    }).pipe(Effect.provide(live(Provider.levanto()))))

  it.live("rejects a bad key with AuthenticationError", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "AuthenticationError", String(e))
    }).pipe(Effect.provide(live(Provider.levanto({ apiKey: Redacted.make("bad-key") })))))
})
