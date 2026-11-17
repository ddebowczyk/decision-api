import { assert, describe, it } from "@effect/vitest"
import { Schema } from "effect"
import { createHash } from "node:crypto"
import { Decision, Identity, Q, Wire } from "../src/index.ts"
import { Triage } from "./fixtures/triage.ts"

describe("Wire.stringify", () => {
  it("writes ordered objects in entry order, even numeric-looking keys", () => {
    const body = Wire.obj([["billing", "Payments"], ["10", null], ["2", "two"]])
    assert.strictEqual(Wire.stringify(body), `{"billing":"Payments","10":null,"2":"two"}`)
    // Plain JS objects would have reordered these keys:
    assert.strictEqual(JSON.stringify({ billing: "Payments", "10": null, "2": "two" }), `{"2":"two","10":null,"billing":"Payments"}`)
  })
  it("nests plain JSON, arrays and ordered objects", () => {
    const v = Wire.obj([["a", [1, true, { x: "y" }]], ["b", Wire.obj([["z", 1.5]])]])
    assert.strictEqual(Wire.stringify(v), `{"a":[1,true,{"x":"y"}],"b":{"z":1.5}}`)
  })
  it("rejects non-finite numbers", () => {
    assert.throws(() => Wire.stringify([Number.NaN]), /non-finite/)
    assert.throws(() => Wire.stringify(Wire.obj([["a", Infinity]])), /non-finite/)
  })
  it("escapes strings like JSON.stringify", () => {
    const s = "quote\" back\\ nl\n tab\t uni  emoji😀"
    assert.strictEqual(Wire.stringify(s), JSON.stringify(s))
  })
})

describe("Identity.sha256", () => {
  it("matches NIST vectors", () => {
    assert.strictEqual(Identity.sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    assert.strictEqual(Identity.sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    assert.strictEqual(
      Identity.sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    )
  })
  it("hashes UTF-8 bytes", () => {
    for (const s of ["zażółć", "emoji😀", "x".repeat(55), "x".repeat(56), "x".repeat(64), "x".repeat(1000)]) {
      assert.strictEqual(Identity.sha256(s), createHash("sha256").update(s, "utf8").digest("hex"))
    }
    assert.notStrictEqual(Identity.sha256("zażółć"), Identity.sha256("zazolc"))
  })
})

describe("Identity.definition", () => {
  const make = (questions: Decision.Entries, revision = "1", mode: Decision.Mode = "independent") =>
    Decision.make("d", { revision, mode, input: Schema.String, questions })

  it("is deterministic", () => {
    assert.strictEqual(Identity.definition(Triage), Identity.definition(Triage))
    assert.match(Identity.definition(Triage), /^def1:[0-9a-f]{64}$/)
  })
  it("changes with option order, question order, revision, mode and text", () => {
    const base = Identity.definition(make([["a", Q.choice("x", ["p", "q"])], ["b", Q.boolean("y")]]))
    const variants = [
      make([["a", Q.choice("x", ["q", "p"])], ["b", Q.boolean("y")]]),
      make([["b", Q.boolean("y")], ["a", Q.choice("x", ["p", "q"])]]),
      make([["a", Q.choice("x", ["p", "q"])], ["b", Q.boolean("y")]], "2"),
      make([["a", Q.choice("x", ["p", "q"])], ["b", Q.boolean("y")]], "1", "joint"),
      make([["a", Q.choice("x!", ["p", "q"])], ["b", Q.boolean("y")]])
    ].map(Identity.definition)
    for (const v of variants) assert.notStrictEqual(v, base)
    assert.strictEqual(new Set(variants).size, variants.length)
  })
  it("distinguishes \"10\",\"2\" from \"2\",\"10\"", () => {
    assert.notStrictEqual(
      Identity.definition(make([["a", Q.choice("x", ["10", "2"])]])),
      Identity.definition(make([["a", Q.choice("x", ["2", "10"])]]))
    )
  })
  it("separates domains: the same text hashed as input differs from a definition", () => {
    assert.notStrictEqual(Identity.input("x").slice(5), Identity.definition(make([["a", Q.boolean("x")]])).slice(5))
    assert.match(Identity.input({ a: 1 }), /^inp1:[0-9a-f]{64}$/)
  })
})

describe("Identity.input and execution", () => {
  it("ignores plain-object key order but not array order", () => {
    assert.strictEqual(Identity.input({ a: 1, b: [1, 2] }), Identity.input({ b: [1, 2], a: 1 }))
    assert.notStrictEqual(Identity.input({ a: 1, b: [1, 2] }), Identity.input({ a: 1, b: [2, 1] }))
  })
  it("changes with any execution part", () => {
    const parts: Identity.ExecutionParts = {
      definition: Identity.definition(Triage),
      input: Identity.input({ subject: "s" }),
      provider: "typesafe",
      deployment: "typesafe-hosted@2026-10-18",
      model: "jev-latest",
      lowerings: []
    }
    const base = Identity.execution(parts)
    assert.match(base, /^exe1:[0-9a-f]{64}$/)
    assert.notStrictEqual(Identity.execution({ ...parts, model: "jev-preview" }), base)
    assert.notStrictEqual(Identity.execution({ ...parts, lowerings: ["stringify-state"] }), base)
  })
})
