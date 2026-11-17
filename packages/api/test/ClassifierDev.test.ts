import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Result, Schema } from "effect"
import { ClassifierDev, type Codec, Decision, Deployment, Engine, Planner, Q, Transport, Validate, Wire } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import * as Fixture from "./fixtures/wire.ts"

/** The questions of the recorded live call. */
const Ticket = Decision.make("ticket", {
  revision: "1",
  input: Schema.String,
  questions: [
    ["safe", Q.boolean("Is the message safe?")],
    ["route", Q.choice("Which team?", ["billing", "technical"])],
    ["impact", Q.score("Rate the impact", ["low", "high"])]
  ]
})

const spec: Codec.CallSpec = {
  model: "jev",
  state: "billing issue",
  questions: Ticket.questions.map(([id, question]) => ({ id, question }))
}

const plan = (def: Decision.Definition, input: unknown, options: Planner.Options = {}) =>
  Effect.runSync(Effect.map(Decision.prepare(def as never, input as never), (p) => Planner.plan(p, Deployment.classifierDev, options)))

describe("ClassifierDev.codec encode", () => {
  it("positional dimensions with labels per kind, instructions, share_data off", () => {
    assert.deepStrictEqual(Wire.toJson(ClassifierDev.codec.encode(spec)), {
      items: ["billing issue"],
      tier: "fast",
      model: "jev",
      dimensions: {
        q0: { labels: ["yes", "no"], instructions: "Question \"safe\". Choose yes when the criterion holds and no otherwise. Is the message safe?" },
        q1: { labels: ["billing", "technical"], instructions: "Question \"route\". Choose exactly one label. Which team?" },
        q2: { labels: ["level 0: low", "level 1: high"], instructions: "Question \"impact\". Choose exactly one ordered level, from lowest to highest. Rate the impact" }
      },
      share_data: false
    })
  })

  it("descriptions and criteria become part of the labels", () => {
    const body = Wire.toJson(ClassifierDev.codec.encode({
      ...spec,
      questions: [
        { id: "safe", question: Q.boolean("Safe?", { true: "no harm", false: "harmful" }) },
        { id: "team", question: Q.choice("Team?", [["billing", "Charges"], "sales"]) },
        { id: "sev", question: Q.score("Severity?", [["minor", "cosmetic only"], "major"]) }
      ]
    })) as { dimensions: Record<string, { labels: ReadonlyArray<string> }> }
    assert.deepStrictEqual(Object.values(body.dimensions).map((d) => d.labels), [
      ["yes: no harm", "no: harmful"],
      ["billing: Charges", "sales"],
      ["level 0: cosmetic only", "level 1: major"]
    ])
  })
})

describe("ClassifierDev.codec decode", () => {
  it("decodes the recorded live response: dimensions back to question ids, scores to distributions", () => {
    const r = ClassifierDev.codec.decode(spec, Fixture.json("classifier-dev-200"))
    if (Result.isFailure(r)) return assert.fail(r.failure.message)
    assert.strictEqual(r.success.reportedModel, "jev-1.13.0")
    assert.deepStrictEqual([r.success.usage.inputTokens, r.success.usage.outputTokens, r.success.usage.totalTokens], [489, 108, 597])
    const values = spec.questions.map(({ id, question }) => {
      const a = r.success.answers.get(id)
      if (a?._tag !== "Candidate") return assert.fail(`${id}: no candidate`)
      const v = Validate.answer(question, a.candidate, Deployment.classifierDev.tolerance)
      if (v._tag !== "Valid") return assert.fail(v.problem)
      assert.deepStrictEqual(v.corrections, [], id)
      return v.value
    })
    assert.closeTo(values[0] as number, 0.82, 1e-12)
    assert.strictEqual(values[1], "billing")
    assert.closeTo(values[2] as number, 0.67, 1e-12)
    // The provider's confidence (a top-1 minus top-2 margin) stays native.
    assert.strictEqual(r.success.answers.get("safe")?.native.confidence, 0.64)
  })

  it("null scores (unscored) are malformed, per question", () => {
    const body = Fixture.json("classifier-dev-200") as { results: Array<{ dimensions: Record<string, Record<string, unknown>> }> }
    const copy = structuredClone(body)
    copy.results[0]!.dimensions["q1"] = { label: "billing", confidence: null, scores: null, unscored: true, model: "x", ms: 1 }
    const r = Result.getOrThrow(ClassifierDev.codec.decode(spec, copy))
    assert.strictEqual(r.answers.get("route")?._tag, "Malformed")
    assert.strictEqual(r.answers.get("safe")?._tag, "Candidate")
  })

  it("an unknown label is malformed", () => {
    const copy = structuredClone(Fixture.json("classifier-dev-200")) as { results: Array<{ dimensions: Record<string, Record<string, unknown>> }> }
    copy.results[0]!.dimensions["q1"]!["scores"] = { billing: 0.5, sales: 0.5 }
    assert.strictEqual(Result.getOrThrow(ClassifierDev.codec.decode(spec, copy)).answers.get("route")?._tag, "Malformed")
  })

  it("not exactly one result row is a codec error", () => {
    assert.isTrue(Result.isFailure(ClassifierDev.codec.decode(spec, { tier: "fast", results: [] })))
  })
})

