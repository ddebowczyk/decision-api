import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, core, exact } from "../deployment-defaults.ts"

/**
 * Fastino GLiDE. Key in `X-API-Key`. Questions are evaluated independently
 * against the shared state. Descriptions and boolean criteria are text.
 * Each rendered prompt (state plus one question) is limited to 40,000 tokens;
 * there is no whole-request ceiling. 425 means the model is warming: retried
 * after `Retry-After`.
 *
 * @since 0.1.0
 */
export const fastino: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "fastino",
  version: "2026-11-17",
  provider: "fastino",
  codec: "system-one",
  envelope: "none",
  auth: { scheme: "header", name: "X-API-Key" },
  baseUrl: "https://api.fastino.ai",
  path: "/v1/systemone",
  defaultModel: "fastino/GLiDE",
  // Reported as "glide" in the docs and "glide_v2" live on 2026-10-18.
  aliases: { "fastino/GLiDE": null },
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(exact(255), exact(255)),
  structuredDescriptions: false,
  structuredState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: "unknown",
    bodyBytes: "unknown",
    requestTokens: "unknown",
    questionTokens: exact(40_000, "per rendered prompt (state + one question), not per request"),
    stateChars: "unknown"
  },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [425, 429, 502, 503],
  verification: "live-tested",
  sources: [
    "https://docs.fastino.ai/inference/systemone.md",
    "https://docs.fastino.ai/openapi.json",
    "https://docs.fastino.ai/concepts/glide-capabilities.md",
    "https://docs.fastino.ai/troubleshooting/errors.md",
    "https://docs.fastino.ai/troubleshooting/retries.md"
  ]
}
