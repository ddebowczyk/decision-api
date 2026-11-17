import { assert, describe, it } from "@effect/vitest"
import { Result } from "effect"
import { type Codec, Deployment, OpenAiDecisions, Q, Validate, Wire } from "../../src/index.ts"
import * as Fixture from "../fixtures/wire.ts"

/** The spec behind the live probe of 2026-10-18. */
const probe: Codec.CallSpec = {
  model: "gpt-6-luna",
  state: "I was charged twice for my order. Please refund it.",
  questions: [
    { id: "refund", question: Q.boolean("Is the customer asking for money back?") },
    { id: "team", question: Q.choice("Which team?", [["billing", "Payments"], ["technical", "Bugs"]]) },
    { id: "urgency", question: Q.score("How urgent?", ["Routine", "Soon", "Immediate"]) }
  ]
}

const decode = (spec: Codec.CallSpec, body: unknown): Codec.Decoded => {
  const r = OpenAiDecisions.codec.decode(spec, body)
  if (Result.isFailure(r)) return assert.fail(r.failure.message)
  return r.success
}

const value = (spec: Codec.CallSpec, d: Codec.Decoded, id: string): unknown => {
  const a = d.answers.get(id)
  if (a?._tag !== "Candidate") return assert.fail(`no candidate for ${id}: ${a?._tag}`)
  const v = Validate.answer(spec.questions.find((x) => x.id === id)!.question, a.candidate, Deployment.openai.tolerance)
  if (v._tag !== "Valid") return assert.fail(v.problem)
  return v.value
}

describe("OpenAiDecisions.encode", () => {
  it("matches the request golden", () => {
    const sent = JSON.parse(Fixture.text("openai-request"))
    // The probe sent bare level labels; the codec omits a description equal to nothing.
    assert.deepStrictEqual(JSON.parse(Wire.stringify(OpenAiDecisions.codec.encode(probe))), sent)
  })
  it("writes level descriptions and choice descriptions in order", () => {
    const spec: Codec.CallSpec = {
      model: "m",
      state: "s",
      questions: [{ id: "u", question: Q.score("u?", [["low", "Can wait"], "high"]) }, { id: "c", question: Q.choice("c?", ["10", "2"]) }]
    }
    assert.strictEqual(
      Wire.stringify(OpenAiDecisions.codec.encode(spec)),
      `{"model":"m","input":"s","questions":[{"type":"score","name":"u","instructions":"u?","levels":[{"label":"low","description":"Can wait"},{"label":"high"}]},{"type":"choice","name":"c","instructions":"c?","choices":[{"value":"10"},{"value":"2"}]}]}`
    )
  })
  it("refuses object state, which needs the stringify-state lowering", () => {
    assert.throws(() => OpenAiDecisions.codec.encode({ ...probe, state: { a: 1 } }), /stringify-state/)
  })
})

describe("OpenAiDecisions.decode", () => {
  it("decodes the live capture by order and name", () => {
    const d = decode(probe, Fixture.json("openai-200"))
    assert.strictEqual(d.reportedModel, "gpt-6-luna")
    assert.strictEqual(value(probe, d, "refund"), 1)
    assert.strictEqual(value(probe, d, "team"), "billing")
    assert.closeTo(value(probe, d, "urgency") as number, 0.51 + 2 * 0.05, 1e-12)
    assert.deepStrictEqual([d.usage.inputTokens, d.usage.outputTokens, d.usage.totalTokens], [376, 0, 376])
  })
  it("attributes an unnamed refusal by position", () => {
    const spec: Codec.CallSpec = {
      model: "gpt-6-luna",
      state: "s",
      questions: [{ id: "vague", question: Q.boolean("?") }, { id: "n", question: Q.boolean("n?") }]
    }
    const d = decode(spec, Fixture.json("openai-refusal-200"))
    assert.strictEqual(d.answers.get("vague")?._tag, "Refused")
    assert.strictEqual(value(spec, d, "n"), 0.1)
  })
  it("matches by name when the count differs, leaving unattributable answers out", () => {
    const d = decode(probe, { model: "m", answers: [{ type: "refusal", name: null }, { type: "predicate", name: "refund", probability: 0.2 }] })
    assert.strictEqual(value(probe, d, "refund"), 0.2)
    assert.isFalse(d.answers.has("team"))
    assert.isFalse(d.answers.has("urgency"))
  })
  it("a positional answer under a different name is Malformed", () => {
    const d = decode(probe, {
      answers: [
        { type: "predicate", name: "team", probability: 0.5 },
        { type: "choice", name: "team", choice: "billing" },
        { type: "refusal", name: "urgency" }
      ]
    })
    assert.strictEqual(d.answers.get("refund")?._tag, "Malformed")
    assert.strictEqual(d.answers.get("team")?._tag, "Candidate")
    assert.strictEqual(d.answers.get("urgency")?._tag, "Refused")
  })
  it("an envelope without an answers array is a CodecError", () => {
    assert.isTrue(Result.isFailure(OpenAiDecisions.codec.decode(probe, Fixture.json("openai-400"))))
  })
})
