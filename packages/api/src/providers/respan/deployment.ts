import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, exact } from "../deployment-defaults.ts"

/**
 * RESPAN span-01, hosted. Boolean questions only, as behaviors over a
 * conversation span (`Respan.Span`); each behavior is its own branch, so
 * questions are independent. No published body, token or behavior-count
 * limits (the docs say there is no behavior cap; oversized spans get 413).
 *
 * @since 0.1.0
 */
export const respan: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "respan",
  version: "2026-10-18",
  provider: "respan",
  codec: "respan",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://api.respan.ai",
  path: "/api/v1/scores",
  defaultModel: "span-01-free",
  aliases: {},
  grouping: "independent",
  groupingSource: "documented",
  primitives: [{ kind: "boolean", version: "1", minOutcomes: 2, maxOutcomes: exact(2) }],
  structuredDescriptions: false,
  structuredState: true,
  booleanCriteria: true,
  limits: { questionsPerCall: "unknown", bodyBytes: "unknown", requestTokens: "unknown", stateChars: "unknown" },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [424, 429, 503, 504],
  verification: "live-tested",
  sources: [
    "https://respan.ai/docs/openapi.json",
    "https://www.respan.ai/docs/apis/gateway/run-span-01",
    "https://www.respan.ai/docs/documentation/span-01/concept"
  ]
}
