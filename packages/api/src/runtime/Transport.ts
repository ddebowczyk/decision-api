/**
 * One HTTP attempt for one planned call. No retries here: the engine owns
 * retry. Statuses become `AiError` reasons with the provider's own message,
 * request id and `Retry-After`; credentials are `Redacted` and never logged.
 *
 * @since 0.1.0
 */
import { Clock, Duration, Effect, Redacted } from "effect"
import * as AiError from "effect/ai/AiError"
import { HttpClient, HttpClientRequest } from "effect/http"
import * as Deployment from "../providers/deployment.ts"
import { isJsonObject } from "../wire/Json.ts"
import type * as Planner from "../planning/Planner.ts"

/** @since 0.1.0 */
export interface Options {
  /** Sent as the deployment's `auth` scheme says. `undefined` for local servers without auth. */
  readonly apiKey: Redacted.Redacted<string> | undefined
  /** Extra headers that do not change semantics, e.g. a long-context opt-in. */
  readonly headers?: Readonly<Record<string, string>> | undefined
  readonly timeout?: Duration.Input | undefined
}

/**
 * A successful exchange: the parsed JSON body and what the provider said
 * about the request.
 *
 * @since 0.1.0
 */
export interface Exchange {
  readonly status: number
  readonly body: unknown
  readonly requestId: string | null
  /** `x-ratelimit-*` headers, verbatim. */
  readonly rateLimit: Readonly<Record<string, string>>
}

const REQUEST_ID_HEADERS = ["x-request-id", "x-typesafe-request-id", "request-id", "x-respan-log-id", "cf-ray"]

/** The provider's own message from its error body, across the known envelopes. */
export const describeErrorBody = (body: unknown): string | undefined => {
  if (!isJsonObject(body)) return undefined
  const detail = body["detail"]
  if (typeof detail === "string") return detail
  if (isJsonObject(detail) && typeof detail["message"] === "string") {
    return typeof detail["error_type"] === "string" ? `${detail["error_type"]}: ${detail["message"]}` : detail["message"]
  }
  if (Array.isArray(detail)) {
    return detail
      .filter(isJsonObject)
      .map((d) => `${Array.isArray(d["loc"]) ? d["loc"].join(".") : "?"}: ${String(d["msg"])}`)
      .join("; ")
  }
  const error = body["error"]
  if (typeof error === "string") return typeof body["code"] === "string" ? `${body["code"]}: ${error}` : error
  if (isJsonObject(error) && typeof error["message"] === "string") {
    const kind = error["type"] ?? error["code"]
    return typeof kind === "string" ? `${kind}: ${error["message"]}` : error["message"]
  }
  // Cloudflare v4: `errors: [{ code, message }]`.
  const errors = body["errors"]
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.filter(isJsonObject).map((e) => (e["code"] !== undefined ? `${String(e["code"])}: ${String(e["message"])}` : String(e["message"]))).join("; ")
  }
  // Top-level `{ code, message }`, e.g. Fastino billing denials.
  if (typeof body["message"] === "string") return typeof body["code"] === "string" ? `${body["code"]}: ${body["message"]}` : body["message"]
  return undefined
}

/** The body inside the deployment's envelope, or the provider's message when the envelope reports failure. */
const unwrap = (envelope: Deployment.Envelope, body: unknown): { readonly body: unknown } | { readonly failure: string } => {
  if (envelope === "none") return { body }
  if (!isJsonObject(body) || body["success"] !== true) {
    return { failure: describeErrorBody(body) ?? "Cloudflare envelope without success: true" }
  }
  return { body: body["result"] }
}

/** `Retry-After` as seconds or an HTTP date; else `retry-after-ms` (Jeff). */
const retryAfter = (headers: Readonly<Record<string, string | undefined>>, nowMillis: number): Duration.Duration | undefined => {
  const header = headers["retry-after"]
  if (header === undefined) {
    const millis = Number(headers["retry-after-ms"] ?? Number.NaN)
    return Number.isFinite(millis) && millis >= 0 ? Duration.millis(millis) : undefined
  }
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return Duration.seconds(seconds)
  const at = Date.parse(header)
  return Number.isNaN(at) ? undefined : Duration.millis(Math.max(0, at - nowMillis))
}

const reasonFor = (status: number, description: string | undefined, metadata: AiError.ProviderMetadata, wait: Duration.Duration | undefined): AiError.AiErrorReason => {
  const common = { metadata, ...(description !== undefined ? { description } : {}) }
  switch (status) {
    case 400:
    case 413:
    case 415:
    case 422:
      return new AiError.InvalidRequestError(common)
    case 402:
      return new AiError.QuotaExhaustedError({ metadata: description !== undefined ? { ...metadata, description } : metadata })
    case 401:
      return new AiError.AuthenticationError({ kind: "InvalidKey", ...common })
    case 403:
      return new AiError.AuthenticationError({ kind: "InsufficientPermissions", ...common })
    // 425 Too Early: the model is warming (Fastino). RateLimitError is the reason that carries Retry-After.
    case 425:
    case 429:
      return new AiError.RateLimitError({ metadata: description !== undefined ? { ...metadata, description } : metadata, ...(wait !== undefined ? { retryAfter: wait } : {}) })
    default:
      return status >= 500
        ? new AiError.InternalProviderError({ metadata, description: description ?? `HTTP ${status}` })
        : new AiError.UnknownError(common)
  }
}

