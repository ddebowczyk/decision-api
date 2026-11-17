/**
 * Pure planning: a prepared decision and a deployment snapshot in, an
 * immutable plan of encoded calls out. No clocks, ids, randomness or I/O.
 *
 * Grouping: a joint definition is one atomic call and needs a joint
 * deployment. An independent definition shares calls on an independent
 * deployment; on a joint one it needs `split-for-isolation`, one question per
 * call. Lowerings apply only when allowed by name, and every applied lowering
 * is recorded. Limits are checked on each final encoded call.
 *
 * @since 0.1.0
 */
import { Data, Result } from "effect"
import type * as Codec from "../wire/Codec.ts"
import type * as Decision from "../domain/Decision.ts"
import * as Deployment from "../providers/deployment.ts"
import * as Identity from "../domain/Identity.ts"
import type { Json, JsonObject } from "../wire/Json.ts"
import type * as Question from "../domain/Question.ts"
import * as Wire from "../wire/Wire.ts"
import * as Capabilities from "../providers/Capabilities.ts"
import * as ContextLimits from "./ContextLimits.ts"
import * as RequestFeatures from "./RequestFeatures.ts"
import { batchCalls } from "./BatchCalls.ts"
import { codecFor } from "./Codecs.ts"

export { codecFor } from "./Codecs.ts"

/**
 * Named permissions to change how a decision is sent.
 *
 * - `stringify-state`: send object state as its JSON text.
 * - `stringify-description`: send structured instructions/descriptions as JSON text.
 * - `split-for-isolation`: one question per call on a joint deployment.
 *
 * @since 0.1.0
 */
export type Lowering = "stringify-state" | "stringify-description" | "split-for-isolation"

/** @since 0.1.0 */
export interface Options {
  readonly capabilities?: Capabilities.Catalog | undefined
  /** Defaults to the deployment's `defaultModel`. */
  readonly model?: string | undefined
  readonly allow?: ReadonlyArray<Lowering> | undefined
  /**
   * Question ids on the wire. `"caller"` (default) sends the definition's
   * ids. `"neutral"` sends `q0`, `q1`, … by position in the definition, so
   * the caller's ids never reach the provider; answers, origins and the
   * ledger keep the caller's ids. Part of the plan fingerprint.
   */
  readonly wireIds?: WireIds | undefined
}

/**
 * How question ids appear on the wire; see `Options.wireIds`.
 *
 * @since 0.2.0
 */
export type WireIds = "caller" | "neutral"

/** @since 0.1.0 */
export interface AppliedLowering {
  readonly name: Lowering
  /** Affected questions; empty when the lowering applies to the state. */
  readonly questionIds: ReadonlyArray<string>
}

/** @since 0.1.0 */
export interface Call {
  readonly callId: string
  readonly index: number
  /** The caller's question ids; `spec.questions[i].id` is the wire id of `questionIds[i]`. */
  readonly questionIds: ReadonlyArray<string>
  readonly spec: Codec.CallSpec
  /** The exact body that will be sent. */
  readonly body: string
  readonly headers?: Readonly<Record<string, string>>
  readonly context?: ContextLimits.Check
  /** UTF-8 length of `body`. */
  readonly bytes: number
}

/** @since 0.1.0 */
export interface DecisionPlan {
  readonly capabilities: Capabilities.Declaration
  readonly _tag: "DecisionPlan"
  readonly definition: string
  readonly definitionId: string
  readonly inputId: string
  readonly deployment: string
  readonly provider: string
  readonly model: string
  readonly codec: string
  readonly request?: JsonObject
  readonly lowerings: ReadonlyArray<AppliedLowering>
  /** How question ids appear on the wire. @since 0.2.0 */
  readonly wireIds: WireIds
  readonly calls: ReadonlyArray<Call>
  /** `exe1:` identity of what is asked, where and how. */
  readonly fingerprint: string
  /** Limits and tolerances that are unknown or assumed for this deployment. */
  readonly warnings: ReadonlyArray<string>
}

/** @since 0.1.0 */
export type PlanErrorReason =
  | "unsupported"
  | "joint-unsupported"
  | "isolation-required"
  | "unknown-grouping"
  | "lowering-required"
  | "too-large"
  | "stale-plan"
  | "provider-constraint"

/**
 * The decision cannot be sent to this deployment as asked. `hint` says what
 * would make it plannable.
 *
 * @since 0.1.0
 */
export class PlanError extends Data.TaggedError("PlanError")<{
  readonly definition: string
  readonly deployment: string
  readonly reason: PlanErrorReason
  readonly message: string
  readonly hint: string
}> {}


const isStructured = (x: Question.Description | null | undefined): boolean => x !== null && x !== undefined && typeof x !== "string"
const text = (x: Question.Description): string => (typeof x === "string" ? x : Wire.stringify(x))

