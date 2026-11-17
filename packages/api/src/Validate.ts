/**
 * Per-primitive validation of what a codec decoded, before it becomes an answer.
 *
 * Distributions must cover every outcome exactly once with finite values in
 * [0, 1]. Mass within the dialect's tolerance of 1 is rescaled and the rescale
 * is recorded in `corrections`; anything further off invalidates the answer.
 * Score values are always recomputed from the accepted distribution.
 * Undetermined mass ("the input cannot answer this") counts towards the
 * total and is kept beside a distribution conditional on answerability.
 *
 * @since 0.1.0
 */
import * as Evidence from "./Evidence.ts"
import * as Question from "./Question.ts"

/**
 * What a codec decoded for one question, in canonical terms. Probabilities
 * are keyed by outcome label (`"true"`/`"false"` for booleans).
 *
 * @since 0.1.0
 */
export interface Candidate {
  readonly label?: string | undefined
  readonly probabilities?: ReadonlyArray<readonly [outcome: string, probability: number]> | undefined
  /** The provider's own score, kept only to report a disagreement. */
  readonly nativeScore?: number | undefined
  /**
   * Mass on "the input cannot answer this". The outcome probabilities plus
   * this mass must sum to 1; the accepted distribution is then conditional
   * on the question being answerable.
   */
  readonly undetermined?: number | undefined
}

/** @since 0.1.0 */
export interface Valid {
  readonly _tag: "Valid"
  readonly value: unknown
  readonly evidence: Evidence.Evidence
  readonly corrections: ReadonlyArray<string>
}

/** @since 0.1.0 */
export interface Invalid {
  readonly _tag: "Invalid"
  readonly problem: string
}

/** @since 0.1.0 */
export type Verdict = Valid | Invalid

/** Below this (float32 rounding), mass is treated as exactly 1: not rescaled, not a correction. */
const EXACT = 1e-6

const invalid = (problem: string): Invalid => ({ _tag: "Invalid", problem })

const distribution = (
  outcomes: ReadonlyArray<string>,
  given: ReadonlyArray<readonly [string, number]>,
  tolerance: number,
  undetermined: number | undefined
): Invalid | { readonly d: Evidence.FiniteDistribution<string>; readonly corrections: ReadonlyArray<string> } => {
  const known = new Set(outcomes)
  const ps = new Map<string, number>()
  for (const [o, p] of given) {
    if (!known.has(o)) return invalid(`unknown outcome "${o}"`)
    if (ps.has(o)) return invalid(`outcome "${o}" given twice`)
    if (!Number.isFinite(p) || p < 0 || p > 1) return invalid(`probability of "${o}" out of range: ${p}`)
    ps.set(o, p)
  }
  const missing = outcomes.filter((o) => !ps.has(o))
  if (missing.length > 0) return invalid(`missing outcomes: ${missing.join(", ")}`)
  const sum = outcomes.reduce((s, o) => s + ps.get(o)!, 0)
  if (undetermined !== undefined) {
    if (!Number.isFinite(undetermined) || undetermined < 0 || undetermined > 1) return invalid(`undetermined mass out of range: ${undetermined}`)
    const total = sum + undetermined
    if (Math.abs(total - 1) > tolerance) {
      return invalid(`probabilities sum to ${sum} with undetermined ${undetermined}, outside tolerance ${tolerance}`)
    }
    if (sum <= EXACT) return invalid(`cannot be determined from the input (undetermined ${undetermined})`)
    const conditional = Object.fromEntries(outcomes.map((o) => [o, ps.get(o)! / sum]))
    return {
      d: Evidence.finite(outcomes, conditional, undetermined),
      corrections: Math.abs(total - 1) > EXACT ? [`renormalized: probabilities and undetermined summed to ${total}`] : []
    }
  }
  const off = Math.abs(sum - 1)
  if (off > tolerance) return invalid(`probabilities sum to ${sum}, outside tolerance ${tolerance}`)
  const rescale = off > EXACT
  const probabilities = Object.fromEntries(outcomes.map((o) => [o, rescale ? ps.get(o)! / sum : ps.get(o)!]))
  return {
    d: Evidence.finite(outcomes, probabilities),
    corrections: rescale ? [`renormalized: probabilities summed to ${sum}`] : []
  }
}

/**
 * Validate one decoded answer against its question.
 *
 * - boolean: needs a distribution over `"true"`/`"false"`; value is P(true).
 * - choice: a distribution, a label, or both. The label must be known and,
 *   with a distribution, a most probable outcome (within tolerance). Without a
 *   label the value is the mode, ties to definition order. A label alone is
 *   label-only evidence.
 * - score: needs a distribution; value is the expected 0-based level index.
 *
 * @since 0.1.0
 */
export const answer = (q: Question.Any, c: Candidate, tolerance: number): Verdict => {
  const outcomes = Question.outcomes(q)
  if (c.probabilities === undefined) {
    if (q.kind !== "choice") return invalid(`${q.kind} answer has no distribution`)
    if (c.label === undefined) return invalid("choice answer has no label and no distribution")
    if (!outcomes.includes(c.label)) return invalid(`unknown label "${c.label}"`)
    return { _tag: "Valid", value: c.label, evidence: Evidence.labelOnly, corrections: [] }
  }
  const r = distribution(outcomes, c.probabilities, tolerance, c.undetermined)
  if ("_tag" in r) return r
  const { d, corrections } = r
  switch (q.kind) {
    case "boolean":
      return { _tag: "Valid", value: d.probabilities["true"], evidence: d, corrections }
    case "score": {
      const value = Evidence.expectedIndex(d)
      const notes = c.nativeScore !== undefined && Math.abs(c.nativeScore - value) > tolerance
        ? [`native score ${c.nativeScore} replaced by recomputed ${value}`]
        : []
      return { _tag: "Valid", value, evidence: d, corrections: [...corrections, ...notes] }
    }
    default: {
      if (c.label === undefined) return { _tag: "Valid", value: Evidence.mode(d), evidence: d, corrections }
      if (!outcomes.includes(c.label)) return invalid(`unknown label "${c.label}"`)
      const top = d.probabilities[Evidence.mode(d)]!
      if (d.probabilities[c.label]! < top - tolerance) {
        return invalid(`label "${c.label}" inconsistent with its distribution (mode is "${Evidence.mode(d)}")`)
      }
      return { _tag: "Valid", value: c.label, evidence: d, corrections }
    }
  }
}
