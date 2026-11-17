/**
 * Probability evidence carried by an answer. Evidence is explicit: a label-only
 * answer never acquires an invented distribution.
 *
 * @since 0.1.0
 */

/**
 * A distribution over a finite, ordered set of outcomes. Probabilities are
 * validated to lie in [0, 1] and to sum to 1 within the codec's tolerance.
 *
 * @since 0.1.0
 */
export interface FiniteDistribution<L extends string> {
  readonly kind: "finite-distribution"
  /** Outcomes in definition order. */
  readonly outcomes: ReadonlyArray<L>
  readonly probabilities: { readonly [K in L]: number }
  /**
   * Mass the provider put on "the input cannot answer this" (e.g. RESPAN's
   * `p_not_observable`). When present, `probabilities` are conditional on the
   * question being answerable; absent when the provider reports no such mass.
   */
  readonly undetermined?: number
}

/**
 * The provider returned a label without probabilities.
 *
 * @since 0.1.0
 */
export interface LabelOnly {
  readonly kind: "label-only"
}

/** @since 0.1.0 */
export interface Spatial {
  readonly kind: "bounding-box"
}

export const spatial: Spatial = { kind: "bounding-box" }

export type Evidence = Spatial | FiniteDistribution<string> | LabelOnly

/** @since 0.1.0 */
export type BooleanOutcome = "true" | "false"

/** @since 0.1.0 */
export const finite = <L extends string>(
  outcomes: ReadonlyArray<L>,
  probabilities: { readonly [K in L]: number },
  undetermined?: number
): FiniteDistribution<L> => (undetermined === undefined
  ? { kind: "finite-distribution", outcomes, probabilities }
  : { kind: "finite-distribution", outcomes, probabilities, undetermined })

/** @since 0.1.0 */
export const labelOnly: LabelOnly = { kind: "label-only" }

/**
 * The most probable outcome; ties resolve to the earliest outcome in
 * definition order.
 *
 * @since 0.1.0
 */
export const mode = <L extends string>(d: FiniteDistribution<L>): L => {
  let best = d.outcomes[0] as L
  for (const o of d.outcomes) {
    if (d.probabilities[o] > d.probabilities[best]) best = o
  }
  return best
}

/**
 * Probability-weighted mean of the outcome indices (0-based).
 *
 * @since 0.1.0
 */
export const expectedIndex = <L extends string>(d: FiniteDistribution<L>): number =>
  d.outcomes.reduce((sum, o, i) => sum + i * d.probabilities[o], 0)

/**
 * Shannon entropy in bits.
 *
 * @since 0.1.0
 */
export const entropy = <L extends string>(d: FiniteDistribution<L>): number =>
  d.outcomes.reduce((h, o) => {
    const p = d.probabilities[o]
    return p > 0 ? h - p * Math.log2(p) : h
  }, 0)

/**
 * Difference between the two largest probabilities.
 *
 * @since 0.1.0
 */
export const margin = <L extends string>(d: FiniteDistribution<L>): number => {
  const ps = d.outcomes.map((o) => d.probabilities[o]).sort((a, b) => b - a)
  return (ps[0] ?? 0) - (ps[1] ?? 0)
}