const hasStructured = (q: Question.Any): boolean => {
  if (isStructured(q.instructions)) return true
  const r = q as {
    readonly options?: ReadonlyArray<Question.Option<string>>
    readonly levels?: ReadonlyArray<Question.Option<string>>
    readonly criteria?: { readonly true?: Question.Description; readonly false?: Question.Description }
  }
  return [...(r.options ?? []), ...(r.levels ?? [])].some((o) => isStructured(o.description)) ||
    isStructured(r.criteria?.true) || isStructured(r.criteria?.false)
}

const stringifyDescriptions = (q: Question.Any): Question.Any => {
  const r = q as Question.Any & {
    readonly options?: ReadonlyArray<Question.Option<string>>
    readonly levels?: ReadonlyArray<Question.Option<string>>
    readonly criteria?: { readonly true?: Question.Description; readonly false?: Question.Description }
  }
  const opt = (o: Question.Option<string>) => ({ label: o.label, description: o.description === null ? null : text(o.description) })
  return {
    ...r,
    instructions: text(r.instructions),
    ...(r.options !== undefined ? { options: r.options.map(opt) } : {}),
    ...(r.levels !== undefined ? { levels: r.levels.map(opt) } : {}),
    ...(r.criteria !== undefined
      ? {
        criteria: {
          ...(r.criteria.true !== undefined ? { true: text(r.criteria.true) } : {}),
          ...(r.criteria.false !== undefined ? { false: text(r.criteria.false) } : {})
        }
      }
      : {})
  } as Question.Any
}

/**
 * Plan a prepared decision for a deployment.
 *
 * @since 0.1.0
 */
