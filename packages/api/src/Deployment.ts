/**
 * Versioned capability snapshots of provider deployments. A snapshot is plain
 * JSON data with its sources and verification status; unknown is never
 * treated as support.
 *
 * @since 0.1.0
 */
import * as Question from "./Question.ts"

/** @since 0.1.0 */
export type Verification = "documented" | "replay-tested" | "live-tested" | "unknown"

/** How a limit is known. @since 0.1.0 */
export type LimitEvidence = "exact" | "conservative-bound" | "estimate"

/** @since 0.1.0 */
export type Limit = { readonly value: number; readonly evidence: LimitEvidence; readonly note?: string } | "unknown"

/** @since 0.1.0 */
export type Codec = "system-one" | "openai-decisions" | "respan" | "classifier-dev"

/**
 * What wraps the codec's body on the wire. `cloudflare`: the v4 API envelope
 * `{ result, success, errors, messages }`; the transport unwraps `result` and
 * treats `success !== true` as a failure.
 *
 * @since 0.1.0
 */
export type Envelope = "none" | "cloudflare"

/**
 * How the API key is sent. `bearer`: `Authorization: Bearer <key>`;
 * `header`: the raw key in the named header. Either is omitted without a key.
 *
 * @since 0.1.0
 */
export type Auth = { readonly scheme: "bearer" } | { readonly scheme: "header"; readonly name: string }

/**
 * `independent`: questions in one call cannot see each other. `joint`: they
 * can, so independent questions need one call each.
 *
 * @since 0.1.0
 */
export type Grouping = "independent" | "joint" | "unknown"

/** @since 0.1.0 */
export interface Primitive {
  readonly kind: string
  readonly version: string
  readonly minOutcomes: number
  readonly maxOutcomes: Limit
}

/** @since 0.1.0 */
export interface Snapshot {
  readonly _tag: "DeploymentSnapshot"
  /** Stable deployment id, e.g. `typesafe`. */
  readonly id: string
  /** Snapshot date; a new snapshot is a new identity. */
  readonly version: string
  readonly provider: string
  readonly codec: Codec
  readonly envelope: Envelope
  readonly auth: Auth
  /** May contain `{name}` placeholders, filled from `Provider.urlParams`. */
  readonly baseUrl: string
  /** May contain `{model}`, replaced per call with the URL-encoded model. */
  readonly path: string
  readonly defaultModel: string
  /** Known aliases and what they resolve to; `null` when the provider does not say. */
  readonly aliases: { readonly [alias: string]: string | null }
  readonly grouping: Grouping
  readonly groupingSource: Verification
  readonly primitives: ReadonlyArray<Primitive>
  /** Instructions and criteria may be JSON objects/arrays. */
  readonly structuredDescriptions: boolean
  /** State may be a JSON object/array. */
  readonly structuredState: boolean
  /** Boolean questions accept `true`/`false` criteria. */
  readonly booleanCriteria: boolean
  readonly limits: {
    readonly questionsPerCall: Limit
    readonly bodyBytes: Limit
    readonly requestTokens: Limit
    readonly stateChars: Limit
  }
  /** Rounding tolerance for distribution mass, see `Validate`. */
  readonly tolerance: number
  readonly toleranceSource: "documented" | "assumed"
  /** Status codes the provider documents as transient. */
  readonly retryableStatuses: ReadonlyArray<number>
  readonly verification: Verification
  readonly sources: ReadonlyArray<string>
}

/** `id@version`, used in identities and ledgers. @since 0.1.0 */
export const key = (d: Snapshot): string => `${d.id}@${d.version}`

const exact = (value: number, note?: string): Limit => (note === undefined ? { value, evidence: "exact" } : { value, evidence: "exact", note })
const core = (choiceMax: Limit, scoreMax: Limit): ReadonlyArray<Primitive> => [
  { kind: "boolean", version: "1", minOutcomes: 2, maxOutcomes: exact(2) },
  { kind: "choice", version: "1", minOutcomes: 2, maxOutcomes: choiceMax },
  { kind: "score", version: "1", minOutcomes: 2, maxOutcomes: scoreMax }
]

const bearer: Auth = { scheme: "bearer" }

/** Assumed until a provider documents its rounding. */
const ASSUMED_TOLERANCE = 1e-3

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
  version: "2026-11-03",
  provider: "levanto",
  codec: "system-one",
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

/**
 * RESPAN span-01, hosted. Boolean questions only, as behaviors over a
 * conversation span (`Respan.Span`); each behavior is its own branch, so
 * questions are independent. No published body, token or behavior-count
 * limits (the docs say there is no behavior cap; oversized spans get 413).
 *
 * @since 0.1.0
 */
export const respan: Snapshot = {
  _tag: "DeploymentSnapshot",
  id: "respan",
  version: "2026-10-18",
  provider: "respan",
  codec: "respan",
  envelope: "none",
  auth: bearer,
  baseUrl: "https://api.respan.ai",
  path: "/api/v1/scores",
  defaultModel: "span-01-free",
  aliases: {},
  grouping: "independent",
  groupingSource: "documented",
  primitives: [{ kind: "boolean", version: "1", minOutcomes: 2, maxOutcomes: exact(2) }],
  structuredDescriptions: false,
  structuredState: true,
  booleanCriteria: true,
  limits: { questionsPerCall: "unknown", bodyBytes: "unknown", requestTokens: "unknown", stateChars: "unknown" },
  tolerance: ASSUMED_TOLERANCE,
  toleranceSource: "assumed",
  retryableStatuses: [424, 429, 503, 504],
  verification: "live-tested",
  sources: [
    "https://respan.ai/docs/openapi.json",
    "https://www.respan.ai/docs/apis/gateway/run-span-01",
    "https://www.respan.ai/docs/documentation/span-01/concept"
  ]
}

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
  version: "2026-10-18",
  provider: "cloudflare",
  codec: "system-one",
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
  version: "2026-10-18",
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
    requestTokens: exact(40_000, "per rendered prompt (state + one question), not per request"),
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

/**
 * A copy with fields replaced, e.g. a local `baseUrl`. Change `version` too
 * when the capabilities themselves change.
 *
 * @since 0.1.0
 */
export const withOverrides = (d: Snapshot, overrides: Partial<Omit<Snapshot, "_tag">>): Snapshot => ({ ...d, ...overrides })
export { withOverrides as with }

/**
 * Problems that stop a question from being asked on a deployment; empty when
 * it fits. Unknown bounds do not fail here; the planner reports them.
 *
 * @since 0.1.0
 */
export const fits = (d: Snapshot, q: Question.Any): ReadonlyArray<string> => {
  const p = d.primitives.find((x) => x.kind === q.kind && x.version === q.version)
  if (p === undefined) return [`${d.id} does not support ${q.kind} v${q.version}`]
  const n = Question.outcomes(q).length
  const what = q.kind === "score" ? "levels" : "options"
  const problems: Array<string> = []
  if (n < p.minOutcomes) problems.push(`${n} ${what}; ${d.id} needs at least ${p.minOutcomes}`)
  if (p.maxOutcomes !== "unknown" && n > p.maxOutcomes.value) {
    problems.push(`${n} ${what}; ${d.id} accepts at most ${p.maxOutcomes.value} (${p.maxOutcomes.evidence})`)
  }
  return problems
}
