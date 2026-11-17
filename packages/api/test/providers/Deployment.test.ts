import { assert, describe, it } from "@effect/vitest"
import { Deployment, Q } from "../../src/index.ts"

const all = [Deployment.typesafe, Deployment.basal, Deployment.perplexity, Deployment.openai]

describe("Deployment snapshots", () => {
  it("every snapshot cites sources, has a versioned key and core primitives", () => {
    for (const d of all) {
      assert.isAbove(d.sources.length, 0, d.id)
      assert.match(Deployment.key(d), /^[a-z-]+@\d{4}-\d{2}-\d{2}$/)
      assert.deepStrictEqual(d.primitives.map((p) => p.kind).sort(), ["boolean", "choice", "score"])
      assert.isAbove(d.tolerance, 0)
    }
  })
  it("records grouping semantics per provider", () => {
    assert.strictEqual(Deployment.typesafe.grouping, "independent")
    assert.strictEqual(Deployment.perplexity.grouping, "joint")
    assert.strictEqual(Deployment.openai.grouping, "independent")
    assert.strictEqual(Deployment.openai.groupingSource, "documented")
  })
  it("records structured description and state support", () => {
    assert.isTrue(Deployment.typesafe.structuredDescriptions)
    assert.isTrue(Deployment.perplexity.structuredState)
    assert.isFalse(Deployment.openai.structuredDescriptions)
    assert.isFalse(Deployment.openai.structuredState)
    assert.isFalse(Deployment.basal.structuredDescriptions)
  })
  it("is plain JSON, so agents can read it", () => {
    for (const d of all) assert.deepStrictEqual(JSON.parse(JSON.stringify(d)), d)
  })
  it("with() overrides fields and bumps nothing implicitly", () => {
    const local = Deployment.with(Deployment.basal, { baseUrl: "http://127.0.0.1:9000" })
    assert.strictEqual(local.baseUrl, "http://127.0.0.1:9000")
    assert.strictEqual(Deployment.key(local), Deployment.key(Deployment.basal))
  })
})

describe("Deployment.fits", () => {
  it("accepts questions within bounds", () => {
    assert.deepStrictEqual(Deployment.fits(Deployment.typesafe, Q.score("u", ["a", "b", "c"])), [])
  })
  it("reports too many levels or options with the bound and its evidence", () => {
    const levels = Array.from({ length: 11 }, (_, i) => `l${i}`)
    const [p] = Deployment.fits(Deployment.typesafe, Q.score("u", levels))
    assert.match(p!, /11 levels.*at most 10/)
  })
  it("reports an unsupported primitive", () => {
    const odd = { kind: "box", version: "1", instructions: "x" } as const
    assert.match(Deployment.fits(Deployment.openai, odd)[0]!, /does not support box/)
  })
})
