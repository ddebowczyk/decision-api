import type { Snapshot } from "../deployment.ts"
import { bearer, core, exact } from "../deployment-defaults.ts"

/**
 * Jeff (GLiFormer large), a self-hosted System One server; override `baseUrl`.
 * Auth is optional (on when the server sets `JEFF_API_KEYS`). Upstream's
 * default `JEFF_ISOLATE=nouls` gives each boolean its own pass but scores
 * choice and score questions together, so this snapshot is joint; see
 * `jeffIsolated`. Run the server with `JEFF_TEMPERATURE=1`: at the default 3.2
 * the native score is computed from the untempered distribution and differs
 * from the returned probabilities (recorded as a correction).
 *
 * @since 0.1.0
 */
export const jeff: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "jeff",
  version: "2026-10-18",
  provider: "jeff",
  codec: "system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "http://localhost:8000",
  path: "/v1/systemone",
  defaultModel: "gliformer-large-v1",
  aliases: { "jev-latest": "gliformer-large-v1", jev: "gliformer-large-v1" },
  grouping: "joint",
  groupingSource: "documented",
  primitives: core(exact(64, "JEFF_MAX_LABELS"), exact(64, "JEFF_MAX_LABELS")),
  structuredDescriptions: true,
  structuredState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: exact(64),
    bodyBytes: "unknown",
    requestTokens: "unknown",
    stateChars: exact(20_000, "serialized state")
  },
  // 4-decimal rounding over up to 64 labels.
  tolerance: 0.0032,
  toleranceSource: "assumed",
  retryableStatuses: [429, 529],
  verification: "live-tested",
  sources: ["https://github.com/logan-markewich/jeff/blob/34b32f99a727c47b679adde33f4702a001e02979/README.md"]
}

/**
 * Jeff on a server run with `JEFF_ISOLATE=all` (as typed-decision-lab does):
 * every question has its own pass, so questions are independent.
 *
 * @since 0.1.0
 */
export const jeffIsolated: Snapshot = { ...jeff, id: "jeff-isolated", grouping: "independent" }
