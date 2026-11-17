/**
 * Live calls to self-hosted Laya and Jeff servers (laya-serve, jeff, or
 * typed-decision-lab). Skipped unless `LAYA_BASE_URL` / `JEFF_BASE_URL` is
 * set; `LAYA_API_KEY` / `JEFF_API_KEY` are sent when present.
 */
import { assert, describe, it } from "@effect/vitest"
import { Effect, Redacted } from "effect"
import { Engine } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { expectAnswered, has, live, report } from "./support.ts"

const key = (name: string) => (has(name) ? { apiKey: Redacted.make(process.env[name]!) } : {})

describe.runIf(has("LAYA_BASE_URL"))("Laya live", () => {
  it.live("decides the triage example in one call", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("laya", r)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, 1)
      assert.match(r.answers.team.origin.resolvedModel ?? "", /^laya/)
    }).pipe(Effect.provide(live(Provider.laya({ baseUrl: process.env["LAYA_BASE_URL"]!, ...key("LAYA_API_KEY") })))), 60_000)
})

describe.runIf(has("JEFF_BASE_URL"))("Jeff live", () => {
  const isolate = process.env["JEFF_ISOLATE"] === "all" ? "all" : "nouls"
  it.live(`decides the triage example (isolate=${isolate})`, () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("jeff", r)
      expectAnswered(r)
      assert.strictEqual(r.attempts.length, isolate === "all" ? 1 : 3)
    }).pipe(
      Effect.provide(live(Provider.jeff({ baseUrl: process.env["JEFF_BASE_URL"]!, isolate, allow: ["split-for-isolation"], ...key("JEFF_API_KEY") })))
    ), 120_000)
})
