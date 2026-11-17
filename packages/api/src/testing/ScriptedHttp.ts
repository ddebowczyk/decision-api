/**
 * A scripted `HttpClient` for tests: replies in order, records every request.
 * Credentials in recorded requests are redacted.
 *
 * @since 0.1.0
 */
import { Context, Effect, Layer, Ref } from "effect"
import { HttpClient, HttpClientError, type HttpClientRequest, HttpClientResponse } from "effect/http"

/**
 * One scripted reply. `body` objects are sent as JSON, strings verbatim.
 * `transport` fails the request before any response; `hang` never answers.
 *
 * @since 0.1.0
 */
export type Reply =
  | { readonly status: number; readonly body?: unknown; readonly headers?: Readonly<Record<string, string>> }
  | { readonly transport: string }
  | { readonly hang: true }

/** @since 0.1.0 */
export interface Recorded {
  readonly method: string
  readonly url: string
  readonly headers: Readonly<Record<string, string>>
  readonly body: string | undefined
}

/**
 * The requests the scripted client received, in order.
 *
 * @since 0.1.0
 */
export class Requests extends Context.Service<Requests, { readonly all: Effect.Effect<ReadonlyArray<Recorded>> }>()(
  "@decisions/api/testing/ScriptedHttp/Requests"
) {}

const decoder = new TextDecoder()
const bodyText = (req: HttpClientRequest.HttpClientRequest): string | undefined =>
  req.body._tag === "Uint8Array" ? decoder.decode(req.body.body) : undefined

/** Header names that may carry a credential: authorization, *-api-key, *token*, *secret*, cookies. */
const CREDENTIAL = /^(authorization|proxy-authorization|cookie|set-cookie)$|api[-_]?key|token|secret/i

const redact = (headers: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
  Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, CREDENTIAL.test(k) ? "<redacted>" : v]))

/**
 * Replies taken from `script` in order; the last reply repeats. A function
 * reply sees the request number (0-based) and the request.
 *
 * @example
 * const Http = ScriptedHttp.layer([{ status: 429, headers: { "retry-after": "1" } }, { status: 200, body: fixture }])
 *
 * @since 0.1.0
 */
export const layer = (
  script: ReadonlyArray<Reply | ((n: number, request: Recorded) => Reply)>
): Layer.Layer<HttpClient.HttpClient | Requests> =>
  Layer.effectContext(
    Effect.gen(function*() {
      const log = yield* Ref.make<ReadonlyArray<Recorded>>([])
      const client = HttpClient.make((request, url) =>
        Effect.gen(function*() {
          const recorded: Recorded = { method: request.method, url: url.toString(), headers: redact(request.headers), body: bodyText(request) }
          const n = (yield* Ref.getAndUpdate(log, (xs) => [...xs, recorded])).length
          const step = script[Math.min(n, script.length - 1)]
          if (step === undefined) return yield* Effect.die(new Error("ScriptedHttp: empty script"))
          const reply = typeof step === "function" ? step(n, recorded) : step
          if ("hang" in reply) return yield* Effect.never
          if ("transport" in reply) {
            return yield* Effect.fail(
              new HttpClientError.HttpClientError({ reason: new HttpClientError.TransportError({ request, description: reply.transport }) })
            )
          }
          const body = reply.body === undefined ? null : typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body)
          return HttpClientResponse.fromWeb(
            request,
            new Response(body, { status: reply.status, headers: { "content-type": "application/json", ...reply.headers } })
          )
        })
      )
      return Context.make(HttpClient.HttpClient, client).pipe(Context.add(Requests, Requests.of({ all: Ref.get(log) })))
    })
  )
