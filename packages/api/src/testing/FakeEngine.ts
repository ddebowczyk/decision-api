/**
 * An `Engine` that answers from a table, for testing code that makes
 * decisions. Built on `Engine.local`: planning and validation are the real
 * ones; nothing is sent.
 *
 * @since 0.1.0
 */
import type { Layer } from "effect"
import type * as AiError from "effect/ai/AiError"
import type * as Budget from "../runtime/Budget.ts"
import * as Deployment from "../providers/deployments.ts"
import * as Engine from "../runtime/Engine.ts"
import type { Json } from "../wire/Json.ts"
import type * as Question from "../domain/Question.ts"

/**
 * What the fake answers for one question (see `Engine.Canned`):
 * - boolean: P(true);
 * - choice: a label (label-only evidence);
 * - score: a level label (all mass on that level);
 * - `distribution`, `refused`, `invalid` for anything else. A distribution
 *   may carry the provider's own `confidence` (kept in `native`).
 *
 * @since 0.1.0
 */
export type Canned = Engine.Canned

/** @since 0.1.0 */
export const distribution = (
  probabilities: Readonly<Record<string, number>>,
  options: { readonly confidence?: number | undefined } = {}
): Canned => ({ _tag: "Distribution", probabilities, ...(options.confidence !== undefined ? { confidence: options.confidence } : {}) })
/** @since 0.1.0 */
export const refused = (reason: string | null = null): Canned => ({ _tag: "Refused", reason })
/** @since 0.1.0 */
export const invalid = (problem: string): Canned => ({ _tag: "Invalid", problem })

/**
 * Canned answers by question id, or a function of the id, the encoded input
 * and the question (its kind and outcomes in posed order).
 *
 * @since 0.1.0
 */
export type Table =
  | Readonly<Record<string, Canned>>
  | ((questionId: string, input: Json, question: Question.Any) => Canned | undefined)

/**
 * @since 0.2.0
 */
export interface Options {
  /** Fail every call with this error, after recording the attempt. */
  readonly fail?: AiError.AiError | Budget.BudgetExhausted | undefined
  /** Model the fake reports as requested and resolved; default `"fake"` (unresolved). */
  readonly model?: string | undefined
  /** Provider name on every answer's origin; default `"fake"`. */
  readonly provider?: string | undefined
  /** Usage the call reports, fixed or from the encoded input; default unknown. */
  readonly usage?: Engine.DecisionResult["usage"] | ((input: Json) => Engine.DecisionResult["usage"]) | undefined
}

/** The fake's deployment: independent questions, everything structured, no limits. @since 0.1.0 */
export const deployment: Deployment.Snapshot = Deployment.with(Deployment.typesafe, {
  id: "fake",
  version: "test",
  provider: "fake",
  baseUrl: "fake://",
  defaultModel: "fake",
  aliases: {},
  retryableStatuses: [],
  verification: "unknown",
  sources: ["@decisions/api/testing"]
})

/**
 * @example
 * Effect.provide(program, FakeEngine.layer({ refund: 0.9, team: "billing", urgency: "soon" }))
 *
 * @since 0.1.0
 */
export const layer = (table: Table, options: Options = {}): Layer.Layer<Engine.Engine> => {
  const lookup = typeof table === "function" ? table : (id: string) => table[id]
  return Engine.local({
    deployment: deployment,
    provider: options.provider ?? "fake",
    ...(options.model !== undefined ? { model: options.model } : {}),
    ...(options.usage !== undefined ? { usage: options.usage } : {}),
    ...(options.fail !== undefined ? { fail: options.fail } : {}),
    answer: ({ input, question, questionId }) => lookup(questionId, input, question)
  })
}
