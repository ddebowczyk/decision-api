import { assert, describe, expectTypeOf, it } from "@effect/vitest"
import { Context, Effect, Exit, Schema } from "effect"
import { Decision, Identity, Q } from "../src/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"

describe("Decision.prepare", () => {
  it.effect("encodes the input to JSON and computes identities", () =>
    Effect.gen(function*() {
      const p = yield* Decision.prepare(Triage, triageInput)
      assert.strictEqual(p._tag, "PreparedDecision")
      assert.deepStrictEqual(p.input, triageInput)
      assert.strictEqual(p.definitionId, Identity.definition(Triage))
      assert.strictEqual(p.inputId, Identity.input(triageInput))
    }))

  it.effect("uses the schema's JSON codec, e.g. Date to ISO string", () =>
    Effect.gen(function*() {
      const D = Decision.make("dated", {
        revision: "1",
        input: Schema.Struct({ at: Schema.Date }),
        questions: [["late", Q.boolean("Is it late?")]]
      })
      const p = yield* Decision.prepare(D, { at: new Date("2026-10-18T00:00:00.000Z") })
      assert.deepStrictEqual(p.input, { at: "2026-10-18T00:00:00.000Z" })
    }))

  it.effect("fails with PreparationError carrying a hint and the schema cause", () =>
    Effect.gen(function*() {
      const bad = { subject: 1, body: "x" } as unknown as typeof triageInput
      const exit = yield* Effect.exit(Decision.prepare(Triage, bad))
      assert.isTrue(Exit.isFailure(exit))
      const e = yield* Effect.flip(Decision.prepare(Triage, bad))
      assert.strictEqual(e._tag, "PreparationError")
      assert.strictEqual(e.definition, "ticket-triage")
      assert.match(e.hint, /input/)
      assert.strictEqual((e.cause as { _tag?: string })._tag, "SchemaError")
    }))

  it("keeps the schema's encoding services in R", () => {
    class Clock extends Context.Service<Clock, { readonly now: number }>()("Clock") {}
    type NeedsClock = Schema.Codec<string, string, never, Clock>
    const D = (input: NeedsClock) => Decision.make("svc", { revision: "1", input, questions: [["a", Q.boolean("a?")]] })
    type Prep = ReturnType<typeof Decision.prepare<ReturnType<typeof D>>>
    expectTypeOf<Effect.Services<Prep>>().toEqualTypeOf<Clock>()
    expectTypeOf<Effect.Services<ReturnType<typeof Decision.prepare<typeof Triage>>>>().toEqualTypeOf<never>()
  })
})