/**
 * Whether a failed attempt may be retried on this deployment: transport
 * failures, timeouts and the statuses the deployment documents as transient.
 *
 * @since 0.1.0
 */
export const isRetryable = (deployment: Deployment.Snapshot, error: AiError.AiError): boolean => {
  if (error.reason._tag === "NetworkError") return error.reason.reason === "TransportError"
  const status = (error.reason as { readonly metadata?: AiError.ProviderMetadata }).metadata?.["status"]
  return typeof status === "number" && deployment.retryableStatuses.includes(status)
}

/** The HTTP status an `AiError` came from, when it came from a response. @since 0.1.0 */
export const statusOf = (error: AiError.AiError): number | undefined => {
  const s = (error.reason as { readonly metadata?: AiError.ProviderMetadata }).metadata?.["status"]
  return typeof s === "number" ? s : undefined
}

/** The provider's request id from a failed response, when it sent one. @since 0.1.0 */
export const requestIdOf = (error: AiError.AiError): string | null => {
  const r = (error.reason as { readonly metadata?: AiError.ProviderMetadata }).metadata?.["requestId"]
  return typeof r === "string" ? r : null
}

/**
 * The URL of one call: base URL plus path, with `{model}` replaced by the
 * URL-encoded model.
 *
 * @since 0.1.0
 */
export const urlOf = (deployment: Deployment.Snapshot, model: string): string =>
  `${deployment.baseUrl}${deployment.path.replaceAll("{model}", encodeURIComponent(model))}`

/**
 * Send one planned call.
 *
 * @since 0.1.0
 */
export const send = Effect.fn("Transport.send")(function*(
  deployment: Deployment.Snapshot,
  call: Planner.Call,
  options: Options
) {
  const url = urlOf(deployment, call.spec.model)
  const fail = (reason: AiError.AiErrorReason) => Effect.fail(AiError.make({ module: deployment.provider, method: "decide", reason }))
  const network = (description: string) =>
    fail(
      new AiError.NetworkError({
        reason: "TransportError",
        method: "POST",
        url,
        description
      })
    )
  yield* Effect.annotateCurrentSpan({ "decision.deployment": Deployment.key(deployment), "decision.call": call.callId, "http.request.body.size": call.bytes })
  let request = HttpClientRequest.post(url).pipe(
    HttpClientRequest.bodyText(call.body, "application/json"),
    HttpClientRequest.setHeaders(options.headers ?? {})
  )
  if (options.apiKey !== undefined) {
    request = deployment.auth.scheme === "bearer"
      ? HttpClientRequest.bearerToken(request, options.apiKey)
      : HttpClientRequest.setHeader(request, deployment.auth.name, Redacted.value(options.apiKey))
  }
  const client = yield* HttpClient.HttpClient
  const response = yield* client.execute(request).pipe(
    Effect.catchTag("HttpClientError", (e) => network(e.message)),
    Effect.timeoutOrElse({
      duration: options.timeout ?? Duration.seconds(60),
      orElse: () => network(`no response within ${Duration.format(Duration.fromInputUnsafe(options.timeout ?? Duration.seconds(60)))}`)
    })
  )
  const headers = response.headers
  const requestId = REQUEST_ID_HEADERS.map((h) => headers[h]).find((v) => v !== undefined) ?? null
  const rateLimit = Object.fromEntries(Object.entries(headers).filter(([k]) => k.startsWith("x-ratelimit-")))
  const text = yield* response.text.pipe(Effect.catch(() => Effect.succeed("")))
  let body: unknown = undefined
  let parsed = true
  try {
    body = text.length === 0 ? undefined : JSON.parse(text)
  } catch {
    parsed = false
  }
  yield* Effect.annotateCurrentSpan({ "http.response.status_code": response.status, ...(requestId !== null ? { "decision.request_id": requestId } : {}) })
  if (response.status >= 200 && response.status < 300) {
    if (!parsed || body === undefined) {
      return yield* fail(new AiError.InvalidOutputError({ description: "response body is not JSON", metadata: { status: response.status, requestId } }))
    }
    const inner = unwrap(deployment.envelope, body)
    if ("failure" in inner) {
      return yield* fail(new AiError.InvalidOutputError({ description: inner.failure, metadata: { status: response.status, requestId } }))
    }
    return { status: response.status, body: inner.body, requestId, rateLimit } satisfies Exchange
  }
  const now = yield* Clock.currentTimeMillis
  const metadata: AiError.ProviderMetadata = { status: response.status, requestId }
  const description = (parsed ? describeErrorBody(body) : undefined) ?? (text.length > 0 && text.length <= 500 && !parsed ? text : undefined)
  yield* Effect.logDebug("decision provider error").pipe(
    Effect.annotateLogs({ deployment: Deployment.key(deployment), status: response.status, requestId: requestId ?? "" })
  )
  return yield* fail(reasonFor(response.status, description, metadata, retryAfter(headers, now)))
})
