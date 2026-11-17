/**
 * One shape for every failure, with what to do about it. Meant for logs,
 * agents and error pages.
 *
 * @since 0.1.0
 */
import * as AiError from "effect/ai/AiError"

/** @since 0.1.0 */
export interface Explanation {
  readonly tag: string
  readonly message: string
  readonly hint: string
  /** Whether trying the same thing again can help. */
  readonly retryable: boolean
}

const AI_HINTS: Readonly<Record<string, string>> = {
  AuthenticationError: "Check the provider key (TYPESAFE_API_KEY, PERPLEXITY_API_KEY, OPENAI_API_KEY) or pass apiKey to the Provider",
  RateLimitError: "Slow down; the engine retries with Retry-After. Raise provider retry.times or Budget.limit if this persists",
  QuotaExhaustedError: "The account is out of quota; add a fallback engine or top up",
  InvalidRequestError: "The provider rejected the request: check the model name and the message; Planner.preview shows what is sent",
  InternalProviderError: "The provider failed; it is retried when the deployment documents the status as transient. Add a fallback",
  NetworkError: "No response; check connectivity, baseUrl and the provider timeout",
  InvalidOutputError: "The provider's response could not be used; the ledger entry has the request id to report",
  UnknownError: "Unexpected provider response; the ledger entry has the status and request id"
}

/**
 * Explain any failure from this library or a provider.
 *
 * @example
 * Effect.catch(program, (e) => Effect.logError(Errors.explain(e)))
 *
 * @since 0.1.0
 */
export const explain = (error: unknown): Explanation => {
  if (AiError.isAiError(error)) {
    const tag = error.reason._tag
    return { tag: `AiError.${tag}`, message: error.message, hint: AI_HINTS[tag] ?? "See the provider message", retryable: error.isRetryable }
  }
  if (typeof error === "object" && error !== null) {
    const e = error as { readonly _tag?: unknown; readonly message?: unknown; readonly hint?: unknown }
    const message = typeof e.message === "string" ? e.message : String(error)
    if (typeof e._tag === "string") {
      return { tag: e._tag, message, hint: typeof e.hint === "string" ? e.hint : "See the message", retryable: false }
    }
    if (error instanceof Error) return { tag: error.name, message, hint: "Unexpected failure; this is likely a bug", retryable: false }
  }
  return { tag: "Unknown", message: String(error), hint: "Unexpected failure; this is likely a bug", retryable: false }
}

/**
 * What a failed decision call means for the caller:
 * - `unavailable`: a retryable provider failure (network, timeout, rate
 *   limit, 5xx, unusable response) that survived the engine's own retries.
 *   Try again later or fall back; nothing was decided.
 * - `exhausted`: `Budget.limit` ran out (`budget` says attempts or deadline).
 *   The caller's own bound, not the provider's verdict; never retried here.
 * - `rejected`: the request itself is wrong (a non-retryable provider
 *   failure such as a 4xx, a plan or preparation error). Retrying the same
 *   thing will not help.
 * - `misconfigured`: the engine could not be built or the definition is
 *   malformed (`ConfigError`, `ProviderError`, `DefinitionError`). Unknown
 *   values are `rejected`, not `misconfigured`.
 *
 * `source` says where it came from. `status` is the HTTP status when a
 * response arrived. `retryable` is true only for `unavailable`. Per-question
 * refusals and invalid answers are not failures: they are `Answer` values.
 *
 * @since 0.2.0
 */
export interface Classification {
  readonly kind: "unavailable" | "exhausted" | "rejected" | "misconfigured"
  readonly source: "provider" | "budget" | "plan" | "preparation" | "configuration" | "unknown"
  readonly tag: string
  readonly message: string
  readonly status: number | null
  readonly retryable: boolean
  /** For `exhausted`: which limit ran out. */
  readonly budget?: "attempts" | "deadline" | undefined
}

const CONFIGURATION = new Set(["ConfigError", "ProviderError", "DefinitionError"])

/**
 * Classify any failure of `Engine.decide`, `Engine.execute`, a fallback chain
 * or building an engine layer. See {@link Classification}.
 *
 * @example
 * Engine.decide(Triage, input).pipe(Effect.mapError(Errors.classify))
 *
 * @since 0.2.0
 */
export const classify = (error: unknown): Classification => {
  const { tag, message } = explain(error)
  if (AiError.isAiError(error)) {
    const s = (error.reason as { readonly metadata?: { readonly status?: unknown } }).metadata?.status
    const retryable = error.isRetryable
    return { kind: retryable ? "unavailable" : "rejected", source: "provider", tag, message, status: typeof s === "number" ? s : null, retryable }
  }
  const t = typeof error === "object" && error !== null ? (error as { readonly _tag?: unknown })._tag : undefined
  const base = { tag, message, status: null, retryable: false } as const
  if (t === "BudgetExhausted") {
    const kind = (error as { readonly kind?: unknown }).kind
    return { ...base, kind: "exhausted", source: "budget", budget: kind === "deadline" ? "deadline" : "attempts" }
  }
  if (t === "PlanError") return { ...base, kind: "rejected", source: "plan" }
  if (t === "PreparationError") return { ...base, kind: "rejected", source: "preparation" }
  if (typeof t === "string" && CONFIGURATION.has(t)) return { ...base, kind: "misconfigured", source: "configuration" }
  return { ...base, kind: "rejected", source: "unknown" }
}
