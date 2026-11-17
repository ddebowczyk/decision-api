/**
 * Static, JSON-serializable capabilities keyed by exact provider + model.
 * Catalogs are application-owned values: extend or override them at runtime,
 * then pass the catalog to a provider or the pure planner.
 * @since 0.1.0
 */
import { Schema } from "effect"
import * as Deployment from "./Deployment.ts"
import * as Identity from "./Identity.ts"
import type { JsonObject } from "./Json.ts"
import * as Wire from "./Wire.ts"

/** Capabilities used by planning, validation and retry. @since 0.1.0 */
export type Values = Pick<Deployment.Snapshot,
  | "grouping" | "groupingSource" | "primitives" | "structuredDescriptions"
  | "structuredState" | "booleanCriteria" | "limits" | "tolerance"
  | "toleranceSource" | "retryableStatuses">

/** Unknown is distinct from unsupported. @since 0.1.0 */
export type Support = "supported" | "unsupported" | "unknown"

/**
 * Extensible feature metadata. Declaring provider support does not implement
 * an adapter. Missing feature names mean unknown, not unsupported.
 * @since 0.1.0
 */
export interface Feature {
  readonly support: Support
  readonly adapterSupport: Support
  readonly constraints?: JsonObject
}

/** One exact pair, with provenance; plain JSON suitable for metadata. @since 0.1.0 */
export interface Declaration {
  readonly provider: string
  readonly model: string
  readonly version: string
  readonly capabilities: Values
  readonly features: Readonly<Record<string, Feature>>
  readonly sources: ReadonlyArray<string>
  readonly verification: Deployment.Verification
}

/** Later entries override earlier entries for the same exact pair. @since 0.1.0 */
export type Catalog = ReadonlyArray<Declaration>

/** Limits merge by name; primitives replace the whole list. @since 0.1.0 */
export type Overrides = Partial<Pick<Declaration, "version" | "sources" | "verification" | "features">> & {
  readonly capabilities?: Partial<Omit<Values, "limits">> & { readonly limits?: Partial<Values["limits"]> }
}

const verification = Schema.Literals(["documented", "replay-tested", "live-tested", "unknown"])
const positiveInteger = Schema.Number.check(Schema.isFinite(), Schema.isInt(), Schema.isGreaterThan(0))
const limit = Schema.Union([
  Schema.Literal("unknown"),
  Schema.Struct({ value: positiveInteger, evidence: Schema.Literals(["exact", "conservative-bound", "estimate"]), note: Schema.optionalKey(Schema.String) })
])
const support = Schema.Literals(["supported", "unsupported", "unknown"])
const values = Schema.Struct({
  grouping: Schema.Literals(["independent", "joint", "unknown"]),
  groupingSource: verification,
  primitives: Schema.Array(Schema.Struct({ kind: Schema.NonEmptyString, version: Schema.NonEmptyString, minOutcomes: positiveInteger, maxOutcomes: limit })),
  structuredDescriptions: Schema.Boolean,
  structuredState: Schema.Boolean,
  booleanCriteria: Schema.Boolean,
  limits: Schema.Struct({ questionsPerCall: limit, bodyBytes: limit, requestTokens: limit, stateChars: limit }),
  tolerance: Schema.Number.check(Schema.isFinite(), Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(1)),
  toleranceSource: Schema.Literals(["documented", "assumed"]),
  retryableStatuses: Schema.Array(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(100), Schema.isLessThanOrEqualTo(599)))
})

/** Runtime schema for declarations supplied as metadata. @since 0.1.0 */
export const DeclarationSchema = Schema.Struct({
  provider: Schema.NonEmptyString,
  model: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
  capabilities: values,
  features: Schema.Record(Schema.String, Schema.Struct({ support, adapterSupport: support, constraints: Schema.optionalKey(Schema.JsonObject) })),
  sources: Schema.Array(Schema.String),
  verification
})

/** Runtime schema for a static or application-supplied catalog. @since 0.1.0 */
export const CatalogSchema = Schema.Array(DeclarationSchema)

/** Validate unknown metadata; rejects unknown fields and invalid bounds. @since 0.1.0 */
export const decode = Schema.decodeUnknownResult(CatalogSchema, { onExcessProperty: "error" })

/** Validate one declaration, including those constructed in code. @since 0.1.0 */
export const check = Schema.decodeUnknownResult(DeclarationSchema, { onExcessProperty: "error" })

/**
 * Explicitly declare a model using a deployment's capabilities as a starting
 * point. Calling this for a new model is an application-owned assertion.
 * @since 0.1.0
 */
