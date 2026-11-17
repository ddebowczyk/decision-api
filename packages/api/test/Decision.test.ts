import { assert, describe, expectTypeOf, it } from "@effect/vitest"
import { Schema } from "effect"
import { type Answer, Decision, Evidence, Q } from "../src/index.ts"
import { Triage } from "./fixtures/triage.ts"

describe("Decision.make", () => {
  it("keeps questions, options and levels in definition order", () => {
    assert.deepStrictEqual(Triage.questions.map(([id]) => id), ["refund", "team", "urgency"])
    assert.deepStrictEqual(Q.outcomes(Decision.question(Triage, "team")), ["billing", "technical", "sales"])
    assert.deepStrictEqual(Q.outcomes(Decision.question(Triage, "urgency")), ["routine", "soon", "immediate"])
    assert.strictEqual(Triage.mode, "independent")
  })

  it("keeps numeric-looking labels in the order given", () => {
    const d = Decision.make("n", {
      revision: "1",
      input: Schema.String,
      questions: [["q", Q.choice("Pick", ["10", "2", "b"])]]
    })
    assert.deepStrictEqual(Q.outcomes(Decision.question(d, "q")), ["10", "2", "b"])
  })

  const bad = (questions: Decision.Entries) => () =>
    Decision.make("bad", { revision: "1", input: Schema.String, questions })

  it("rejects duplicate question ids", () => {
    assert.throws(bad([["a", Q.boolean("x")], ["a", Q.boolean("y")]]), /duplicate question id "a"/)
  })
  it("rejects duplicate labels", () => {
    assert.throws(bad([["a", Q.choice("x", ["p", "p"])]]), /repeats label "p"/)
  })
  it("rejects a choice with one option and a score with one level", () => {
    assert.throws(bad([["a", Q.choice("x", ["p"])]]), /at least two options/)
    assert.throws(bad([["a", Q.score("x", ["low"])]]), /at least two levels/)
  })
  it("rejects an empty definition", () => {
    assert.throws(bad([]), /no questions/)
  })
  it("throws a tagged DefinitionError with a hint", () => {
    try {
      bad([["a", Q.boolean("x")], ["a", Q.boolean("y")]])()
      assert.fail("expected a throw")
    } catch (e) {
      assert.instanceOf(e, Decision.DefinitionError)
      assert.strictEqual((e as Decision.DefinitionError)._tag, "DefinitionError")
      assert.isString((e as Decision.DefinitionError).hint)
    }
  })
})

describe("type inference", () => {
  it("infers literal ids, labels and answer types", () => {
    type A = Decision.Answers<typeof Triage>
    expectTypeOf<keyof A>().toEqualTypeOf<"refund" | "team" | "urgency">()
    expectTypeOf<Decision.Values<typeof Triage>["team"]>().toEqualTypeOf<"billing" | "technical" | "sales">()
    expectTypeOf<Decision.Values<typeof Triage>["refund"]>().toEqualTypeOf<number>()
    expectTypeOf<Decision.Values<typeof Triage>["urgency"]>().toEqualTypeOf<number>()
    expectTypeOf<A["team"]>().toEqualTypeOf<
      Answer.Answer<"billing" | "technical" | "sales", Evidence.FiniteDistribution<"billing" | "technical" | "sales"> | Evidence.LabelOnly>
    >()
    expectTypeOf<Decision.Input<typeof Triage>>().toEqualTypeOf<{ readonly subject: string; readonly body: string }>()
  })

  it("narrows on status and evidence kind", () => {
    const use = (a: Decision.Answers<typeof Triage>["urgency"]) => {
      if (a.status === "answered") {
        expectTypeOf(a.value).toEqualTypeOf<number>()
        expectTypeOf(a.evidence.probabilities.immediate).toEqualTypeOf<number>()
      }
    }
    assert.isFunction(use)
  })
})

describe("Evidence", () => {
  const d = { kind: "finite-distribution", outcomes: ["a", "b", "c"], probabilities: { a: 0.2, b: 0.5, c: 0.3 } } as const
  it("computes mode, expected index, margin and entropy", () => {
    assert.strictEqual(Evidence.mode(d), "b")
    assert.closeTo(Evidence.expectedIndex(d), 0.5 + 0.6, 1e-12)
    assert.closeTo(Evidence.margin(d), 0.2, 1e-12)
    assert.closeTo(Evidence.entropy(d), -(0.2 * Math.log2(0.2) + 0.5 * Math.log2(0.5) + 0.3 * Math.log2(0.3)), 1e-12)
  })
})

