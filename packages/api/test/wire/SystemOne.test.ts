import { assert, describe, it } from "@effect/vitest"
import { Result } from "effect"
import { type Codec, Deployment, Q, SystemOne, Validate, Wire } from "../../src/index.ts"
import * as Fixture from "../fixtures/wire.ts"

/** The spec behind the live probe of 2026-10-18. */
const probe: Codec.CallSpec = {
  model: "jev-latest",
  state: "I was charged twice for my order. Please refund it.",
  questions: [
    { id: "refund", question: Q.boolean("Is the customer asking for money back?") },
    {
      id: "team",
      question: Q.choice("Which team?", [["billing", "Payments"], ["technical", "Bugs"], ["10", "numeric-key option"], ["2", null]])
    },
    { id: "urgency", question: Q.score("How urgent?", ["Routine", "Soon", "Immediate"]) }
  ]
}

const decode = (spec: Codec.CallSpec, body: unknown): Codec.Decoded => {
  const r = SystemOne.codec.decode(spec, body)
  if (Result.isFailure(r)) return assert.fail(r.failure.message)
  return r.success
}

const validated = (spec: Codec.CallSpec, d: Codec.Decoded, id: string) => {
  const a = d.answers.get(id)
  if (a?._tag !== "Candidate") return assert.fail(`no candidate for ${id}`)
  const q = spec.questions.find((x) => x.id === id)!.question
  const v = Validate.answer(q, a.candidate, Deployment.typesafe.tolerance)
  if (v._tag !== "Valid") return assert.fail(v.problem)
  return { v, native: a.native }
}

describe("SystemOne.encode", () => {
  it("matches the request golden byte for byte, keeping \"10\" before \"2\"", () => {
    assert.strictEqual(Wire.stringify(SystemOne.codec.encode(probe)), Fixture.text("system-one-request"))
  })
  it("writes boolean criteria only when given, true before false", () => {
    const spec: Codec.CallSpec = {
      model: "m",
      state: { a: 1 },
      questions: [
        { id: "x", question: Q.boolean("x?", { false: "no", true: "yes" }) },
        { id: "y", question: Q.boolean("y?") }
      ]
    }
    assert.strictEqual(
      Wire.stringify(SystemOne.codec.encode(spec)),
      `{"model":"m","state":{"a":1},"questions":{"x":{"type":"noul","instructions":"x?","criteria":{"true":"yes","false":"no"}},"y":{"type":"noul","instructions":"y?"}}}`
    )
  })
  it("sends level descriptions when levels have them", () => {
    const spec: Codec.CallSpec = { model: "m", state: "s", questions: [{ id: "u", question: Q.score("u?", [["low", "Can wait"], "high"]) }] }
    assert.include(Wire.stringify(SystemOne.codec.encode(spec)), `"criteria":["Can wait","high"]`)
  })
})

describe("SystemOne.decode, TypeSafe live capture", () => {
  const d = decode(probe, Fixture.json("typesafe-200"))
  it("reports the resolved model and usage", () => {
    assert.strictEqual(d.reportedModel, "jev-1.13.0")
    assert.deepStrictEqual([d.usage.inputTokens, d.usage.outputTokens, d.usage.totalTokens], [386, 77, 463])
  })
  it("boolean from noul", () => {
    assert.strictEqual(validated(probe, d, "refund").v.value, 0.99)
  })
  it("choice keeps label and distribution, including integer-like labels", () => {
    const { v, native } = validated(probe, d, "team")
    assert.strictEqual(v.value, "billing")
    assert.deepStrictEqual(v.evidence.kind === "finite-distribution" && v.evidence.outcomes, ["billing", "technical", "10", "2"])
    assert.strictEqual(native.confidence, 1)
  })
  it("score maps level indices to labels and records the rounded native score", () => {
    const { v, native } = validated(probe, d, "urgency")
    assert.closeTo(v.value as number, 0.73 + 2 * 0.16, 1e-12)
    assert.match(v.corrections[0]!, /native score 1.06/)
    assert.strictEqual(native.confidence, 0.59)
    assert.deepStrictEqual(native.fields["legend"], { "0": "Routine", "1": "Soon", "2": "Immediate" })
  })
})

describe("SystemOne.decode, Perplexity live capture", () => {
  const spec = { ...probe, model: "pplx-decider-latest" }
  const d = decode(spec, Fixture.json("perplexity-200"))
  it("echoes the alias and has no total", () => {
    assert.strictEqual(d.reportedModel, "pplx-decider-latest")
    assert.strictEqual(d.usage.totalTokens, 163 + 3)
  })
  it("validates all three answers", () => {
    for (const id of ["refund", "team", "urgency"]) validated(spec, d, id)
  })
})

describe("SystemOne.decode, failures", () => {
  it("an envelope without answers is a CodecError", () => {
    const r = SystemOne.codec.decode(probe, { model: "x" })
    assert.isTrue(Result.isFailure(r))
    if (Result.isFailure(r)) assert.strictEqual(r.failure._tag, "CodecError")
  })
  it("a missing answer has no entry; a mistyped one is Malformed", () => {
    const d = decode(probe, { answers: { refund: { type: "choice", choice: "x" }, team: "nope" } })
    assert.strictEqual(d.answers.get("refund")?._tag, "Malformed")
    assert.strictEqual(d.answers.get("team")?._tag, "Malformed")
    assert.isFalse(d.answers.has("urgency"))
    assert.isNull(d.reportedModel)
    assert.isUndefined(d.usage.inputTokens)
  })
  it("an out-of-range level index becomes an unknown outcome, so validation rejects it", () => {
    const spec: Codec.CallSpec = { model: "m", state: "s", questions: [{ id: "u", question: Q.score("u?", ["a", "b"]) }] }
    const d = decode(spec, { answers: { u: { type: "score", score: 1, probabilities: { "0": 0.5, "5": 0.5 } } } })
    const a = d.answers.get("u")
    if (a?._tag !== "Candidate") return assert.fail("expected candidate")
    const v = Validate.answer(spec.questions[0]!.question, a.candidate, 1e-3)
    assert.isTrue(v._tag === "Invalid" && /unknown outcome "#5"/.test(v.problem))
  })
})
