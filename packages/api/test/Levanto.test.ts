import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Result, Schema } from "effect"
import { Decision, Deployment, Engine, Planner, Q } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import * as Fixture from "./fixtures/wire.ts"

const Ticket = Decision.make("levanto-ticket", {
  revision: "1",
  input: Schema.Struct({ subject: Schema.String, message: Schema.String }),
  questions: [
    ["billing", Q.boolean("Is this message about billing?", { true: "Billing", false: "Other" })],
    ["tone", Q.choice("What tone?", [["angry", "Upset or hostile"], ["calm", "Neutral or polite"]])],
    ["urgency", Q.score("How urgent?", ["Can wait", "This week", "Today"])]
  ]
})
const input = { subject: "Duplicate charge", message: "I was charged twice. Please help." }

describe("Levanto Sage SystemOne", () => {
  it("plans all three primitives in one call with structured state and boolean criteria", () => {
    const prepared = Effect.runSync(Decision.prepare(Ticket, input))
    const plan = Result.getOrThrow(Planner.plan(prepared, Provider.levanto().deployment))
    assert.strictEqual(plan.calls.length, 1)
    const body = JSON.parse(plan.calls[0]!.body)
    assert.strictEqual(body.model, "levanto-sage-2")
    assert.deepStrictEqual(body.state, input)
    assert.deepStrictEqual(body.questions.billing.criteria, { true: "Billing", false: "Other" })
    assert.deepStrictEqual(body.questions.urgency.criteria, ["Can wait", "This week", "Today"])
    assert.deepStrictEqual(plan.lowerings, [])
  })

  for (const [kind, max] of [["choice", 256], ["score", 26]] as const) {
    it(`enforces the ${max} ${kind} outcomes boundary`, () => {
      for (const n of [max, max + 1]) {
        const labels = Array.from({ length: n }, (_, i) => `o${i}`)
        const def = Decision.make("bounds", { revision: "1", input: Schema.String,
          questions: [["q", kind === "choice" ? Q.choice("Which?", labels) : Q.score("How much?", labels)]] })
        const p = Planner.plan(Effect.runSync(Decision.prepare(def, "x")), Provider.levanto().deployment)
        assert.strictEqual(Result.isSuccess(p), n === max)
        if (Result.isFailure(p)) assert.strictEqual(p.failure.reason, "unsupported")
      }
    })
  }

  it("requires explicit lowering for structured descriptions", () => {
    const def = Decision.make("structured", { revision: "1", input: Schema.String,
      questions: [["q", Q.boolean({ question: "Safe?" })]] })
    const prepared = Effect.runSync(Decision.prepare(def, "x"))
    const p = Planner.plan(prepared, Provider.levanto().deployment)
    assert.isTrue(Result.isFailure(p) && p.failure.reason === "lowering-required")
    assert.isTrue(Result.isSuccess(Planner.plan(prepared, Deployment.levanto, { allow: ["stringify-description"] })))
  })

  for (const variable of ["LEVANTO_API_KEY", "SAGE_API_KEY"]) {
    it.effect(`resolves ${variable}, sends to Sage, and validates the documented response`, () =>
      Effect.gen(function*() {
        const r = yield* Engine.decide(Ticket, input)
        assert.strictEqual(r.answers.billing.status, "answered")
        assert.strictEqual(r.answers.tone.status === "answered" && r.answers.tone.value, "calm")
        assert.strictEqual(r.answers.urgency.status === "answered" && r.answers.urgency.value, 1.61)
        assert.strictEqual(r.answers.billing.origin.resolvedModel, "levanto-sage-2")
        assert.strictEqual(r.usage.inputTokens, 240)
        assert.strictEqual(r.usage.outputTokens, 0)
        const requests = yield* ScriptedHttp.Requests.use((r) => r.all)
        assert.strictEqual(requests[0]!.url, "https://sage.levanto.ai/v1/systemone")
        assert.strictEqual(requests[0]!.headers.authorization, "<redacted>")
        assert.strictEqual(JSON.parse(requests[0]!.body!).model, "sage-latest")
      }).pipe(Effect.provide(
        Engine.layerFor(Provider.levanto({ model: "sage-latest" })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("levanto-doc-200") }])),
          Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: { [variable]: "test-secret" } })))
        )
      )))
  }
})
