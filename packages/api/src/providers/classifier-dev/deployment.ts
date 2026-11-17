import type { Snapshot } from "../deployment.ts"
import { bearer, core, exact } from "../deployment-defaults.ts"

/**
 * Classifier.dev, hosted (`/v1/classify`, dimensions mode, tier `fast`).
 * Keyless with free per-IP limits; a key raises them. Every question is a
 * single-label choice over rendered labels (see `ClassifierDev`); Jev answers
 * dimensions independently. Text input only, at most 32,000 characters
 * (longer is paid long context). Scores may be rounded to two decimals.
 * `model` is the Classifier.dev model: `jev` (default), `laya` or `kev`.
 *
 * @since 0.1.0
 */
export const classifierDev: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "classifier-dev",
  version: "2026-10-18",
  provider: "classifier-dev",
  codec: "classifier-dev",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://classifier.dev",
  path: "/v1/classify",
  defaultModel: "jev",
  aliases: { jev: null },
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(exact(100), exact(100)),
  structuredDescriptions: false,
  structuredState: false,
  booleanCriteria: true,
  limits: {
    questionsPerCall: exact(20),
    bodyBytes: exact(1_000_000),
    requestTokens: "unknown",
    stateChars: exact(32_000, "longer input is paid long context")
  },
  // Two-decimal scores: the polyglot driver's bound, assumed.
  tolerance: 0.02,
  toleranceSource: "assumed",
  retryableStatuses: [429, 500, 502, 503],
  verification: "live-tested",
  sources: ["https://classifier.dev/openapi.json", "https://classifier.dev/developers", "https://classifier.dev/llms.txt"]
}
