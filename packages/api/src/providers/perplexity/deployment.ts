import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, core, exact } from "../deployment-defaults.ts"

/**
 * Perplexity Decider V1.2. Questions in one request see each other.
 *
 * @since 0.1.0
 */
export const perplexity: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "perplexity",
  version: "2026-10-18",
  provider: "perplexity",
  codec: "system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://api.perplexity.ai",
  path: "/v1/decisions",
  defaultModel: "pplx-decider-latest",
  aliases: { "pplx-decider-latest": null, "pplx-decider-flash-latest": null },
  grouping: "joint",
  groupingSource: "documented",
  primitives: core(exact(255), exact(10)),
  structuredDescriptions: true,
  structuredState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: exact(128),
    bodyBytes: exact(32 * 1024 * 1024),
    requestTokens: exact(256_000, "oversized requests may be regrouped, repeating state cost"),
    stateChars: "unknown"
  },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [429, 500, 502, 503, 504],
  verification: "live-tested",
  sources: [
    "https://docs.perplexity.ai/docs/decisions/quickstart.md",
    "https://docs.perplexity.ai/api-reference/decisions-post.md"
  ]
}
