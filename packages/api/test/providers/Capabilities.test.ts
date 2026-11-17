import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Result } from "effect"
import { Capabilities, Decision, Deployment, Engine, Planner, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { typesafeTriage } from "../fixtures/triage-replies.ts"

const prepared = Effect.runSync(Decision.prepare(Triage, triageInput))
const one = { value: 1, evidence: "exact" } as const
const key = Redacted.make("test-key")

describe("provider + model capabilities", () => {
  it("decodes metadata and rejects invalid limits before they can reach partitioning", () => {
    const metadata: unknown = JSON.parse(JSON.stringify(Capabilities.builtIn))
    assert.isTrue(Result.isSuccess(Capabilities.decode(metadata)))
    assert.isTrue(Result.isFailure(Capabilities.decode([{ provider: "levanto", model: "sage" }])))
    assert.throws(() => Capabilities.override(Capabilities.builtIn, "levanto", "levanto-sage-2", {
      capabilities: { limits: { questionsPerCall: { value: 0, evidence: "exact" } } }
    }))
    const bad = { ...Capabilities.declare(Deployment.levanto), capabilities: {
      ...Capabilities.declare(Deployment.levanto).capabilities, limits: { ...Deployment.levanto.limits, questionsPerCall: { value: -1, evidence: "exact" } }
    } } as Capabilities.Declaration
    assert.throws(() => Provider.levanto({ capabilities: [bad] }), /capabilities/i)
    const planned = Planner.plan(prepared, Deployment.levanto, { capabilities: [bad] })
    assert.isTrue(Result.isFailure(planned) && planned.failure.reason === "provider-constraint")
  })

  it("isolates identical model names served by different providers", () => {
    const left = Capabilities.declare(Deployment.typesafe, "shared")
    const right = Capabilities.declare(Deployment.levanto, "shared")
    const catalog = Capabilities.override([left, right], "levanto", "shared", {
      capabilities: { limits: { questionsPerCall: one } }
    })
    assert.strictEqual(Capabilities.get(catalog, "typesafe", "shared")!.capabilities.limits.questionsPerCall, "unknown")
    assert.deepStrictEqual(Capabilities.get(catalog, "levanto", "shared")!.capabilities.limits.questionsPerCall, one)
  })

  it("discovers static declarations as JSON, including aliases and provider-specific models", () => {
    const sage = Capabilities.get(Capabilities.builtIn, "levanto", "levanto-sage-2")!
    assert.strictEqual(sage.provider, "levanto")
    assert.strictEqual(sage.model, "levanto-sage-2")
    assert.deepStrictEqual(JSON.parse(JSON.stringify(sage)), sage)
    assert.isDefined(Capabilities.get(Capabilities.builtIn, "levanto", "sage-latest"))
    assert.strictEqual(Capabilities.get(Capabilities.builtIn, "cloudflare", "clef-flash")!.capabilities.limits.requestTokens !== "unknown", true)
    assert.isUndefined(Capabilities.get(Capabilities.builtIn, "typesafe", "levanto-sage-2"))
    assert.isUndefined(Capabilities.get(Capabilities.builtIn, "levanto", "future-model"))
    const flash = Provider.make(Deployment.clef, { model: "clef-flash", urlParams: { account_id: "test" } })
    assert.deepStrictEqual(flash.deployment.limits.requestTokens, Deployment.clefFlash.limits.requestTokens)
  })

  it("overrides one exact pair without changing siblings, aliases or static defaults", () => {
    const before = Capabilities.get(Capabilities.builtIn, "levanto", "levanto-sage-2")!
    const custom = Capabilities.override(Capabilities.builtIn, "levanto", "levanto-sage-2", {
      capabilities: { limits: { questionsPerCall: one } },
      features: { "acme.audit": { support: "supported", adapterSupport: "unknown", constraints: { region: "eu" } } }
    })
    const after = Capabilities.get(custom, "levanto", "levanto-sage-2")!
    assert.strictEqual(after.verification, "unknown")
    assert.deepStrictEqual(after.capabilities.limits.questionsPerCall, one)
    assert.strictEqual(after.capabilities.limits.bodyBytes, before.capabilities.limits.bodyBytes)
    assert.deepStrictEqual(after.features["acme.audit"]!.constraints, { region: "eu" })
    assert.deepStrictEqual(before.capabilities.limits.questionsPerCall, "unknown")
    assert.deepStrictEqual(Capabilities.get(custom, "levanto", "sage-latest"), Capabilities.get(Capabilities.builtIn, "levanto", "sage-latest"))
    assert.notStrictEqual(Capabilities.fingerprint(after), Capabilities.fingerprint(before))
  })

  it("can declare and use a new model at runtime with its own bounds", () => {
    const declaration = Capabilities.declare(Deployment.levanto, "sage-private")
    const catalog = Capabilities.override([declaration], "levanto", "sage-private", {
      version: "customer-1",
      verification: "unknown",
      capabilities: { limits: { questionsPerCall: one } }
    })
    const p = Provider.levanto({ model: "sage-private", capabilities: catalog })
    const plan = Result.getOrThrow(Planner.plan(prepared, p.deployment, { model: p.model, capabilities: catalog }))
    assert.strictEqual(plan.calls.length, 3)
    assert.strictEqual(plan.capabilities.model, "sage-private")
    assert.strictEqual(plan.capabilities.version, "customer-1")
  })

  it("does not borrow capabilities from another model or provider", () => {
    assert.throws(() => Provider.levanto({ model: "undeclared" }), /capabilities/)
    const plan = Planner.plan(prepared, Deployment.levanto, { model: "undeclared", capabilities: Capabilities.builtIn })
    assert.isTrue(Result.isFailure(plan) && plan.failure.reason === "unsupported")
    assert.throws(() => Capabilities.override([], "levanto", "missing", {}), /capabilities/)
    assert.throws(() => Capabilities.apply(Deployment.levanto, Capabilities.declare(Deployment.typesafe)), /Cannot apply/)
  })

  it("distinguishes provider support from implemented adapter support", () => {
    const sage = Capabilities.get(Capabilities.builtIn, "levanto", "levanto-sage-2")!
    assert.strictEqual(sage.features["reasoning"]!.support, "supported")
    assert.strictEqual(sage.features["reasoning"]!.adapterSupport, "unsupported")
    assert.strictEqual(sage.features["streaming"]!.support, "supported")
    assert.deepStrictEqual(Deployment.fits(Provider.levanto().deployment, Q.boolean("Safe?")), [])
  })

  it("honors legacy deployment overrides and self-hosted isolation settings", () => {
    assert.strictEqual(Provider.jeff({ isolate: "all" }).capabilities.capabilities.grouping, "independent")
    const d = Deployment.with(Deployment.typesafe, { limits: { ...Deployment.typesafe.limits, questionsPerCall: one } })
    assert.strictEqual(Result.getOrThrow(Planner.plan(prepared, d)).calls.length, 3)
  })

  it("fingerprints capability content even when the version is unchanged", () => {
    const catalog = Capabilities.override(Capabilities.builtIn, "typesafe", "jev-latest", {
      capabilities: { tolerance: 0.002 }
    })
    const original = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe))
    const changed = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe, { capabilities: catalog }))
    assert.notStrictEqual(changed.fingerprint, original.fingerprint)
    const preview = Planner.preview(changed) as Record<string, unknown>
    assert.deepStrictEqual(preview.capabilities, changed.capabilities)
  })

  it.effect("the engine uses runtime limits and exposes its resolved declaration", () =>
    Effect.gen(function*() {
      const catalog = Capabilities.override(Capabilities.builtIn, "typesafe", "jev-latest", {
        capabilities: { limits: { questionsPerCall: one } }
      })
      const p = Provider.typesafe({ apiKey: key, capabilities: catalog })
      const result = yield* Engine.decide(Triage, triageInput).pipe(Effect.provide(
        Engine.layerFor(p).pipe(Layer.provide(ScriptedHttp.layer([{ status: 200, body: typesafeTriage }])))
      ))
      assert.strictEqual(result.attempts.length, 3)
      assert.strictEqual(result.answers.team.status, "answered")
      assert.deepStrictEqual(p.capabilities.capabilities.limits.questionsPerCall, one)
    }))

  for (const patch of [{ tolerance: 0.002 }, { primitives: [] }] as const) {
    it.effect(`rejects old plans before HTTP even when new capabilities no longer support the decision: ${JSON.stringify(patch)}`, () =>
      Effect.gen(function*() {
        const old = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe))
        const failure = yield* Engine.Engine.use((e) => Effect.flip(e.execute(prepared, old)))
        assert.isTrue(failure._tag === "PlanError" && failure.reason === "stale-plan")
        const requests = yield* ScriptedHttp.Requests.use((r) => r.all)
        assert.strictEqual(requests.length, 0)
      }).pipe(Effect.provide(
        Engine.layerFor(Provider.typesafe({ apiKey: key, capabilities: Capabilities.override(Capabilities.builtIn, "typesafe", "jev-latest", {
          capabilities: patch
        }) })).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: typesafeTriage }])))
      )))
  }
})
