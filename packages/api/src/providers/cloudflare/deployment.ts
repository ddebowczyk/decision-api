import type { Snapshot } from "../deployment.ts"
import { bearer, core, exact } from "../deployment-defaults.ts"

/** Clef rounds probabilities to 4 decimals: at most 5e-5 each, over up to 255 options. */
const CLEF_TOLERANCE = 0.0128

const clefSources = [
  "https://developers.cloudflare.com/workers-ai/get-started/rest-api/",
  "https://developers.cloudflare.com/workers-ai/platform/errors/",
  "https://developers.cloudflare.com/workers-ai/platform/limits/",
  "https://blog.cloudflare.com/clef-decision-models"
]

/**
 * Cloudflare Clef on Workers AI. The account id is a base URL parameter
 * (`urlParams: { account_id }`); the body is System One inside the Cloudflare
 * envelope. Questions in one call are scored jointly (the launch post's
 * "joint cross-field attention"), so independent definitions need
 * `split-for-isolation`. Question ids must match `[A-Za-z0-9_.-]{1,100}`.
 * Text state over the context window is truncated silently, not rejected.
 *
 * @since 0.1.0
 */
export const clef: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "clef",
  version: "2026-11-17",
  provider: "cloudflare",
  codec: "clef-system-one",
  envelope: "cloudflare",
  auth: bearer,
  baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai",
  path: "/run/@cf/cloudflare/{model}",
  defaultModel: "clef",
  aliases: {},
  grouping: "joint",
  groupingSource: "documented",
  primitives: core(exact(255), exact(10)),
  structuredDescriptions: true,
  structuredState: true,
  mayTruncateState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: exact(64),
    bodyBytes: exact(13 * 1024 * 1024),
    requestTokens: exact(65_536, "context window; longer text state is truncated silently"),
    stateChars: "unknown"
  },
  tolerance: CLEF_TOLERANCE,
  toleranceSource: "assumed",
  // No published retry list: request timeouts (3007/3008), capacity (3040) and gateway errors.
  retryableStatuses: [408, 429, 502, 503, 504],
  verification: "live-tested",
  sources: ["https://developers.cloudflare.com/ai/models/@cf/cloudflare/clef/", ...clefSources]
}

/**
 * Cloudflare Clef Flash: Clef with a 24,576-token context window.
 *
 * @since 0.1.0
 */
export const clefFlash: Snapshot = {
  ...clef,
  id: "clef-flash",
  defaultModel: "clef-flash",
  limits: { ...clef.limits, requestTokens: exact(24_576, "context window; longer text state is truncated silently") },
  sources: ["https://developers.cloudflare.com/ai/models/@cf/cloudflare/clef-flash/", ...clefSources]
}
