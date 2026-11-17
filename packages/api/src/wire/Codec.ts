/**
 * The codec contract: encode one call, decode its response into canonical
 * candidates. Codecs are pure and synchronous; validation happens after
 * decoding, with the deployment's tolerance.
 *
 * @since 0.1.0
 */
import { Data, type Result } from "effect"
import type * as Answer from "../domain/Answer.ts"
import type { Json, JsonObject } from "./Json.ts"
import type * as Question from "../domain/Question.ts"
import type * as Validate from "../domain/Validate.ts"
import type * as Wire from "./Wire.ts"

/**
 * One call as the codec sees it, after lowerings. `id` is the wire id.
 *
 * @since 0.1.0
 */
export interface CallSpec {
  readonly model: string
  readonly state: Json
  readonly questions: ReadonlyArray<{ readonly id: string; readonly question: Question.Any }>
}

/**
 * Token counts as reported. A missing count stays `undefined`; it is never
 * guessed as zero.
 *
 * @since 0.1.0
 */
export interface Usage {
  readonly inputTokens: number | undefined
  readonly outputTokens: number | undefined
  readonly totalTokens: number | undefined
  readonly fields: JsonObject
}

/** @since 0.1.0 */
export type DecodedAnswer =
  | { readonly _tag: "Candidate"; readonly candidate: Validate.Candidate; readonly native: Answer.Native }
  | { readonly _tag: "Refused"; readonly reason: string | null; readonly native: Answer.Native }
  | { readonly _tag: "Malformed"; readonly problem: string; readonly native: Answer.Native }

/** @since 0.1.0 */
export interface Decoded {
  /** The `model` field of the response, verbatim; `null` when absent. */
  readonly reportedModel: string | null
  /** By wire id. A question with no entry was not answered. */
  readonly answers: ReadonlyMap<string, DecodedAnswer>
  readonly usage: Usage
}

/**
 * The whole response envelope is unusable. Per-question problems are
 * `Malformed` answers instead.
 *
 * @since 0.1.0
 */
export class CodecError extends Data.TaggedError("CodecError")<{
  readonly codec: string
  readonly message: string
}> {}

/**
 * Why a call cannot be sent in this wire format, and what would fix it.
 *
 * @since 0.1.0
 */
export interface Problem {
  readonly problem: string
  readonly hint: string
}

/** @since 0.1.0 */
export interface Codec {
  readonly id: string
  readonly version: string
  /**
   * Constraints of the wire format the deployment snapshot cannot express
   * (e.g. a required state shape). The planner runs it on every call and
   * fails with `provider-constraint`. Pure; empty when the call is fine.
   */
  readonly preflight?: ((spec: CallSpec) => ReadonlyArray<Problem>) | undefined
  readonly encode: (spec: CallSpec) => Wire.Value
  readonly decode: (spec: CallSpec, body: unknown) => Result.Result<Decoded, CodecError>
}

/** No usage reported. @since 0.1.0 */
export const unknownUsage: Usage = { inputTokens: undefined, outputTokens: undefined, totalTokens: undefined, fields: {} }

/** @internal */
export const finiteOrUndefined = (u: unknown): number | undefined =>
  typeof u === "number" && Number.isFinite(u) ? u : undefined