export const declare = (d: Deployment.Snapshot, model = d.defaultModel): Declaration => ({
  provider: d.provider,
  model,
  version: d.version,
  capabilities: {
    grouping: d.grouping,
    groupingSource: d.groupingSource,
    primitives: d.primitives,
    structuredDescriptions: d.structuredDescriptions,
    structuredState: d.structuredState,
    booleanCriteria: d.booleanCriteria,
    limits: d.limits,
    tolerance: d.tolerance,
    toleranceSource: d.toleranceSource,
    retryableStatuses: d.retryableStatuses
  },
  features: {},
  sources: d.sources,
  verification: d.verification
})

/** Exact lookup; no wildcard, cross-provider or implicit alias fallback. @since 0.1.0 */
export const get = (catalog: Catalog, provider: string, model: string): Declaration | undefined =>
  catalog.reduce<Declaration | undefined>((found, entry) =>
    entry.provider === provider && entry.model === model ? entry : found, undefined)

/**
 * Return a new catalog, updating one exact pair. Features merge by name;
 * each supplied feature replaces its previous metadata. Neither the original
 * catalog nor the static declarations are mutated. Version need not change:
 * execution identity includes the effective declaration's content hash.
 * Verification defaults to unknown for application-owned changes.
 * @since 0.1.0
 */
export const override = (catalog: Catalog, provider: string, model: string, patch: Overrides): Catalog => {
  const current = get(catalog, provider, model)
  if (current === undefined) throw new TypeError(`No capabilities declared for ${provider} + ${model}; add a Declaration first`)
  const entry: Declaration = {
    ...current,
    ...patch,
    provider,
    model,
    verification: patch.verification ?? "unknown",
    capabilities: {
      ...current.capabilities,
      ...patch.capabilities,
      limits: { ...current.capabilities.limits, ...patch.capabilities?.limits }
    },
    features: { ...current.features, ...patch.features }
  }
  const validated = Schema.decodeUnknownSync(DeclarationSchema, { onExcessProperty: "error" })(entry)
  return [...catalog.filter((d) => d.provider !== provider || d.model !== model), validated]
}

const models = (d: Deployment.Snapshot): ReadonlyArray<string> =>
  [...new Set([d.defaultModel, ...Object.keys(d.aliases), ...Object.values(d.aliases).filter((m): m is string => m !== null)])]

// These declarations describe provider features beyond today's portable codec.
const sageFeatures: Readonly<Record<string, Feature>> = Object.fromEntries([
  "native-abstention", "numeric-scale-levels", "sort", "tags", "reasoning",
  "latency-mode", "grounding", "images", "decision-batch", "extraction",
  "extraction-batch", "streaming", "usage-estimate", "model-catalog", "readiness"
].map((name) => [name, { support: "supported", adapterSupport: "unsupported" }]))

/**
 * Built-in static declarations. Aliases have their own entries; overriding an
 * alias does not override a pinned model. Deployment-specific settings such
 * as Jeff isolation still come from the selected deployment unless overridden.
 * @since 0.1.0
 */
export const builtIn: Catalog = [
  Deployment.typesafe, Deployment.levanto, Deployment.basal, Deployment.perplexity,
  Deployment.openai, Deployment.respan, Deployment.clef, Deployment.clefFlash,
  Deployment.fastino, Deployment.jeff, Deployment.laya, Deployment.classifierDev
].flatMap((d) => models(d).map((model) => ({
  ...declare(d, model),
  ...(d.provider === "levanto" ? {
    features: sageFeatures,
    sources: [...d.sources, "https://docs.levanto.ai/llms.txt", "https://sage.levanto.ai/openapi.json"]
  } : {})
})))

/**
 * Resolve an exact catalog entry, or the selected deployment's declared
 * default/aliases. An undeclared model stays unknown. Catalog entries take
 * precedence over deployment settings; no global registry is mutated.
 * @since 0.1.0
 */
export const resolve = (d: Deployment.Snapshot, model: string, catalog: Catalog = []): Declaration | undefined => {
  const explicit = get(catalog, d.provider, model)
  if (explicit !== undefined) return explicit
  if (!models(d).includes(model)) return get(builtIn, d.provider, model)
  return { ...declare(d, model), features: get(builtIn, d.provider, model)?.features ?? {} }
}

/** A content identity; object key order does not matter. @since 0.1.0 */
export const fingerprint = (d: Declaration): string =>
  `cap1:${Identity.sha256(Wire.canonical(JSON.parse(JSON.stringify(d))))}`

/** Apply model capabilities while keeping deployment routing/auth. @since 0.1.0 */
export const apply = (d: Deployment.Snapshot, entry: Declaration): Deployment.Snapshot => {
  if (d.provider !== entry.provider) throw new TypeError(`Cannot apply ${entry.provider} capabilities to ${d.provider}`)
  return { ...d, ...entry.capabilities, sources: entry.sources, verification: entry.verification }
}
