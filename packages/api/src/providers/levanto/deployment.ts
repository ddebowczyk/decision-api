import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, core, exact } from "../deployment-defaults.ts"

/**
 * Levanto Sage via the Jev-compatible SystemOne endpoint. Each question
 * becomes a separate /decide/batch question reading the shared content.
 * Descriptions are text; state accepts text, objects and arrays. The native
 * /decide null threshold does not apply: SystemOne always returns an answer.
 *
 * @since 0.1.0
 */
export const levanto: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "levanto",
  version: "2026-11-17",
  provider: "levanto",
  codec: "levanto-system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://sage.levanto.ai",
  path: "/v1/systemone",
  defaultModel: "levanto-sage-2",
  aliases: { "sage-latest": "levanto-sage-2" },
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(exact(256), exact(26)),
  structuredDescriptions: false,
  structuredState: true,
  booleanCriteria: true,
  // Context is plan-dependent and documented only as approximate (32K/128K).
  limits: { questionsPerCall: "unknown", bodyBytes: "unknown", requestTokens: "unknown", stateChars: "unknown" },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [503],
  verification: "live-tested",
  sources: [
    "https://docs.levanto.ai/systemone.md",
    "https://docs.levanto.ai/openapi-schema.md",
    "https://docs.levanto.ai/decision-model/batch.md",
    "https://docs.levanto.ai/decision-model/limits.md"
  ]
}

/** Sage's native batch operation can abstain on yes/no and choice questions. */
export const levantoNative: Snapshot = {
  ...levanto,
  id: "levanto-native",
  codec: "levanto-native-batch",
  path: "/decide/batch",
  aliases: {},
  structuredState: false,
  booleanCriteria: false,
  verification: "documented",
  sources: ["https://sage.levanto.ai/openapi.json", "https://docs.levanto.ai/decision-model/batch.md"]
}
