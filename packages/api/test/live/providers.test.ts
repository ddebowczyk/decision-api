/**
 * Live calls to TypeSafe, Perplexity and OpenAI. Each provider is skipped
 * when its key is absent. Prints values and request ids, never keys.
 */
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Redacted, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { type Answer, Decision, Engine, Fallback, Q } from "../../src/index.ts"
import { Provider } from "../../src/providers/index.ts"
import { Triage, triageInput } from "../fixtures/triage.ts"

const has = (k: string) => (process.env[k] ?? "").length > 0
const live = (p: Provider.Provider) => Engine.layerFor(p).pipe(Layer.provide(FetchHttpClient.layer))

const report = (label: string, r: Engine.DecisionResult) => {
  const answers = Object.entries(r.answers as Record<string, Answer.Any>).map(([id, a]) =>
    [id, a.status === "answered" ? a.value : a.status, a.status === "answered" ? a.corrections : []]
  )
  console.log(JSON.stringify({
    label,
    deployment: r.deployment,
    resolved: (Object.values(r.answers as Record<string, Answer.Any>)[0])?.origin.resolvedModel ?? null,
    usage: r.usage,
    attempts: r.attempts.map((a) => ({ status: a.status, requestId: a.requestId, ms: a.durationMillis, outcome: a.outcome })),
    answers
  }))
}

const expectAllAnswered = (r: Engine.DecisionResult<typeof Triage>) => {
  for (const [id, a] of Object.entries(r.answers as Record<string, Answer.Any>)) {
    assert.strictEqual(a.status, "answered", `${id}: ${a.status === "error" ? a.problem : a.status === "refused" ? a.reason : ""}`)
  }
  const team = r.answers.team
  if (team.status === "answered") assert.include(["billing", "technical", "sales"], team.value)
}

describe.runIf(has("TYPESAFE_API_KEY"))("TypeSafe live", () => {
  it.live("decides the triage example and reports the resolved model", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("typesafe", r)
      expectAllAnswered(r)
      assert.match(r.answers.team.origin.resolvedModel ?? "", /^jev-1\./)
      assert.isNotNull(r.attempts[0]?.requestId ?? null)
      assert.isDefined(r.usage.inputTokens)
    }).pipe(Effect.provide(live(Provider.typesafe({ model: "jev-latest" })))))

  it.live("a bad key is an AuthenticationError with the provider's message", () =>
    Effect.gen(function*() {
      const e = yield* Effect.flip(Engine.decide(Triage, triageInput))
      assert.isTrue(e._tag === "AiError" && e.reason._tag === "AuthenticationError", String(e))
    }).pipe(Effect.provide(live(Provider.typesafe({ apiKey: Redacted.make("bad-key") })))))
})

describe.runIf(has("PERPLEXITY_API_KEY"))("Perplexity live", () => {
  it.live("splits an independent definition into isolated calls", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("perplexity", r)
      expectAllAnswered(r)
      assert.strictEqual(r.attempts.length, 3)
      assert.isNull(r.answers.team.origin.resolvedModel)
    }).pipe(Effect.provide(live(Provider.perplexity({ allow: ["split-for-isolation"] })))))

  it.live("asks a joint definition in one call", () =>
    Effect.gen(function*() {
      const Joint = Decision.make("refund-and-team", {
        revision: "1",
        mode: "joint",
        input: Schema.String,
        questions: [
          ["refund", Q.boolean("Is the customer asking for money back?")],
          ["team", Q.choice("Given whether it is a refund, which team owns it?", ["billing", "technical"])]
        ]
      })
      const r = yield* Engine.decide(Joint, "I was charged twice. Please refund it.")
      report("perplexity-joint", r)
      assert.strictEqual(r.attempts.length, 1)
      assert.strictEqual(r.answers.team.status, "answered")
    }).pipe(Effect.provide(live(Provider.perplexity()))))
})

describe.runIf(has("OPENAI_API_KEY"))("OpenAI live", () => {
  it.live("decides with object state stringified", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput)
      report("openai", r)
      expectAllAnswered(r)
      assert.deepStrictEqual(r.answers.team.origin.lowerings, ["stringify-state"])
    }).pipe(Effect.provide(live(Provider.openai({ allow: ["stringify-state"] })))))
})

describe.runIf(has("OPENAI_API_KEY"))("Fallback live", () => {
  it.live("a rejected key on the first engine falls back to OpenAI", () =>
    Effect.gen(function*() {
      const r = yield* Engine.decide(Triage, triageInput).pipe(
        Fallback.run(Fallback.make(
          live(Provider.typesafe({ apiKey: Redacted.make("bad-key") })),
          live(Provider.openai({ allow: ["stringify-state"] }))
        ))
      )
      report("fallback", r)
      assert.strictEqual(r.deployment, "openai@2026-10-18")
      assert.deepStrictEqual(r.attempts.map((a) => a.outcome), ["failed", "ok"])
      assert.strictEqual(r.attempts[0]?.status, 401)
    }))
})
