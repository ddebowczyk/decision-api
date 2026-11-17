import { assert, describe, it } from "@effect/vitest"
import { Q, Validate } from "../src/index.ts"

const tol = 1e-3
const team = Q.choice("Which team?", ["billing", "technical", "sales"])
const urgency = Q.score("How urgent?", ["routine", "soon", "immediate"])
const refund = Q.boolean("Refund?")

const valid = (v: Validate.Verdict) => {
  if (v._tag !== "Valid") assert.fail(`expected Valid, got ${v.problem}`)
  return v
}
const invalid = (v: Validate.Verdict) => {
  if (v._tag !== "Invalid") assert.fail("expected Invalid")
  return v.problem
}

describe("Validate distributions", () => {
  it("accepts an exact distribution without corrections", () => {
    const v = valid(Validate.answer(team, { label: "billing", probabilities: [["billing", 0.7], ["technical", 0.2], ["sales", 0.1]] }, tol))
    assert.strictEqual(v.value, "billing")
    assert.deepStrictEqual(v.corrections, [])
    assert.deepStrictEqual(v.evidence, {
      kind: "finite-distribution",
      outcomes: ["billing", "technical", "sales"],
      probabilities: { billing: 0.7, technical: 0.2, sales: 0.1 }
    })
  })
  it("orders evidence by definition order, not provider order", () => {
    const v = valid(Validate.answer(team, { probabilities: [["sales", 0.1], ["billing", 0.7], ["technical", 0.2]] }, tol))
    assert.deepStrictEqual(v.evidence.kind === "finite-distribution" && v.evidence.outcomes, ["billing", "technical", "sales"])
  })
  it("renormalizes within tolerance and records it", () => {
    const v = valid(Validate.answer(team, { probabilities: [["billing", 0.7004], ["technical", 0.2], ["sales", 0.1]] }, tol))
    assert.strictEqual(v.corrections.length, 1)
    assert.match(v.corrections[0]!, /renormalized/)
    const d = v.evidence.kind === "finite-distribution" ? v.evidence : assert.fail("no distribution")
    assert.closeTo(d.outcomes.reduce((s, o) => s + d.probabilities[o]!, 0), 1, 1e-12)
  })
  it("rejects mass outside tolerance", () => {
    assert.match(invalid(Validate.answer(team, { probabilities: [["billing", 0.8], ["technical", 0.2], ["sales", 0.1]] }, tol)), /sum/)
  })
  it("rejects out-of-range, non-finite, unknown, duplicate and missing outcomes", () => {
    const cases: Array<[ReadonlyArray<readonly [string, number]>, RegExp]> = [
      [[["billing", 1.1], ["technical", -0.1], ["sales", 0]], /range/],
      [[["billing", Number.NaN], ["technical", 0.5], ["sales", 0.5]], /range/],
      [[["billing", 0.5], ["support", 0.5], ["sales", 0]], /unknown/],
      [[["billing", 0.5], ["billing", 0.5], ["sales", 0]], /twice/],
      [[["billing", 0.5], ["technical", 0.5]], /missing/]
    ]
    for (const [probabilities, re] of cases) assert.match(invalid(Validate.answer(team, { probabilities }, tol)), re)
  })
})

describe("Validate per primitive", () => {
  it("choice: value is the mode when no label is given; ties go to definition order", () => {
    assert.strictEqual(valid(Validate.answer(team, { probabilities: [["billing", 0.4], ["technical", 0.4], ["sales", 0.2]] }, tol)).value, "billing")
  })
  it("choice: a label that is not a most probable outcome is invalid", () => {
    assert.match(
      invalid(Validate.answer(team, { label: "sales", probabilities: [["billing", 0.7], ["technical", 0.2], ["sales", 0.1]] }, tol)),
      /inconsistent/
    )
  })
  it("choice: a label without probabilities is label-only evidence", () => {
    const v = valid(Validate.answer(team, { label: "technical" }, tol))
    assert.strictEqual(v.value, "technical")
    assert.deepStrictEqual(v.evidence, { kind: "label-only" })
  })
  it("choice: unknown label or nothing at all is invalid", () => {
    assert.match(invalid(Validate.answer(team, { label: "support" }, tol)), /unknown/)
    assert.match(invalid(Validate.answer(team, {}, tol)), /no label/)
  })
  it("score: value is recomputed from the distribution; a differing native score is recorded", () => {
    const v = valid(Validate.answer(urgency, { probabilities: [["routine", 0.2], ["soon", 0.5], ["immediate", 0.3]], nativeScore: 2 }, tol))
    assert.closeTo(v.value as number, 1.1, 1e-12)
    assert.strictEqual(v.corrections.length, 1)
    assert.match(v.corrections[0]!, /native score 2/)
  })
  it("score: a matching native score is not a correction", () => {
    const v = valid(Validate.answer(urgency, { probabilities: [["routine", 0.2], ["soon", 0.5], ["immediate", 0.3]], nativeScore: 1.1 }, tol))
    assert.deepStrictEqual(v.corrections, [])
  })
  it("score and boolean need a distribution", () => {
    assert.match(invalid(Validate.answer(urgency, { label: "soon" }, tol)), /distribution/)
    assert.match(invalid(Validate.answer(refund, {}, tol)), /distribution/)
  })
  it("boolean: value is P(true)", () => {
    assert.strictEqual(valid(Validate.answer(refund, { probabilities: [["true", 0.9], ["false", 0.1]] }, tol)).value, 0.9)
  })
  it("normalization is idempotent", () => {
    const once = valid(Validate.answer(team, { probabilities: [["billing", 0.7004], ["technical", 0.2], ["sales", 0.1]] }, tol))
    const d = once.evidence.kind === "finite-distribution" ? once.evidence : assert.fail("no distribution")
    const twice = valid(Validate.answer(team, { probabilities: d.outcomes.map((o) => [o, d.probabilities[o]!] as const) }, tol))
    assert.deepStrictEqual(twice.corrections, [])
    assert.deepStrictEqual(twice.evidence, once.evidence)
  })
})
