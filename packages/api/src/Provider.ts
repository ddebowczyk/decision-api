/**
 * A provider: a deployment snapshot plus how this application talks to it —
 * model, credentials, permitted lowerings, headers, timeout and retry.
 * Credentials default to `Config.Redacted` of the provider's usual variable
 * and are read when the engine layer is built.
 *
 * @since 0.1.0
 */
import { Config, Data, Duration, type Redacted, Result } from "effect"
import * as Deployment from "./Deployment.ts"
import * as Capabilities from "./Capabilities.ts"
import type { Lowering, WireIds } from "./Planner.ts"

/**
 * Retry for one call. `times` counts retries after the first attempt.
 * Delays grow exponentially from `base`, are jittered and capped at `max`;
 * a provider's `Retry-After` wins when it is longer.
 *
 * @since 0.1.0
 */
export interface Retry {
  readonly times: number
  readonly base: Duration.Duration
  readonly max: Duration.Duration
}

/** @since 0.1.0 */
export type Credential = Config.Config<Redacted.Redacted<string>> | Redacted.Redacted<string>

/**
 * A value for a `{name}` placeholder in the deployment's base URL: a literal,
 * or a `Config` read when the engine layer is built.
 *
 * @since 0.1.0
 */
export type Param = Config.Config<string> | string

/** A required, non-empty URL parameter from configuration. @since 0.1.0 */
export const param = (name: string): Config.Config<string> => Config.NonEmptyString(name)

/**
 * A provider that cannot be built as configured, e.g. a URL placeholder with
 * no value. Thrown by the constructors, like `DefinitionError`.
 *
 * @since 0.1.0
 */
export class ProviderError extends Data.TaggedError("ProviderError")<{
  readonly provider: string
  readonly message: string
  readonly hint: string
}> {}

/** @since 0.1.0 */
export interface Provider {
  readonly _tag: "Provider"
  readonly deployment: Deployment.Snapshot
  readonly capabilities: Capabilities.Declaration
  readonly model: string
  readonly allow: ReadonlyArray<Lowering>
  readonly apiKey: Credential | undefined
  /** Values for the base URL's `{name}` placeholders. */
  readonly urlParams: Readonly<Record<string, Param>>
  readonly headers: Readonly<Record<string, string>>
  readonly timeout: Duration.Duration
  readonly retry: Retry
  /** Calls of one decision sent at once. */
  readonly concurrency: number
  /** Question ids on the wire (`Planner.Options.wireIds`); `"caller"` when absent. @since 0.2.0 */
  readonly wireIds?: WireIds | undefined
}

/** @since 0.1.0 */
export interface Options {
  /** Exact provider + model declarations, overriding static defaults. */
  readonly capabilities?: Capabilities.Catalog | undefined
  readonly model?: string | undefined
  readonly allow?: ReadonlyArray<Lowering> | undefined
  readonly apiKey?: Credential | undefined
  readonly headers?: Readonly<Record<string, string>> | undefined
  readonly urlParams?: Readonly<Record<string, Param>> | undefined
  readonly timeout?: Duration.Input | undefined
  readonly retry?: Partial<{ readonly times: number; readonly base: Duration.Input; readonly max: Duration.Input }> | undefined
  readonly concurrency?: number | undefined
  /** `"neutral"` sends `q0`, `q1`, … instead of the definition's question ids. @since 0.2.0 */
  readonly wireIds?: WireIds | undefined
}

/** Two retries, 250 ms doubling, capped at 10 s. @since 0.1.0 */
export const defaultRetry: Retry = { times: 2, base: Duration.millis(250), max: Duration.seconds(10) }

const placeholders = (url: string): ReadonlyArray<string> => [...url.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]!)

const resolveCapabilities = (d: Deployment.Snapshot, model: string, catalog?: Capabilities.Catalog): Capabilities.Declaration => {
  const entry = Capabilities.resolve(d, model, catalog)
  const checked = entry === undefined ? undefined : Capabilities.check(entry)
  if (checked !== undefined && Result.isSuccess(checked)) return checked.success
  throw new ProviderError({
    provider: d.provider,
    message: checked !== undefined && Result.isFailure(checked)
      ? `Invalid capabilities for ${d.provider} + ${model}: ${checked.failure.message}`
      : `No capabilities declared for ${d.provider} + ${model}`,
    hint: "Add an exact provider + model Declaration to the capabilities option"
  })
}

/**
 * A provider for any deployment snapshot. Throws `ProviderError` when the
 * base URL has a placeholder without a value in `urlParams`.
 *
 * @since 0.1.0
 */
export const make = (deployment: Deployment.Snapshot, options: Options = {}): Provider => {
  const model = options.model ?? deployment.defaultModel
  const capabilities = resolveCapabilities(deployment, model, options.capabilities)
  const urlParams = options.urlParams ?? {}
  const missing = placeholders(deployment.baseUrl).filter((name) => !(name in urlParams))
  if (missing.length > 0) {
    throw new ProviderError({
      provider: deployment.id,
      message: `${deployment.id}: base URL ${deployment.baseUrl} needs ${missing.join(", ")}`,
      hint: `Pass urlParams: { ${missing.map((m) => `${m}: Provider.param("<ENV_VAR>")`).join(", ")} } or a literal string`
    })
  }
  return {
    _tag: "Provider",
    deployment: Capabilities.apply(deployment, capabilities),
    capabilities,
    model,
    allow: options.allow ?? [],
    apiKey: options.apiKey,
    headers: options.headers ?? {},
    urlParams,
    timeout: Duration.fromInputUnsafe(options.timeout ?? Duration.seconds(60)),
    retry: {
      times: options.retry?.times ?? defaultRetry.times,
      base: options.retry?.base !== undefined ? Duration.fromInputUnsafe(options.retry.base) : defaultRetry.base,
      max: options.retry?.max !== undefined ? Duration.fromInputUnsafe(options.retry.max) : defaultRetry.max
    },
    concurrency: options.concurrency ?? 4,
    ...(options.wireIds !== undefined ? { wireIds: options.wireIds } : {})
  }
}

