import type { Auth, Limit, Primitive } from "./deployment.ts"

export const exact = (value: number, note?: string): Limit => (note === undefined ? { value, evidence: "exact" } : { value, evidence: "exact", note })
export const core = (choiceMax: Limit, scoreMax: Limit): ReadonlyArray<Primitive> => [
  { kind: "boolean", version: "1", minOutcomes: 2, maxOutcomes: exact(2) },
  { kind: "choice", version: "1", minOutcomes: 2, maxOutcomes: choiceMax },
  { kind: "score", version: "1", minOutcomes: 2, maxOutcomes: scoreMax }
]

export const bearer: Auth = { scheme: "bearer" }

/** Assumed until a provider documents its rounding. */
export const ASSUMED_TOLERANCE = 1e-3
