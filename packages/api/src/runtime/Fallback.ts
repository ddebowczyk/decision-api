/**
 * Whole-decision fallback across engines, on Effect's `ExecutionPlan`.
 *
 * Each step provides its own engine (`Engine.layerFor`), reruns preparation
 * and planning, and makes one attempt (the engine already retried its calls).
 * Every step after the first is gated by eligibility on the prior failure:
 * provider failures (`AiError`) move on; invalid input, budget exhaustion,
 * incomplete answers and configuration errors stop; plan errors move on only
 * for the reasons named in `on`. Answers never mix providers.
 *
 * @since 0.1.0
 */
import { Effect, ExecutionPlan, Layer } from "effect"
import * as AiError from "effect/ai/AiError"
import type * as Engine from "./Engine.ts"
import * as Ledger from "./Ledger.ts"
import type * as Planner from "../planning/Planner.ts"

/** @since 0.1.0 */
export interface Options {
  /** Plan errors that justify trying the next engine, e.g. `["unsupported", "lowering-required"]`. */
  readonly on?: ReadonlyArray<Exclude<Planner.PlanErrorReason, "stale-plan">> | undefined
}

/** @since 0.1.0 */
export interface Chain<E = unknown, R = unknown> {
  readonly _tag: "FallbackChain"
  readonly size: number
  readonly plan: ExecutionPlan.ExecutionPlan<{ provides: Engine.Engine; input: unknown; error: E; requirements: R }>
  readonly eligible: (error: unknown) => boolean
}

type EngineLayer = Layer.Layer<Engine.Engine, any, any>

/**
 * Whether a failure justifies the next engine.
 *
 * @since 0.1.0
 */
export const eligibility = (options: Options = {}) => {
  const reasons = new Set<string>(options.on ?? [])
  return (error: unknown): boolean => {
    if (AiError.isAiError(error)) return true
    const tagged = error as { readonly _tag?: string; readonly reason?: string }
    return tagged._tag === "PlanError" && tagged.reason !== undefined && reasons.has(tagged.reason)
  }
}

/**
 * Engines to try in order.
 *
 * @example
 * Fallback.make(Engine.layerFor(Provider.typesafe()), Engine.layerFor(Provider.openai({ allow: ["stringify-state"] })))
 * Fallback.make({ on: ["unsupported"] }, Primary, Secondary)
 *
 * @since 0.1.0
 */
export function make<const Ls extends readonly [EngineLayer, ...ReadonlyArray<EngineLayer>]>(
  ...layers: Ls
): Chain<Layer.Error<Ls[number]>, Layer.Services<Ls[number]>>
export function make<const Ls extends readonly [EngineLayer, ...ReadonlyArray<EngineLayer>]>(
  options: Options,
  ...layers: Ls
): Chain<Layer.Error<Ls[number]>, Layer.Services<Ls[number]>>
export function make(...args: ReadonlyArray<unknown>): Chain {
  const [options, layers] = Layer.isLayer(args[0])
    ? [{}, args as ReadonlyArray<EngineLayer>]
    : [args[0] as Options, args.slice(1) as ReadonlyArray<EngineLayer>]
  if (layers.length === 0) throw new TypeError("Fallback.make needs at least one engine layer")
  const eligible = eligibility(options)
  const steps = layers.map((provide, i) => (i === 0 ? { provide, attempts: 1 } : { provide, attempts: 1, while: eligible }))
  return {
    _tag: "FallbackChain",
    size: layers.length,
    plan: (ExecutionPlan.make as (...s: ReadonlyArray<unknown>) => Chain["plan"])(...steps),
    eligible
  }
}

/**
 * Run an effect that needs an `Engine` through a fallback chain. A
 * `DecisionResult`'s `attempts` then include every step's attempts, abandoned
 * steps first.
 *
 * @since 0.1.0
 */
export const run = <E2, R2>(chain: Chain<E2, R2>) =>
<A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E | E2, Exclude<R, Engine.Engine> | R2> =>
  Ledger.capture(
    self.pipe(
      Effect.withExecutionPlan(chain.plan, {
        onEvent: (event) =>
          event._tag === "AttemptFailure" && event.stepIndex + 1 < chain.size
            ? Effect.logInfo("decision fallback step failed").pipe(Effect.annotateLogs({ step: event.stepIndex }))
            : Effect.void
      })
    )
  ).pipe(
    Effect.map(([a, attempts]) =>
      (a as { readonly _tag?: string })._tag === "DecisionResult" ? ({ ...a, attempts }) as A : a
    ),
    Effect.withSpan("Fallback.run", { attributes: { "decision.fallback.steps": chain.size } })
  ) as Effect.Effect<A, E | E2, Exclude<R, Engine.Engine> | R2>
