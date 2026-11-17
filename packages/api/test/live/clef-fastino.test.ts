/**
 * Live calls to Cloudflare Clef and Fastino GLiDE. Skipped without keys.
 * Prints values and request ids, never keys.
 */
import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Engine } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { expectAnswered, has, live, report } from "./support.ts"

describe.runIf(has("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"))("Clef live", () => {
  for (const model of ["clef", "clef-flash"] as const) {
    it.live(`${model}: decides the triage example, one isolated call per question`, () =>
      Effect.gen(function*() {
        const r = yield* Engine.decide(Triage, triageInput)
        report(model, r)
        expectAnswered(r)
        assert.strictEqual(r.attempts.length, 3)
        assert.isNotNull(r.attempts[0]!.requestId)
      }).pipe(Effect.provide(live(Provider.clef({ model, allow: ["split-for-isolation"] })))), 60_000)
  }

  it.live("a bad token is an AuthenticationError with Cloudflare's message", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      console.log(JSON.stringify({ label: "clef bad token", error: String(e) }))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "AuthenticationError", String(e))
    }).pipe(Effect.provide(live(Provider.clef({ apiKey: Redacted.make("bad-token"), allow: ["split-for-isolation"] })))))
})

describe.runIf(has("FASTINO_API_KEY"))("Fastino live", () => {
  it.live("decides the triage example in one call", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("fastino", r)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, 1)
    }).pipe(Effect.provide(live(Provider.fastino()))), 320_000)

  it.live("a bad key is an AuthenticationError with Fastino's message", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      console.log(JSON.stringify({ label: "fastino bad key", error: String(e) }))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "AuthenticationError", String(e))
    }).pipe(Effect.provide(live(Provider.fastino({ apiKey: Redacted.make("bad-key") })))))
})