describe("planning for Classifier.dev", () => {
  it("text input only: objects need stringify-state", () => {
    const def = Decision.make("o", { revision: "1", input: Schema.Struct({ a: Schema.String }), questions: [["x", Q.boolean("Is it?")]] })
    const r = plan(def, { a: "b" })
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "lowering-required")
    assert.isTrue(Result.isSuccess(plan(def, { a: "b" }, { allow: ["stringify-state"] })))
  })

  it("independent dimensions, at most 20 per call", () => {
    const def = Decision.make("many", { revision: "1", input: Schema.String, questions: Array.from({ length: 25 }, (_, i) => [`q${i}`, Q.boolean(`Is ${i}?`)] as const) })
    assert.deepStrictEqual(Result.getOrThrow(plan(def, "x")).calls.map((c) => c.questionIds.length), [20, 5])
  })

  it("rendered labels must be distinct and at most 200 characters", () => {
    const clash = Decision.make("c", { revision: "1", input: Schema.String, questions: [["c", Q.choice("Which?", ["a: b", ["a", "b"]])]] })
    const r = plan(clash, "x")
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "provider-constraint")
    if (Result.isFailure(r)) assert.include(r.failure.message, "distinct")
    const long = Decision.make("l", { revision: "1", input: Schema.String, questions: [["l", Q.choice("Which?", [["a", "x".repeat(200)], "b"])]] })
    const r2 = plan(long, "x")
    assert.isTrue(Result.isFailure(r2) && r2.failure.reason === "provider-constraint")
  })

  it("input above 32,000 characters is rejected (paid long context)", () => {
    const r = plan(Ticket, "x".repeat(32_001))
    assert.isTrue(Result.isFailure(r) && r.failure.reason === "provider-constraint")
  })
})

describe("Classifier.dev transport and engine", () => {
  it.effect("error bodies keep code and message", () =>
    Effect.gen(function*() {
      const call = Result.getOrThrow(plan(Ticket, "x")).calls[0]!
      const e = yield* Effect.flip(Transport.send(Deployment.classifierDev, call, { apiKey: undefined })).pipe(
        Effect.provide(ScriptedHttp.layer([{ status: 400, body: { error: "Each dimension needs 2-100 distinct labels", code: "bad_dimensions" } }]))
      )
      assert.include(e.message, "bad_dimensions: Each dimension needs 2-100 distinct labels")
    }))

  it.effect("keyless by default, no Idempotency-Key, all answered", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Ticket, "billing issue")
      for (const a of Object.values(r.answers)) assert.strictEqual(a.status, "answered")
      const requests = yield* ScriptedHttp.Requests.use((x) => x.all)
      assert.strictEqual(requests[0]!.url, "https://classifier.dev/v1/classify")
      assert.strictEqual(requests[0]!.headers["authorization"], undefined)
      assert.strictEqual(requests[0]!.headers["idempotency-key"], undefined)
    }).pipe(
      Effect.provide(Engine.layerFor(Provider.classifierDev()).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: Fixture.json("classifier-dev-200") }]))))
    ))

  it("a key is optional and sent as a bearer token", () => {
    assert.strictEqual(Provider.classifierDev().apiKey, undefined)
    assert.isDefined(Provider.classifierDev({ apiKey: Redacted.make("classifier_agent_x") }).apiKey)
  })
})
