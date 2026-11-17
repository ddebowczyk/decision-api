import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, core, exact } from "../deployment-defaults.ts"

/**
 * OpenAI Decisions (public beta). Ordered questions; string input and
 * descriptions, so objects need the `stringify-state` or
 * `stringify-description` lowering. Grouping is taken from the guide, which
 * puts independent questions in one request.
 *
 * @since 0.1.0
 */
export const openai: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "openai",
  version: "2026-10-18",
  provider: "openai",
  codec: "openai-decisions",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://api.openai.com",
  path: "/v1/decisions",
  defaultModel: "gpt-6-luna",
  aliases: {},
  grouping: "independent",
  groupingSource: "documented",
  primitives: core("unknown", "unknown"),
  structuredDescriptions: false,
  structuredState: false,
  booleanCriteria: false,
  limits: { questionsPerCall: exact(200), bodyBytes: "unknown", requestTokens: "unknown", stateChars: exact(1_048_576) },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [429, 500, 502, 503, 504],
  verification: "live-tested",
  sources: [
    "https://developers.openai.com/api/docs/guides/decisions",
    "https://developers.openai.com/api/reference/python/resources/decisions/methods/create"
  ]
}
