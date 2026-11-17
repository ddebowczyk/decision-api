/**
 * Versioned capability snapshots of provider deployments. A snapshot is plain
 * JSON data with its sources and verification status; unknown is never
 * treated as support.
 *
 * @since 0.1.0
 */
import * as Question from "../domain/Question.ts"

/** @since 0.1.0 */
export type Verification = "documented" | "replay-tested" | "live-tested" | "unknown"

/** How a limit is known. @since 0.1.0 */
export type LimitEvidence = "exact" | "conservative-bound" | "estimate"

/** @since 0.1.0 */
export type Limit = { readonly value: number; readonly evidence: LimitEvidence; readonly note?: string } | "unknown"

/** @since 0.1.0 */
export type Codec = "system-one" | "openai-decisions" | "respan" | "classifier-dev"

/**
 * What wraps the codec's body on the wire. `cloudflare`: the v4 API envelope
 * `{ result, success, errors, messages }`; the transport unwraps `result` and
 * treats `success !== true` as a failure.
 *
 * @since 0.1.0
 */
export type Envelope = "none" | "cloudflare"

/**
 * How the API key is sent. `bearer`: `Authorization: Bearer <key>`;
 * `header`: the raw key in the named header. Either is omitted without a key.
 *
 * @since 0.1.0
 */
export type Auth = { readonly scheme: "bearer" } | { readonly scheme: "header"; readonly name: string }

/**
 * `independent`: questions in one call cannot see each other. `joint`: they
 * can, so independent questions need one call each.
 *
 * @since 0.1.0
 */
export type Grouping = "independent" | "joint" | "unknown"

/** @since 0.1.0 */
export interface Primitive {
  readonly kind: string
  readonly version: string
  readonly minOutcomes: number
  readonly maxOutcomes: Limit
}

/** @since 0.1.0 */
export interface Snapshot {
  readonly _tag: "DeploymentSnapshot"
  /** Stable deployment id, e.g. `typesafe`. */
  readonly id: string
  /** Snapshot date; a new snapshot is a new identity. */
  readonly version: string
  readonly provider: string
  readonly codec: Codec
  readonly envelope: Envelope
  readonly auth: Auth
  /** May contain `{name}` placeholders, filled from `Provider.urlParams`. */
  readonly baseUrl: string
  /** May contain `{model}`, replaced per call with the URL-encoded model. */
  readonly path: string
  readonly defaultModel: string
  /** Known aliases and what they resolve to; `null` when the provider does not say. */
  readonly aliases: { readonly [alias: string]: string | null }
  readonly grouping: Grouping
  readonly groupingSource: Verification
  readonly primitives: ReadonlyArray<Primitive>
  /** Instructions and criteria may be JSON objects/arrays. */
  readonly structuredDescriptions: boolean
  /** State may be a JSON object/array. */
  readonly structuredState: boolean
  /** Boolean questions accept `true`/`false` criteria. */
  readonly booleanCriteria: boolean
  readonly limits: {
    readonly questionsPerCall: Limit
    readonly bodyBytes: Limit
    readonly requestTokens: Limit
    readonly stateChars: Limit
  }
  /** Rounding tolerance for distribution mass, see `Validate`. */
  readonly tolerance: number
  readonly toleranceSource: "documented" | "assumed"
  /** Status codes the provider documents as transient. */
  readonly retryableStatuses: ReadonlyArray<number>
  readonly verification: Verification
  readonly sources: ReadonlyArray<string>
}

/** `id@version`, used in identities and ledgers. @since 0.1.0 */
export const key = (d: Snapshot): string => `${d.id}@${d.version}`

/**
 * A copy with fields replaced, e.g. a local `baseUrl`. Change `version` too
 * when the capabilities themselves change.
 *
 * @since 0.1.0
 */
export const withOverrides = (d: Snapshot, overrides: Partial<Omit<Snapshot, "_tag">>): Snapshot => ({ ...d, ...overrides })
export { withOverrides as with }

/**
 * Problems that stop a question from being asked on a deployment; empty when
 * it fits. Unknown bounds do not fail here; the planner reports them.
 *
 * @since 0.1.0
 */
export const fits = (d: Snapshot, q: Question.Any): ReadonlyArray<string> => {
  const p = d.primitives.find((x) => x.kind === q.kind && x.version === q.version)
  if (p === undefined) return [`${d.id} does not support ${q.kind} v${q.version}`]
  const n = Question.outcomes(q).length
  const what = q.kind === "score" ? "levels" : "options"
  const problems: Array<string> = []
  if (n < p.minOutcomes) problems.push(`${n} ${what}; ${d.id} needs at least ${p.minOutcomes}`)
  if (p.maxOutcomes !== "unknown" && n > p.maxOutcomes.value) {
    problems.push(`${n} ${what}; ${d.id} accepts at most ${p.maxOutcomes.value} (${p.maxOutcomes.evidence})`)
  }
  return problems
}