/**
 * TypeSafe Jev. Key from `TYPESAFE_API_KEY` unless given. `longContext`
 * sends the documented opt-in header.
 *
 * @example
 * Provider.typesafe({ model: "jev-latest" })
 *
 * @since 0.1.0
 */
export const typesafe = (options: Options & { readonly longContext?: boolean } = {}): Provider =>
  make(Deployment.typesafe, {
    apiKey: Config.Redacted("TYPESAFE_API_KEY"),
    ...options,
    headers: { ...(options.longContext === true ? { "TypeSafe-Danger-Zone-Long-Context": "true" } : {}), ...options.headers }
  })

/**
 * Perplexity Decider. Key from `PERPLEXITY_API_KEY`. Questions are joint, so
 * independent definitions need `allow: ["split-for-isolation"]`.
 *
 * @since 0.1.0
 */
export const perplexity = (options: Options = {}): Provider =>
  make(Deployment.perplexity, { apiKey: Config.Redacted("PERPLEXITY_API_KEY"), ...options })

/**
 * Levanto Sage SystemOne. Key from `LEVANTO_API_KEY` (or `SAGE_API_KEY`) unless given.
 * Defaults to `levanto-sage-2`; `sage-latest` is also accepted.
 *
 * @since 0.1.0
 */
export const levanto = (options: Options = {}): Provider =>
  make(Deployment.levanto, {
    apiKey: Config.Redacted("LEVANTO_API_KEY").pipe(Config.orElse(() => Config.Redacted("SAGE_API_KEY"))),
    ...options
  })

/**
 * OpenAI Decisions. Key from `OPENAI_API_KEY`. Object input needs
 * `allow: ["stringify-state"]`.
 *
 * @since 0.1.0
 */
export const openai = (options: Options = {}): Provider =>
  make(Deployment.openai, { apiKey: Config.Redacted("OPENAI_API_KEY"), ...options })

/**
 * Basal on a local server; no key unless given.
 *
 * @since 0.1.0
 */
export const basal = (options: Options & { readonly baseUrl?: string } = {}): Provider =>
  make(options.baseUrl !== undefined ? Deployment.with(Deployment.basal, { baseUrl: options.baseUrl }) : Deployment.basal, options)

/**
 * RESPAN span-01. Key from `RESPAN_API_KEY`. Boolean questions only, over a
 * conversation span (`Respan.Span`); `model: "span-01-pro"` needs credits.
 *
 * @since 0.1.0
 */
export const respan = (options: Options = {}): Provider =>
  make(Deployment.respan, { apiKey: Config.Redacted("RESPAN_API_KEY"), ...options })

/**
 * Cloudflare Clef on Workers AI. `model` picks the snapshot (`clef` or
 * `clef-flash`). Token from `CLOUDFLARE_API_TOKEN`, account id from
 * `CLOUDFLARE_ACCOUNT_ID`. Questions are joint, so independent definitions
 * need `allow: ["split-for-isolation"]`.
 *
 * @example
 * Provider.clef({ model: "clef-flash", allow: ["split-for-isolation"] })
 *
 * @since 0.1.0
 */
export const clef = (options: Options & { readonly model?: "clef" | "clef-flash" | undefined } = {}): Provider =>
  make(options.model === "clef-flash" ? Deployment.clefFlash : Deployment.clef, {
    apiKey: Config.Redacted("CLOUDFLARE_API_TOKEN"),
    ...options,
    urlParams: { account_id: param("CLOUDFLARE_ACCOUNT_ID"), ...options.urlParams }
  })

/**
 * Fastino GLiDE. Key from `FASTINO_API_KEY`, sent as `X-API-Key`. Waits up
 * to 300 s by default, as Fastino recommends; structured descriptions need
 * `allow: ["stringify-description"]`.
 *
 * @since 0.1.0
 */
export const fastino = (options: Options = {}): Provider =>
  make(Deployment.fastino, { apiKey: Config.Redacted("FASTINO_API_KEY"), timeout: Duration.seconds(300), ...options })

const local = (d: Deployment.Snapshot, baseUrl: string | undefined) => (baseUrl !== undefined ? Deployment.with(d, { baseUrl }) : d)

/**
 * Jeff on a self-hosted server; no key unless given. `isolate` says how the
 * server runs: `"nouls"` (upstream default, choice and score joint) or
 * `"all"` (independent).
 *
 * @example
 * Provider.jeff({ baseUrl: "http://127.0.0.1:8091", isolate: "all" })
 *
 * @since 0.1.0
 */
export const jeff = (options: Options & { readonly baseUrl?: string; readonly isolate?: "nouls" | "all" } = {}): Provider =>
  make(local(options.isolate === "all" ? Deployment.jeffIsolated : Deployment.jeff, options.baseUrl), options)

/**
 * Laya typed decisions on a self-hosted server (`laya-serve` or
 * typed-decision-lab); no key unless given.
 *
 * @since 0.1.0
 */
export const laya = (options: Options & { readonly baseUrl?: string } = {}): Provider =>
  make(local(Deployment.laya, options.baseUrl), options)

/**
 * Classifier.dev. Keyless by default (free per-IP limits); pass `apiKey`
 * (e.g. `Config.Redacted("CLASSIFIER_API_KEY")`) for workspace limits.
 * Object input needs `allow: ["stringify-state"]`.
 *
 * @since 0.1.0
 */
export const classifierDev = (options: Options = {}): Provider => make(Deployment.classifierDev, options)