export const plan = (
  prepared: Decision.Prepared,
  deployment: Deployment.Snapshot,
  options: Options = {}
): Result.Result<DecisionPlan, PlanError> => {
  const def = prepared.definition
  const key = Deployment.key(deployment)
  const allow = new Set(options.allow ?? [])
  const model = options.model ?? deployment.defaultModel
  const fail = (reason: PlanErrorReason, message: string, hint: string) =>
    Result.fail(new PlanError({ definition: def.name, deployment: key, reason, message: `${def.name} on ${key}: ${message}`, hint }))
  const lowerings: Array<AppliedLowering> = []
  const capabilities = Capabilities.resolve(deployment, model, options.capabilities)
  if (capabilities === undefined) return fail("unsupported", `no capabilities declared for ${deployment.provider} + ${model}`, "Pass an exact provider + model Declaration in capabilities")
  const checked = Capabilities.check(capabilities)
  if (Result.isFailure(checked)) return fail("provider-constraint", `invalid capabilities: ${checked.failure.message}`, "Validate metadata with Capabilities.decode and use positive integer limits")
  deployment = Capabilities.apply(deployment, capabilities)

  // 1. Primitive support and bounds.
  for (const [id, q] of def.questions) {
    if (q.kind === "box" && (deployment.codec !== "typesafe-system-one" ||
      !RequestFeatures.available(capabilities, "box") || !prepared.images?.length)) {
      return fail("unsupported", `question "${id}" requires an image and a Box-capable Jev model`, "Use Jev 1.14 with an image")
    }
    const problems = Deployment.fits(deployment, q)
    if (problems.length > 0) return fail("unsupported", `question "${id}": ${problems.join("; ")}`, "Use a deployment that supports this question, or change the definition")
    if (q.kind === "boolean" && (q as Question.BooleanQuestion).criteria !== undefined && !deployment.booleanCriteria) {
      return fail("unsupported", `question "${id}": ${deployment.id} does not accept boolean criteria`, `Fold the criteria into the instructions of "${id}"`)
    }
  }

  // 2. Semantic groups.
  let groups: ReadonlyArray<ReadonlyArray<Decision.Entry>>
  let splittable: boolean
  if (deployment.grouping === "unknown") {
    return fail("unknown-grouping", "question grouping semantics are unknown", "Use a snapshot whose grouping is documented or tested")
  }
  if (def.mode === "joint") {
    if (deployment.grouping !== "joint") {
      return fail("joint-unsupported", `${deployment.id} answers questions independently`, "Use a joint deployment such as Perplexity, or make the definition independent")
    }
    groups = [def.questions]
    splittable = false
  } else if (deployment.grouping === "joint") {
    if (!allow.has("split-for-isolation")) {
      return fail("isolation-required", `${deployment.id} lets questions in one call see each other`, `Pass allow: ["split-for-isolation"] to send one question per call`)
    }
    groups = def.questions.map((e) => [e])
    splittable = false
    lowerings.push({ name: "split-for-isolation", questionIds: def.questions.map(([id]) => id) })
  } else {
    groups = [def.questions]
    splittable = true
  }

  // 3. Lowerings.
  let state: Json = prepared.input
  if (typeof state !== "string" && !deployment.structuredState) {
    if (!allow.has("stringify-state")) {
      return fail("lowering-required", `${deployment.id} accepts only text state`, `Pass allow: ["stringify-state"] to send the input as JSON text`)
    }
    state = Wire.stringify(state)
    lowerings.push({ name: "stringify-state", questionIds: [] })
  }
  const structured = deployment.structuredDescriptions ? [] : def.questions.filter(([, q]) => hasStructured(q)).map(([id]) => id)
  if (structured.length > 0) {
    if (!allow.has("stringify-description")) {
      return fail("lowering-required", `${deployment.id} accepts only text descriptions (questions ${structured.join(", ")})`, `Pass allow: ["stringify-description"] to send them as JSON text`)
    }
    lowerings.push({ name: "stringify-description", questionIds: structured })
  }
  const wireIds: WireIds = options.wireIds ?? "caller"
  const position = new Map(def.questions.map(([id], i) => [id, i] as const))
  const wireId = (id: string): string => (wireIds === "neutral" ? `q${position.get(id)!}` : id)
  const lowered = (e: Decision.Entry): Decision.Entry => [wireId(e[0]), structured.includes(e[0]) ? stringifyDescriptions(e[1]) : e[1]]

  // 4. Partition and encode; check each final call.
  const codec = codecFor(deployment)
  const selected = RequestFeatures.select(prepared, deployment, capabilities, codec)
  if (Result.isFailure(selected)) return fail(selected.failure.reason, selected.failure.problem, selected.failure.hint)
  const { spec: features, headers, summary: request } = selected.success
  const base = { model, state, ...features }
  const questions = (entries: ReadonlyArray<Decision.Entry>) =>
    entries.map(lowered).map(([id, question]) => ({ id, question }))
  const constraints = codec.preflight?.({ ...base, questions: questions(def.questions) }) ?? []
  if (constraints.length > 0) {
    return fail("provider-constraint", constraints.map((c) => c.problem).join("; "), [...new Set(constraints.map((c) => c.hint))].join("; "))
  }
  const stateProblem = ContextLimits.stateProblem(state, deployment.limits.stateChars)
  if (stateProblem !== undefined) return fail("too-large", stateProblem, "Shorten the state")
  const batch = batchCalls({ deployment, codec, base, headers, questions, groups, splittable })
  if (Result.isFailure(batch)) return fail("too-large", batch.failure.message, batch.failure.hint)
  const out = batch.success

  // 5. Identity, call ids, warnings.
  const hasRequest = Object.keys(request).length > 0
  const fingerprint = Identity.execution({
    definition: prepared.definitionId,
    input: prepared.inputId,
    provider: deployment.provider,
    deployment: key,
    model,
    capabilities: Capabilities.fingerprint(capabilities),
    ...(hasRequest ? { request } : {}),
    lowerings: [...lowerings.map((l) => l.name), ...(wireIds === "neutral" ? ["neutral-ids"] : [])]
  })
  const warnings = [
    ...(out.some((call) => call.context.requestEstimate !== undefined)
      ? ["Context sizing uses a UTF-8 byte heuristic and is not a provider token count"] : []),
    ...(out.some((call) => call.context.imageTokensUnknown)
      ? ["Image token cost is unknown and excluded from context estimates"] : []),
    ...(deployment.mayTruncateState ? ["Provider may truncate text state when context is exceeded"] : []),
    ...Object.entries(deployment.limits).filter(([, l]) => l === "unknown").map(([n]) => `${n} limit unknown for ${key}`),
    ...(deployment.toleranceSource === "assumed" ? [`probability tolerance ${deployment.tolerance} is assumed for ${key}`] : [])
  ]
  return Result.succeed({
    _tag: "DecisionPlan",
    capabilities,
    definition: def.name,
    definitionId: prepared.definitionId,
    inputId: prepared.inputId,
    deployment: key,
    provider: deployment.provider,
    model,
    codec: `${codec.id}@${codec.version}`,
    ...(hasRequest ? { request } : {}),
    lowerings,
    wireIds,
    calls: out.map((c, index) => ({ ...c, index, callId: `call-${Identity.sha256(`${fingerprint}:${index}`).slice(0, 12)}-${index}` })),
    fingerprint,
    warnings
  })
}

/**
 * A JSON description of a plan. Bodies contain the input, so they are left
 * out unless asked for.
 *
 * @since 0.1.0
 */
export const preview = (p: DecisionPlan, options: { readonly bodies?: boolean } = {}): Json => ({
  capabilities: JSON.parse(JSON.stringify(p.capabilities)),
  definition: p.definition,
  definitionId: p.definitionId,
  inputId: p.inputId,
  deployment: p.deployment,
  provider: p.provider,
  model: p.model,
  codec: p.codec,
  ...(p.request === undefined ? {} : { request: p.request }),
  fingerprint: p.fingerprint,
  lowerings: p.lowerings.map((l) => ({ name: l.name, questionIds: [...l.questionIds] })),
  wireIds: p.wireIds,
  warnings: [...p.warnings],
  calls: p.calls.map((c) => ({
    callId: c.callId,
    questionIds: [...c.questionIds],
    bytes: c.bytes,
    ...(c.context?.requestEstimate === undefined ? {} : { context: { ...c.context } }),
    ...(c.headers === undefined ? {} : { requestHeaders: { ...c.headers } }),
    ...(options.bodies === true ? { body: c.body } : {})
  }))
})
