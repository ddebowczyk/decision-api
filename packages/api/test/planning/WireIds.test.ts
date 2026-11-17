import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Result, Schema } from "effect"
import { Decision, Deployment, Engine, Identity, type Json, Ledger, Planner, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { ScriptedHttp } from "../../src/testing/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"
import { typesafeTriage } from "../fixtures/triage-replies.ts"

/** Inputs here are already JSON, so preparation is the identity. */
const prepare = <D extends Decision.Any>(d: D, input: Json): Decision.Prepared<D> => ({
  _tag: "PreparedDecision",
  definition: d,
  definitionId: Identity.definition(d),
  input,
  inputId: Identity.input(input)
})

describe("wireIds: neutral", () => {
  const neutral = Provider.typesafe({ apiKey: Redacted.make("sk-test"), wireIds: "neutral" })
  const reply = {
    model: "jev-1.13.0",
    answers: { q0: typesafeTriage.answers.refund, q1: typesafeTriage.answers.team, q2: typesafeTriage.answers.urgency }
  }

  it.effect("sends q0, q1, … and maps answers, origins and the ledger back to the caller's ids", () =>
    Effect.gen(function*() {
      const [r, entries] = yield* Ledger.capture(Engine.decide(Triage, triageInput))
      const [request] = yield* ScriptedHttp.Requests.use((x) => x.all)
      const body = request!.body!
      for (const id of ["refund", "team", "urgency"]) assert.notInclude(body, `"${id}"`)
      assert.include(body, `"q0"`)
      assert.isTrue(r.answers.team.status === "answered" && r.answers.team.value === "billing")
      assert.strictEqual(r.answers.team.origin.questionId, "team")
      assert.deepStrictEqual(entries[0]!.questionIds, ["refund", "team", "urgency"])
    }).pipe(Effect.provide(Engine.layerFor(neutral).pipe(Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: reply }]))))))

  it("is part of the plan and its fingerprint", () => {
    const prepared = prepare(Triage, triageInput)
    const a = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe))
    const b = Result.getOrThrow(Planner.plan(prepared, Deployment.typesafe, { wireIds: "neutral" }))
    assert.strictEqual(a.wireIds, "caller")
    assert.strictEqual(b.wireIds, "neutral")
    assert.notStrictEqual(a.fingerprint, b.fingerprint)
    assert.deepStrictEqual(b.calls[0]!.questionIds, ["refund", "team", "urgency"])
    assert.deepStrictEqual(b.calls[0]!.spec.questions.map((q) => q.id), ["q0", "q1", "q2"])
  })
})

describe("option order on the wire", () => {
  const Ordered = Decision.make("ordered", {
    revision: "1",
    input: Schema.String,
    questions: [
      ["pick", Q.choice("Pick one", ["907", "81", "zeta", "alpha"])],
      ["level", Q.score("How much", ["high", "low", "mid"])]
    ]
  })
  const snapshots = [
    Deployment.typesafe,
    Deployment.basal,
    Deployment.levanto,
    Deployment.openai,
    Deployment.clef,
    Deployment.fastino,
    Deployment.jeff,
    Deployment.laya,
    Deployment.classifierDev
  ]
  for (const d of snapshots) {
    it(`${d.id}: choice options and score levels in posed order, integer-like labels included`, () => {
      const p = Planner.plan(prepare(Ordered, "some state"), d, { allow: ["split-for-isolation"] })
      if (Result.isFailure(p)) return assert.fail(`${d.id}: ${p.failure.message}`)
      const bodies = p.success.calls.map((c) => c.body).join("\n")
      const positions = (labels: ReadonlyArray<string>) => labels.map((l) => bodies.indexOf(`${l}`))
      const choice = positions(["907", "81", "zeta", "alpha"])
      const levels = positions(["high", "low", "mid"])
      for (const xs of [choice, levels]) {
        assert.isTrue(xs.every((x) => x >= 0), `${d.id}: every label sent (${xs})`)
        assert.deepStrictEqual([...xs].sort((a, b) => a - b), xs, `${d.id}: order kept (${xs})`)
      }
    })
  }
})
