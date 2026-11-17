/**
 * Serve Effect's `effect/ai` `DecisionModel` from an `Engine`, so code
 * written against the upstream interface runs on any provider here.
 *
 * Each question settles on its own, so `decideSettled` keeps a gap local:
 * - a refused answer is sent upstream as a `Refusal` (`Unanswered` `Refused`);
 * - an invalid answer (`status: "error"`) is left out (`Unanswered` `Missing`);
 * - a label-only choice keeps no probabilities (`Unanswered` `NoDistribution`).
 *
 * `decide` (not settled) fails the whole call for any of them, as upstream
 * documents. What the upstream answer cannot carry (status, problem, refusal
 * reason, origin) is in the response metadata under {@link METADATA_KEY}.
 * `modelId` is the resolved model when the provider reported one, else the
 * requested model.
 *
 * Plan errors are `InvalidRequestError`; `BudgetExhausted` is `UnknownError`
 * with `metadata.budget` set to its kind. `Locate` decisions are not supported
 * (`supportsLocate: false`). Upstream classify criteria are a JavaScript
 * object, so integer-like labels lose their order before they reach this
 * bridge.
 *
 * @since 0.1.0
 */
import { Effect, Layer, Schema } from "effect"
import * as AiError from "effect/ai/AiError"
import type * as UpDecision from "effect/ai/Decision"
import * as DecisionModel from "effect/ai/DecisionModel"
import type * as Answer from "../domain/Answer.ts"
import * as Decision from "../domain/Decision.ts"
import * as Engine from "../runtime/Engine.ts"
import * as Identity from "../domain/Identity.ts"
import type { Json, JsonObject } from "../wire/Json.ts"
import * as Q from "../domain/Question.ts"

/** Upstream decisions this bridge accepts; `Locate` needs images, which it does not support. */
type Supported = Exclude<UpDecision.Any, UpDecision.Locate>

/**
 * Response metadata key for what upstream answers cannot carry.
 *
 * @since 0.2.0
 */
export const METADATA_KEY = "@decisions/api" as const

/**
 * The bridge's response metadata: the engine result's identity, and each
 * question's own status and origin.
 *
 * @since 0.2.0
 */
export interface Metadata {
  readonly deployment: string
  readonly model: string
  readonly fingerprint: string
  readonly answers: Readonly<
    Record<string, {
      readonly status: Answer.Any["status"]
      readonly detail: string | null
      readonly origin: Answer.Origin
    }>
  >
}

/**
 * The bridge metadata of an upstream response, or `undefined` when the
 * response did not come through this bridge.
 *
 * @since 0.2.0
 */
export const metadataOf = (response: { readonly metadata: DecisionModel.DecideResponseMetadata }): Metadata | undefined => {
  const m = (response.metadata as Record<string, unknown>)[METADATA_KEY]
  return m !== null && typeof m === "object" && !Array.isArray(m) ? m as unknown as Metadata : undefined
}

const toQuestion = (d: Supported): Q.Any => {
  switch (d._tag) {
    case "Probability":
      return Q.boolean(d.instructions, d.criteria)
    case "Classify":
      return Q.choice(d.instructions, Object.entries(d.criteria))
    case "Rate":
      return Q.score(d.instructions, d.criteria.map((c) => [c.label, c.description] as const))
  }
}

/** One upstream answer, or `undefined` to leave the key out (settles as `Missing`). */
const toProviderAnswer = (kind: Supported["_tag"], a: Answer.Any): DecisionModel.ProviderAnswer | undefined => {
  if (a.status === "refused") return { _tag: "Refusal" }
  if (a.status !== "answered") return undefined
  const probabilities = a.evidence.kind === "finite-distribution" ? { probabilities: a.evidence.probabilities } : {}
  const confidence = a.native.confidence !== undefined ? { confidence: a.native.confidence } : {}
  switch (kind) {
    case "Probability":
      return { _tag: "Probability", probability: a.value as number }
    case "Classify":
      return { _tag: "Classify", label: a.value as string, ...probabilities, ...confidence }
    case "Rate":
      return { _tag: "Rate", rating: a.value as number, ...probabilities, ...confidence }
  }
}

const detailOf = (a: Answer.Any): string | null =>
  a.status === "error" ? a.problem : a.status === "answered" ? null : a.reason

const requestError = (description: string) =>
  AiError.make({ module: "Bridge", method: "decide", reason: new AiError.InvalidRequestError({ description }) })

/**
 * The upstream `DecisionModel` backed by the current `Engine`.
 *
 * @since 0.1.0
 */
export const toDecisionModel: Effect.Effect<DecisionModel.DecisionModel, never, Engine.Engine> = Effect.gen(function*() {
  const engine = yield* Engine.Engine
  return yield* DecisionModel.make({
    supportsImages: false,
    supportsLocate: false,
    decide: (options) =>
      Effect.gen(function*() {
        const entries = Object.entries(options.decisions)
        const definition = Decision.make("effect-ai-decision", {
          revision: "bridge-1",
          input: Schema.Json,
          questions: entries.map(([id, d]) => [id, toQuestion(d)] as const)
        })
        const input = options.state as Json
        const prepared: Decision.Prepared = {
          _tag: "PreparedDecision",
          definition,
          definitionId: Identity.definition(definition),
          input,
          inputId: Identity.input(input)
        }
        const plan = yield* engine.plan(prepared).pipe(
          Effect.mapError((e) => requestError(`${e.message}. ${e.hint}`))
        )
        const result = yield* engine.execute(prepared, plan).pipe(
          Effect.catchTag("PlanError", (e) => Effect.fail(requestError(e.message))),
          Effect.catchTag("BudgetExhausted", (e) =>
            Effect.fail(
              AiError.make({
                module: "Bridge",
                method: "decide",
                reason: new AiError.UnknownError({ description: e.message, metadata: { budget: e.kind } })
              })
            )
          )
        )
        const byId = result.answers as Readonly<Record<string, Answer.Any>>
        const answers: Record<string, DecisionModel.ProviderAnswer> = {}
        const notes: Record<string, Metadata["answers"][string]> = {}
        let resolved: string | null = null
        for (const [id, d] of entries) {
          const a = byId[id]!
          const mapped = toProviderAnswer(d._tag, a)
          if (mapped !== undefined) answers[id] = mapped
          notes[id] = { status: a.status, detail: detailOf(a), origin: a.origin }
          resolved ??= a.origin.resolvedModel
        }
        const metadata: Metadata = {
          deployment: result.deployment,
          model: result.model,
          fingerprint: result.fingerprint,
          answers: notes
        }
        const requestId = [...result.attempts].reverse().find((e) => e.outcome === "ok")?.requestId ?? null
        return {
          answers,
          usage: result.usage,
          modelId: resolved ?? result.model,
          ...(requestId !== null ? { id: requestId } : {}),
          metadata: { [METADATA_KEY]: metadata as unknown as JsonObject }
        }
      })
  })
})

/**
 * A layer providing `effect/ai`'s `DecisionModel` from the current `Engine`.
 *
 * @example
 * Effect.provide(program, Bridge.layerDecisionModel.pipe(Layer.provide(Engine.layerFor(Provider.typesafe()))))
 *
 * @since 0.1.0
 */
export const layerDecisionModel: Layer.Layer<DecisionModel.DecisionModel, never, Engine.Engine> = Layer.effect(
  DecisionModel.DecisionModel,
  toDecisionModel
)

