import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Result, Schema } from "effect"
import { type Codec, Decision, Deployment, Engine, Planner, Q, Respan, Validate, Wire } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import * as Fixture from "./fixtures/wire.ts"

/** The official example (run-span-01 reference), as a call spec. */
const doc: Codec.CallSpec = {
  model: "span-01-free",
  state: {
    input: [{ role: "user", content: "This is the third time my order is late." }],
    output: { role: "assistant", content: "I am sorry, let me check on that for you." }
  },
  questions: [
    { id: "frustrated", question: Q.boolean("The user expresses frustration or anger.") },
    { id: "apology", question: Q.boolean("The assistant apologizes for a problem.") }
  ]
}

const Support = Decision.make("support-review", {
  revision: "1",
  input: Respan.Span,
  questions: [
    ["frustrated", Q.boolean("The user expresses frustration or anger.")],
    ["apology", Q.boolean("The assistant apologizes for a problem.", { true: "The reply contains an apology.", false: "The reply does not apologize." })]
  ]
})
const span = doc.state as Schema.Schema.Type<typeof Respan.Span>

describe("Respan.codec encode", () => {
  it("matches the official request example", () => {
    assert.strictEqual(Wire.stringify(Respan.codec.encode(doc)), Fixture.text("respan-doc-request"))
  })

  it("criteria become 'Present when' / 'Absent when' lines of one definition", () => {
    const body = Respan.codec.encode({ ...doc, questions: [{ id: "apology", question: Support.questions[1]![1] }] })
    assert.deepStrictEqual(Wire.toJson(body), {
      model: "span-01-free",
      span: doc.state,
      behaviors: [{ id: "apology", definition: "The assistant apologizes for a problem.\nPresent when: The reply contains an apology.\nAbsent when: The reply does not apologize." }]
    })
  })
})

describe("Respan.codec decode", () => {
  it("decodes the official response; p_not_observable is undetermined mass", () => {
    const r = Respan.codec.decode(doc, Fixture.json("respan-doc-200"))
    if (Result.isFailure(r)) return assert.fail(r.failure.message)
    assert.strictEqual(r.success.reportedModel, "span-01-free")
    assert.strictEqual(r.success.usage.inputTokens, 39)
    assert.strictEqual(r.success.usage.outputTokens, undefined)
    const a = r.success.answers.get("apology")
    if (a?._tag !== "Candidate") return assert.fail("no candidate")
    assert.strictEqual(a.candidate.undetermined, 0.016597953)
    const v = Validate.answer(doc.questions[1]!.question, a.candidate, Deployment.respan.tolerance)
    if (v._tag !== "Valid") return assert.fail(v.problem)
    assert.closeTo(v.value as number, 0.9433637 / (0.9433637 + 0.04003837), 1e-9)
    // The example sums to 1.000000023: float rounding, not a correction.
    assert.deepStrictEqual(v.corrections, [])
  })

  it("matches results by id, not position; a missing or duplicated id is per-question", () => {
    const body = {
      model: "span-01-free",
      results: [
        { id: "apology", p_present: 0.9, p_absent: 0.08, p_not_observable: 0.02 },
        { id: "apology", p_present: 0.1, p_absent: 0.88, p_not_observable: 0.02 }
      ]
    }
    const r = Respan.codec.decode(doc, body)
    if (Result.isFailure(r)) return assert.fail(r.failure.message)
    assert.isFalse(r.success.answers.has("frustrated"))
    assert.strictEqual(r.success.answers.get("apology")?._tag, "Malformed")
  })

  it("a result without numeric probabilities is malformed, with its fields kept as native data", () => {
    const r = Respan.codec.decode(doc, { model: "span-01-free", results: [{ id: "apology", p_present: "high" }] })
    if (Result.isFailure(r)) return assert.fail(r.failure.message)
    const a = r.success.answers.get("apology")
    assert.strictEqual(a?._tag, "Malformed")
    assert.deepStrictEqual(a?.native.fields, { id: "apology", p_present: "high" })
  })

  it("a body without results is a codec error", () => {
    assert.isTrue(Result.isFailure(Respan.codec.decode(doc, { detail: "x" })))
  })
})

describe("planning for RESPAN", () => {
  const plan = (def: Decision.Definition, input: unknown) =>
    Effect.runSync(Effect.map(Decision.prepare(def as never, input as never), (p) => Planner.plan(p, Deployment.respan)))

  it("supports only boolean questions", () => {
    const def = Decision.make("route", { revision: "1", input: Schema.Json, questions: [["team", Q.choice("Team?", ["a", "b"])]] })
    const r = plan(def, span)
    if (Result.isSuccess(r)) return assert.fail("planned")
    assert.strictEqual(r.failure.reason, "unsupported")
  })

  it("rejects input that is not a conversation span, with a hint", () => {
    const def = Decision.make("plain", { revision: "1", input: Schema.String, questions: [["x", Q.boolean("Is it urgent?")]] })
    const r = plan(def, "plain text")
    if (Result.isSuccess(r)) return assert.fail("planned")
    assert.strictEqual(r.failure.reason, "provider-constraint")
    assert.include(r.failure.message, "conversation span")
    assert.include(r.failure.hint, "Respan.Span")
  })

  it("rejects a behavior definition shorter than 3 characters", () => {
    const def = Decision.make("short", { revision: "1", input: Respan.Span, questions: [["x", Q.boolean("ok")]] })
    const r = plan(def, span)
    if (Result.isSuccess(r)) return assert.fail("planned")
    assert.strictEqual(r.failure.reason, "provider-constraint")
    assert.include(r.failure.message, "at least 3")
  })

  it("all behaviors go in one call", () => {
    const r = plan(Support, span)
    if (Result.isFailure(r)) return assert.fail(r.failure.message)
    assert.strictEqual(r.success.calls.length, 1)
  })
})

describe("Engine on RESPAN", () => {
  it.effect("decides end to end with undetermined evidence, the log id and bearer auth", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Support, span)
      const apology = r.answers.apology
      if (apology.status !== "answered") return assert.fail(apology.status)
      if (apology.evidence.kind !== "finite-distribution") return assert.fail(apology.evidence.kind)
      assert.closeTo(apology.evidence.undetermined!, 0.016597953, 1e-12)
      assert.strictEqual(r.attempts[0]!.requestId, "log_1")
      const requests = yield* ScriptedHttp.Requests.use((x) => x.all)
      assert.strictEqual(requests[0]!.url, "https://api.respan.ai/api/v1/scores")
      assert.strictEqual(requests[0]!.headers["authorization"], "<redacted>")
    }).pipe(
      Effect.provide(
        Engine.layerFor(Provider.respan({ apiKey: Redacted.make("rk") })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("respan-doc-200"), headers: { "x-respan-log-id": "log_1" } }]))
        )
      )
    ))

  it.live("424 (scorer unreachable) is retried", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Support, span)
      assert.deepStrictEqual(r.attempts.map((a) => a.status), [424, 200])
    }).pipe(
      Effect.provide(
        Engine.layerFor(Provider.respan({ apiKey: Redacted.make("rk"), retry: { base: "1 millis", max: "1 millis" } })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 424, body: {} }, { status: 200, body: Fixture.json("respan-doc-200") }]))
        )
      )
    ))
})
