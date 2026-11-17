/**
 * A provider: a deployment snapshot plus how this application talks to it —
 * model, credentials, permitted lowerings, headers, timeout and retry.
 * Credentials default to `Config.Redacted` of the provider's usual variable
 * and are read when the engine layer is built.
 *
 * @since 0.1.0
 */
import { Config, Data, Duration, type Redacted, Result } from "effect"
import * as Deployment from "./deployment.ts"
import * as Capabilities from "./Capabilities.ts"
import type { Lowering, WireIds } from "../planning/Planner.ts"

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

export const withBaseUrl = (deployment: Deployment.Snapshot, baseUrl: string | undefined): Deployment.Snapshot =>
  baseUrl === undefined ? deployment : Deployment.with(deployment, { baseUrl })
