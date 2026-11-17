/**
 * Per-question answers. Refusals and invalid answers are values, not failures:
 * branch on `status`, never catch them.
 *
 * @since 0.1.0
 */
import type * as Evidence from "./Evidence.ts"
import type { JsonObject } from "../wire/Json.ts"
import type * as Question from "./Question.ts"

/**
 * Where an answer came from. Every answer carries one, including refusals.
 *
 * @since 0.1.0
 */
export interface Origin {
  readonly questionId: string
  readonly callId: string
  readonly attempt: number
  readonly provider: string
  readonly deployment: string
  readonly requestedModel: string
  /** The model the provider reported, or `null` when it only echoed an alias. */
  readonly resolvedModel: string | null
  readonly lowerings: ReadonlyArray<string>
}

/**
 * Provider fields kept verbatim for diagnostics. `confidence` is the provider's
 * own number with its own meaning; it is never relabelled as a probability.
 *
 * @since 0.1.0
 */
export interface Native {
  readonly confidence: number | undefined
  readonly fields: JsonObject
}

/** @since 0.1.0 */
export interface Answered<V, E extends Evidence.Evidence> {
  readonly status: "answered"
  readonly value: V
  readonly evidence: E
  /** In-tolerance corrections applied during validation, e.g. renormalization. */
  readonly corrections: ReadonlyArray<string>
  readonly origin: Origin
  readonly native: Native
}

/** @since 0.1.0 */
export interface Refused {
  readonly status: "refused"
  readonly reason: string | null
  readonly origin: Origin
  readonly native: Native
}

/**
 * The provider's answer for this question was missing or failed validation.
 * Sibling answers in the same response are unaffected.
 *
 * @since 0.1.0
 */
export interface Invalid {
  readonly status: "error"
  readonly problem: string
  readonly origin: Origin
  readonly native: Native
}

/** @since 0.1.0 */
export type Answer<V, E extends Evidence.Evidence> = Answered<V, E> | Refused | Invalid

/** @since 0.1.0 */
export type Of<Q extends Question.Any> = Answer<Question.ValueOf<Q>, Question.EvidenceOf<Q>>

/** @since 0.1.0 */
export type Any = Answer<unknown, Evidence.Evidence>

/** @since 0.1.0 */
export const isAnswered = <V, E extends Evidence.Evidence>(a: Answer<V, E>): a is Answered<V, E> =>
  a.status === "answered"
