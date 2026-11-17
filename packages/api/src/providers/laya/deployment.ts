import type { Snapshot } from "../deployment.ts"
import { bearer, core, exact } from "../deployment-defaults.ts"

/**
 * Laya typed decisions, a self-hosted System One server (`laya-serve`, or
 * typed-decision-lab's `laya-v1` profile); override `baseUrl`. Each question
 * is its own row of one batched pass, so questions are independent. Answers
 * add `action.act_probability` (upstream: no usable signal yet), kept as
 * native fields. Limits are `laya-serve`'s; the lab allows 100 levels but a
 * 1 MiB body. Use plain-text score levels: newer `laya-serve` versions echo
 * structured levels as text.
 *
 * @since 0.1.0
 */
export const laya: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "laya",
  version: "2026-10-18",
  provider: "laya",
  codec: "system-one",
  envelope: "none",
  auth: bearer,
  baseUrl: "http://localhost:8000",
  path: "/v1/systemone",
  defaultModel: "laya-typed-decisions",
  aliases: {},
  grouping: "independent",
  groupingSource: "documented",
  primitives: core(exact(100, "255 with LAYA_TOURNAMENT_GROUP"), exact(32)),
  structuredDescriptions: true,
  structuredState: true,
  booleanCriteria: true,
  limits: {
    questionsPerCall: exact(64),
    bodyBytes: { value: 1024 * 1024, evidence: "conservative-bound", note: "laya-serve 2 MiB; typed-decision-lab 1 MiB" },
    requestTokens: exact(1_024, "context per question row (state + question)"),
    stateChars: exact(50_000)
  },
  // 4-decimal rounding over up to 100 options.
  tolerance: 0.005,
  toleranceSource: "assumed",
  retryableStatuses: [408, 429, 502, 503, 504],
  verification: "live-tested",
  sources: [
    "https://github.com/NandhaKishorM/laya/blob/d74e8be46ef5241e4ba2b16cd25e896f24f71373/docs/http-api.md",
    "https://huggingface.co/convaiinnovations/laya-typed-decisions"
  ]
}
