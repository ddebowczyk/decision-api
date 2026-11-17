import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Redacted, Result } from "effect"
import { HttpClient, HttpClientResponse } from "effect/http"
import { Capabilities, Decision, Deployment, Engine, Errors, Planner, Transport } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"
import { ScriptedHttp } from "../src/testing/index.ts"
import { Triage, triageInput } from "./fixtures/triage.ts"
import { typesafeTriage } from "./fixtures/triage-replies.ts"

const prepared = Effect.runSync(Decision.prepare(Triage, triageInput))
const key = Redacted.make("sk-test-secret")

const headerAuth = Deployment.with(Deployment.typesafe, { id: "header-auth", auth: { scheme: "header", name: "X-API-Key" } })
const templated = Deployment.with(Deployment.typesafe, {
  id: "templated",
  baseUrl: "https://api.example.com/accounts/{account_id}/ai",
  path: "/run/@cf/vendor/{model}"
})
const callOn = (d: Deployment.Snapshot, model?: string) =>
  Result.getOrThrow(Planner.plan(prepared, d, model !== undefined ? { model, capabilities: [Capabilities.declare(d, model)] } : {})).calls[0]!

const capture = () => {
  const seen: Array<{ url: string; headers: Readonly<Record<string, string>> }> = []
  const layer = Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((req, url) => {
      seen.push({ url: url.toString(), headers: req.headers })
      return Effect.succeed(HttpClientResponse.fromWeb(req, new Response("{}", { status: 200 })))
    })
  )
  return { seen, layer }
}

describe("auth schemes", () => {
  it.effect("a header scheme sends the raw key in that header and no bearer token", () =>
    Effect.gen(function*() {
      const { seen, layer } = capture()
      yield* Transport.send(headerAuth, callOn(headerAuth), { apiKey: key }).pipe(Effect.provide(layer))
      assert.strictEqual(seen[0]!.headers["x-api-key"], "sk-test-secret")
      assert.strictEqual(seen[0]!.headers["authorization"], undefined)
    }))

  it.effect("existing deployments keep bearer auth", () =>
    Effect.sync(() => {
      for (const d of [Deployment.typesafe, Deployment.perplexity, Deployment.openai, Deployment.basal]) {
        assert.deepStrictEqual(d.auth, { scheme: "bearer" })
      }
    }))

  it.effect("ScriptedHttp redacts every credential-bearing header, not only authorization", () =>
    Effect.gen(function*() {
      const requests = yield* Transport.send(headerAuth, callOn(headerAuth), { apiKey: key }).pipe(
        Effect.andThen(ScriptedHttp.Requests.use((r) => r.all)),
        Effect.provide(ScriptedHttp.layer([{ status: 200, body: {} }]))
      )
      assert.strictEqual(requests[0]!.headers["x-api-key"], "<redacted>")
      assert.notInclude(JSON.stringify(requests), "sk-test-secret")
    }))
})

describe("URL templates", () => {
  it.effect("the model path segment is substituted per call and URL-encoded", () =>
    Effect.gen(function*() {
      const { seen, layer } = capture()
      const d = Deployment.with(templated, { baseUrl: "https://api.example.com" })
      yield* Transport.send(d, callOn(d, "a/b c"), { apiKey: key }).pipe(Effect.provide(layer))
      assert.strictEqual(seen[0]!.url, "https://api.example.com/run/@cf/vendor/a%2Fb%20c")
    }))

  it("Provider.make rejects a URL placeholder without a value, with a hint", () => {
    const e = (() => {
      try {
        Provider.make(templated, { apiKey: key })
      } catch (error) {
        return error
      }
    })()
    const x = Errors.explain(e)
    assert.strictEqual(x.tag, "ProviderError")
    assert.include(x.message, "account_id")
    assert.include(x.hint, "urlParams")
  })

  it.effect("the engine resolves URL params from Config once and sends to the resolved URL", () =>
    Effect.gen(function*() {
      yield* Engine.decide(Triage, triageInput)
      const requests = yield* ScriptedHttp.Requests.use((r) => r.all)
      assert.strictEqual(requests[0]!.url, "https://api.example.com/accounts/acc%201/ai/run/@cf/vendor/jev-latest")
    }).pipe(
      Effect.provide(
        Engine.layerFor(Provider.make(templated, { apiKey: key, urlParams: { account_id: Provider.param("TEST_ACCOUNT_ID") } })).pipe(
          Layer.provideMerge(ScriptedHttp.layer([{ status: 200, body: typesafeTriage }])),
          Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: { TEST_ACCOUNT_ID: "acc 1" } })))
        )
      )
    ))
})
