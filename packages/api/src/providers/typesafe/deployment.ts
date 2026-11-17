import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, core, exact } from "../deployment-defaults.ts"

/**
 * TypeSafe Jev, hosted. Independent questions; structured state and descriptions.
 *
 * @since 0.1.0
 */
export const typesafe: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "typesafe",
  version: "2026-10-18",
  provider: "typesafe",
  codec: "system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://api.typesafe.ai",
  path: "/v1/systemone",
  defaultModel: "jev-latest",
  aliases: { "jev-latest": "jev-1.13.0", "jev-preview": "jev-1.14.0" },
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(exact(255), exact(10)),
  structuredDescriptions: true,
  structuredState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: "unknown",
    bodyBytes: exact(32 * 1024 * 1024),
    requestTokens: exact(64_000, "262k with TypeSafe-Danger-Zone-Long-Context; 32k per question"),
    stateChars: "unknown"
  },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [429, 529],
  verification: "live-tested",
  sources: ["https://docs.typesafe.ai/api.md", "https://docs.typesafe.ai/models.md"]
}
