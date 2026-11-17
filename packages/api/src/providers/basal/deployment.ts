import type { Snapshot } from "../deployment.ts"
import { ASSUMED_TOLERANCE, bearer, core } from "../deployment-defaults.ts"

/**
 * Basal, a local System One server. Override `baseUrl` with `Deployment.with`.
 * Descriptions are strings in the captured docs.
 *
 * @since 0.1.0
 */
export const basal: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "basal",
  version: "2026-10-18",
  provider: "basal",
  codec: "system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "http://localhost:8000",
  path: "/v1/systemone",
  defaultModel: "basal",
  aliases: {},
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(
    { value: 10, evidence: "conservative-bound", note: "255 for prompt-format-2 models (basal-2.0); 10 for basal-1.x; 20 in ollama mode" },
    "unknown"
  ),
  structuredDescriptions: false,
  structuredState: true,
  booleanCriteria: true,
  limits: { questionsPerCall: "unknown", bodyBytes: "unknown", requestTokens: "unknown", stateChars: "unknown" },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [],
  verification: "documented",
  sources: ["https://github.com/rkinas/basal/blob/main/docs/API.md"]
}
