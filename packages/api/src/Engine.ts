/**
 * The engine: one provider, planned and executed. Build it with
 * `Engine.layerFor(provider)`, which returns a new layer object on every
 * call so nested `Effect.provide` never reuses an engine built for another
 * provider (Effect v4 memoizes layers by identity).
 *
 * @since 0.1.0
 */
import { Clock, type Config, Context, Data, Duration, Effect, Layer, Metric, Redacted, Ref, Result, Schedule } from "effect"
import * as AiError from "effect/ai/AiError"
import type { HttpClient } from "effect/http"
import type * as Answer from "./Answer.ts"
import * as Budget from "./Budget.ts"
import type * as Codec from "./Codec.ts"
import * as Decision from "./Decision.ts"
import * as Deployment from "./Deployment.ts"
import * as Ledger from "./Ledger.ts"
import * as Metrics from "./Metrics.ts"
import * as Planner from "./Planner.ts"
import type { Json } from "./Json.ts"
import * as Provider from "./Provider.ts"
import * as Question from "./Question.ts"
import * as Transport from "./Transport.ts"
import * as Validate from "./Validate.ts"

/**
 * Answers for every question, with provenance.
 *
 * @since 0.1.0
 */
export interface DecisionResult<D extends Decision.Any = Decision.Any> {
  readonly _tag: "DecisionResult"
  readonly definition: D["name"]
  readonly fingerprint: string
  readonly deployment: string
  readonly model: string
  readonly answers: Decision.Answers<D>
  /** Summed over calls; `undefined` when any call did not report it. */
  readonly usage: { readonly inputTokens: number | undefined; readonly outputTokens: number | undefined }
  /** Every attempt this decision made, in order. */
  readonly attempts: ReadonlyArray<Ledger.Entry>
}

/**
 * `decideAll` needs every question answered; some were refused or invalid.
 *
 * @since 0.1.0
 */
export class DecisionIncomplete extends Data.TaggedError("DecisionIncomplete")<{
  readonly definition: string
  readonly message: string
  readonly hint: string
  readonly problems: ReadonlyArray<{ readonly questionId: string; readonly status: "refused" | "error"; readonly detail: string | null }>
  readonly result: DecisionResult
}> {}

/** @since 0.1.0 */
export interface Service {
  readonly provider: Provider.Provider
  readonly plan: (prepared: Decision.Prepared) => Effect.Effect<Planner.DecisionPlan, Planner.PlanError>
  readonly execute: <D extends Decision.Any>(
    prepared: Decision.Prepared<D>,
    plan: Planner.DecisionPlan
  ) => Effect.Effect<DecisionResult<D>, AiError.AiError | Planner.PlanError | Budget.BudgetExhausted>
}

/**
 * @since 0.1.0
 */
export class Engine extends Context.Service<Engine, Service>()("@decisions/api/Engine") {}

const sumKnown = (xs: ReadonlyArray<number | undefined>): number | undefined =>
  xs.some((x) => x === undefined) ? undefined : xs.reduce<number>((a, b) => a + b!, 0)

const invalidOutput = (deployment: Deployment.Snapshot, description: string) =>
  AiError.make({ module: deployment.provider, method: "decide", reason: new AiError.InvalidOutputError({ description }) })

/**
 * Build the engine service for a provider. Reads the provider's credential
 * and URL parameters from `Config` once.
 *
 * @since 0.1.0
 */
export const make = (provider: Provider.Provider) =>
  Effect.gen(function*() {
    const apiKey = provider.apiKey === undefined
      ? undefined
      : Redacted.isRedacted(provider.apiKey)
      ? provider.apiKey as Redacted.Redacted<string>
      : yield* (provider.apiKey as Config.Config<Redacted.Redacted<string>>)
    const http = yield* Effect.context<HttpClient.HttpClient>()
    let baseUrl = provider.deployment.baseUrl
    for (const [name, value] of Object.entries(provider.urlParams)) {
      const resolved = typeof value === "string" ? value : yield* value
      baseUrl = baseUrl.replaceAll(`{${name}}`, encodeURIComponent(resolved))
    }
    const deployment = baseUrl === provider.deployment.baseUrl ? provider.deployment : Deployment.with(provider.deployment, { baseUrl })
    const key = Deployment.key(deployment)
    const codec = Planner.codecFor(deployment)
    const attrs = { deployment: key }

    const plan = (prepared: Decision.Prepared) =>
      Effect.fromResult(Planner.plan(prepared, deployment, {
        model: provider.model,
        allow: provider.allow,
        capabilities: [provider.capabilities],
        wireIds: provider.wireIds
      }))

    /** One attempt of one call, recorded in the ledger and metrics. */
    const attempt = (p: Planner.DecisionPlan, call: Planner.Call, n: number) =>
      Effect.gen(function*() {
        const ledger = yield* Ledger.Ledger
        yield* (yield* Budget.Budget).reserveAttempt
        const started = yield* Clock.currentTimeMillis
        const exit = yield* Effect.exit(
          Transport.send(deployment, call, { apiKey, headers: provider.headers, timeout: provider.timeout }).pipe(
            Effect.flatMap((ex) => {
              const r = codec.decode(call.spec, ex.body)
              return Result.isSuccess(r)
                ? Effect.succeed({ ex, decoded: r.success })
                : Effect.fail(invalidOutput(deployment, r.failure.message))
            }),
            Effect.provide(http)
          )
        )
        const durationMillis = (yield* Clock.currentTimeMillis) - started
        const ok = exit._tag === "Success"
        const error = exit._tag === "Failure" ? exit.cause.reasons.find((r) => r._tag === "Fail")?.error : undefined
        const entry: Ledger.Entry = {
          callId: call.callId,
          attempt: n,
          deployment: key,
          model: p.model,
          fingerprint: p.fingerprint,
          questionIds: call.questionIds,
          outcome: ok ? "ok" : "failed",
          status: ok ? exit.value.ex.status : error !== undefined ? Transport.statusOf(error) ?? null : null,
          requestId: ok ? exit.value.ex.requestId : error !== undefined ? Transport.requestIdOf(error) : null,
          durationMillis,
          error: error !== undefined
            ? { tag: error.reason._tag, message: error.message, retryable: Transport.isRetryable(deployment, error) }
            : null,
          usage: ok ? exit.value.decoded.usage : null
        }
        yield* ledger.record(entry)
        yield* Metric.update(Metric.withAttributes(Metrics.calls, { ...attrs, outcome: entry.outcome }), 1)
        yield* Metric.update(Metric.withAttributes(Metrics.latency, attrs), durationMillis)
        if (ok) {
          const u = exit.value.decoded.usage
          if (u.inputTokens !== undefined) yield* Metric.update(Metric.withAttributes(Metrics.tokens, { ...attrs, kind: "input" }), u.inputTokens)
          if (u.outputTokens !== undefined) yield* Metric.update(Metric.withAttributes(Metrics.tokens, { ...attrs, kind: "output" }), u.outputTokens)
          yield* Effect.logDebug("decision call ok")
        } else {
          yield* Effect.logWarning("decision call failed", entry.error?.message ?? "defect")
        }
        return yield* exit.pipe(Effect.map(({ decoded }) => ({ decoded, attempt: n })))
      }).pipe(
        Effect.annotateLogs({ deployment: key, callId: call.callId, attempt: n }),
        Effect.withSpan("Engine.call", { attributes: { "decision.call": call.callId, "decision.attempt": n, "decision.deployment": key } })
      )

    /**
     * The only retry loop: eligible failures (`Transport.isRetryable`) are
     * retried up to `retry.times`, exponential and jittered from `retry.base`,
     * capped at `retry.max`; a longer `Retry-After` wins. A delay that would
     * pass the budget's deadline stops with `BudgetExhausted`.
     */
    const withRetry = (p: Planner.DecisionPlan, call: Planner.Call) =>
      Effect.gen(function*() {
        const budget = yield* Budget.Budget
        const counter = yield* Ref.make(0)
        const maxMillis = Duration.toMillis(provider.retry.max)
        const schedule = Schedule.exponential(provider.retry.base).pipe(
          Schedule.jittered,
          Schedule.modifyDelay(({ duration, input }: Schedule.Metadata<Duration.Duration, AiError.AiError | Budget.BudgetExhausted>) =>
            Effect.gen(function*() {
              const after = input._tag === "AiError" && input.retryAfter !== undefined ? Duration.toMillis(input.retryAfter) : 0
              const delay = Math.max(Math.min(Duration.toMillis(duration), maxMillis), after)
              const remaining = yield* budget.remainingMillis
              if (remaining !== undefined && delay > remaining) {
                return yield* new Budget.BudgetExhausted({
                  kind: "deadline",
                  message: `next retry in ${delay} ms would pass the deadline (${Math.max(0, remaining)} ms left)`,
                  hint: "Raise Budget.limit({ within }), or accept the provider failure in lastError",
                  lastError: input
                })
              }
              yield* Effect.logDebug("decision call retry scheduled").pipe(Effect.annotateLogs({ delayMillis: delay, callId: call.callId }))
              return Duration.millis(delay)
            })
          )
        )
        return yield* Ref.updateAndGet(counter, (n) => n + 1).pipe(
          Effect.flatMap((n) => attempt(p, call, n)),
          Effect.retry({
            schedule,
            times: provider.retry.times,
            while: (e) => e._tag === "AiError" && Transport.isRetryable(deployment, e)
          })
        )
      })

    const assemble = <D extends Decision.Any>(
      prepared: Decision.Prepared<D>,
      p: Planner.DecisionPlan,
      results: ReadonlyArray<{ readonly call: Planner.Call; readonly decoded: Codec.Decoded; readonly attempt: number }>
    ) => {
      const answers: Record<string, Answer.Any> = {}
      for (const { call, decoded, attempt: n } of results) {
        const reported = decoded.reportedModel
        const resolvedModel = reported === null || (reported === p.model && p.model in deployment.aliases) ? null : reported
        for (const [i, id] of call.questionIds.entries()) {
          const question = Decision.question(prepared.definition, id)
          const origin: Answer.Origin = {
            questionId: id,
            callId: call.callId,
            attempt: n,
            provider: deployment.provider,
            deployment: key,
            requestedModel: p.model,
            resolvedModel,
            lowerings: p.lowerings.filter((l) => l.questionIds.length === 0 || l.questionIds.includes(id)).map((l) => l.name)
          }
          const d = decoded.answers.get(call.spec.questions[i]!.id)
          const empty = { confidence: undefined, fields: {} }
          answers[id] = d === undefined
            ? { status: "error", problem: "no answer in the response", origin, native: empty }
            : d._tag === "Refused"
            ? { status: "refused", reason: d.reason, origin, native: d.native }
            : d._tag === "Malformed"
            ? { status: "error", problem: d.problem, origin, native: d.native }
            : (() => {
              const v = Validate.answer(question, d.candidate, deployment.tolerance)
              return v._tag === "Valid"
                ? { status: "answered", value: v.value, evidence: v.evidence, corrections: v.corrections, origin, native: d.native }
                : { status: "error", problem: v.problem, origin, native: d.native }
            })()
        }
      }
      return answers as unknown as Decision.Answers<D>
    }

    const execute = <D extends Decision.Any>(prepared: Decision.Prepared<D>, p: Planner.DecisionPlan) =>
      Effect.gen(function*() {
        const expected = yield* Effect.result(plan(prepared))
        if (p.deployment !== key || Result.isFailure(expected) || p.fingerprint !== expected.success.fingerprint) {
          return yield* Effect.fail(
            new Planner.PlanError({
              definition: prepared.definition.name,
              deployment: key,
              reason: "stale-plan",
              message: `${prepared.definition.name}: plan ${p.fingerprint} was made for ${p.deployment} or another input`,
              hint: "Plan again with this engine and this prepared input"
            })
          )
        }
        const [results, attempts] = yield* Ledger.capture(
          Effect.forEach(p.calls, (call) => withRetry(p, call).pipe(Effect.map((r) => ({ call, ...r }))), {
            concurrency: provider.concurrency
          })
        )
        const answers = assemble(prepared, p, results)
        for (const a of Object.values(answers) as ReadonlyArray<Answer.Any>) {
          yield* Metric.update(Metric.withAttributes(Metrics.answers, { ...attrs, status: a.status }), 1)
        }
        const result: DecisionResult<D> = {
          _tag: "DecisionResult",
          definition: prepared.definition.name,
          fingerprint: p.fingerprint,
          deployment: key,
          model: p.model,
          answers,
          usage: {
            inputTokens: sumKnown(results.map((r) => r.decoded.usage.inputTokens)),
            outputTokens: sumKnown(results.map((r) => r.decoded.usage.outputTokens))
          },
          attempts
        }
        yield* Effect.logDebug("decision executed")
        return result
      }).pipe(
        Effect.annotateLogs({ decision: prepared.definition.name, deployment: key }),
        Effect.withSpan("Engine.execute", {
          attributes: { "decision.name": prepared.definition.name, "decision.deployment": key, "decision.calls": p.calls.length }
        })
      )

    return Engine.of({ provider, plan, execute })
  })

/**
 * A layer for one provider. Each call returns a new layer object, so a
 * fallback chain can provide several engines without one shadowing another.
 *
 * @example
 * const TypeSafe = Engine.layerFor(Provider.typesafe({ model: "jev-latest" }))
 *
 * @since 0.1.0
 */
export const layerFor = (provider: Provider.Provider): Layer.Layer<Engine, Config.ConfigError, HttpClient.HttpClient> =>
  Layer.effect(Engine, make(provider))

/**
 * Prepare and plan without sending anything.
 *
 * @since 0.1.0
 */
export const plan = <D extends Decision.Any>(definition: D, input: Decision.Input<D>) =>
  Effect.gen(function*() {
    const engine = yield* Engine
    const prepared = yield* Decision.prepare(definition, input)
    return yield* engine.plan(prepared)
  }).pipe(Effect.withSpan("Engine.plan", { attributes: { "decision.name": definition.name } }))

/**
 * Prepare, plan and execute. Refused and invalid answers are values in the
 * result; transport and envelope failures are `AiError`s.
 *
 * @example
 * const r = yield* Engine.decide(Triage, { subject: "Double charge", body: "Charged twice" })
 * if (r.answers.team.status === "answered") r.answers.team.value // "billing" | "technical"
 *
 * @since 0.1.0
 */
export const decide = <D extends Decision.Any>(
  definition: D,
  input: Decision.Input<D>
): Effect.Effect<
  DecisionResult<D>,
  Decision.PreparationError | Planner.PlanError | AiError.AiError | Budget.BudgetExhausted,
  Engine | D["input"]["EncodingServices"]
> =>
  Effect.gen(function*() {
    const engine = yield* Engine
    const prepared = yield* Decision.prepare(definition, input)
    const p = yield* engine.plan(prepared)
    yield* Effect.annotateCurrentSpan({ "decision.fingerprint": p.fingerprint, "decision.deployment": p.deployment })
    return yield* engine.execute(prepared, p)
  }).pipe(Effect.withSpan("Engine.decide", { attributes: { "decision.name": definition.name } })) as Effect.Effect<
    DecisionResult<D>,
    Decision.PreparationError | Planner.PlanError | AiError.AiError | Budget.BudgetExhausted,
    Engine | D["input"]["EncodingServices"]
  >

/**
 * Like `decide`, but returns plain values and fails with `DecisionIncomplete`
 * unless every question was answered.
 *
 * @since 0.1.0
 */
export const decideAll = <D extends Decision.Any>(definition: D, input: Decision.Input<D>) =>
  decide(definition, input).pipe(
    Effect.flatMap((result) => {
      const entries = Object.entries(result.answers as Record<string, Answer.Any>)
      const problems = entries.flatMap(([questionId, a]) =>
        a.status === "answered" ? [] : [{ questionId, status: a.status, detail: a.status === "refused" ? a.reason : a.problem }]
      )
      if (problems.length > 0) {
        return Effect.fail(
          new DecisionIncomplete({
            definition: definition.name,
            message: `${definition.name}: ${problems.map((p) => `${p.questionId} ${p.status}`).join(", ")}`,
            hint: "Use Engine.decide to handle refused and invalid answers per question, or add a fallback",
            problems,
            result
          })
        )
      }
      return Effect.succeed(
        Object.fromEntries(entries.map(([id, a]) => [id, (a as Answer.Answered<unknown, never>).value])) as Decision.Values<D>
      )
    })
  )

/**
 * What an offline engine answers for one question:
 * - a number: P(true) for a boolean;
 * - a string: a choice label (label-only evidence) or a score level (all
 *   mass on that level);
 * - `Distribution`: probabilities by outcome label, with the provider's own
 *   `confidence` if any;
 * - `Refused` or `Invalid`: a refusal or a per-question error;
 * - `undefined`: no answer (a per-question error, "no answer in the response").
 *
 * Every answer still goes through `Validate.answer`, as a provider's would.
 *
 * @since 0.2.0
 */
export type Canned =
  | number
  | string
  | {
    readonly _tag: "Distribution"
    readonly probabilities: Readonly<Record<string, number>>
    readonly confidence?: number | undefined
  }
  | { readonly _tag: "Refused"; readonly reason: string | null }
  | { readonly _tag: "Invalid"; readonly problem: string }

/**
 * What an offline engine is asked, once per question.
 *
 * @since 0.2.0
 */
export interface Ask {
  readonly definition: Decision.Any
  readonly questionId: string
  /** The question as posed: kind, instructions and outcomes in order. */
  readonly question: Question.Any
  /** The encoded input (JSON), as a provider would receive it. */
  readonly input: Json
}

/** @since 0.2.0 */
export interface LocalOptions {
  /** Deployment id, or a full snapshot. Default `"local"`. */
  readonly deployment?: string | Deployment.Snapshot | undefined
  /** Snapshot version when `deployment` is an id. Default `"local"`. */
  readonly version?: string | undefined
  /** Provider name on every origin. Default: the deployment id. */
  readonly provider?: string | undefined
  /** Model reported as requested and resolved. Default: the snapshot's default model. */
  readonly model?: string | undefined
  readonly answer: (ask: Ask) => Canned | undefined
  /** Usage the call reports, fixed or from the encoded input. Default unknown. */
  readonly usage?: DecisionResult["usage"] | ((input: Json) => DecisionResult["usage"]) | undefined
  /** Fail every call with this error, after recording the attempt. */
  readonly fail?: AiError.AiError | Budget.BudgetExhausted | undefined
}

const localSnapshot = (id: string, version: string, model: string): Deployment.Snapshot =>
  Deployment.with(Deployment.typesafe, {
    id,
    version,
    provider: id,
    baseUrl: "local://",
    defaultModel: model,
    aliases: {},
    retryableStatuses: [],
    verification: "unknown",
    sources: ["@decisions/api Engine.local"]
  })

const localCandidate = (q: Question.Any, c: number | string | Readonly<Record<string, number>>): Validate.Candidate => {
  if (typeof c === "number") return { probabilities: [["true", c], ["false", 1 - c]] }
  if (typeof c === "string") {
    return q.kind === "score" ? { probabilities: Question.outcomes(q).map((o) => [o, o === c ? 1 : 0] as const) } : { label: c }
  }
  return { probabilities: Object.entries(c) }
}

/**
 * An engine that answers offline from a function, with the real planner and
 * validator, its own deployment name and model, and nothing sent. For
 * simulations, demos and replays that must run without keys; tests can use
 * `FakeEngine` from `@decisions/api/testing`, which is built on it.
 *
 * @example
 * Engine.local({ deployment: "simulated", model: "simulated-0.1", answer: ({ question }) => question.kind === "boolean" ? 0.2 : undefined })
 *
 * @since 0.2.0
 */
export const makeLocal = (options: LocalOptions): Service => {
  const model = options.model ?? (typeof options.deployment === "object" ? options.deployment.defaultModel : "local")
  const base = typeof options.deployment === "object"
    ? options.deployment
    : localSnapshot(options.deployment ?? "local", options.version ?? "local", model)
  const snapshot = base.defaultModel === model ? base : Deployment.with(base, { defaultModel: model })
  const provider = Provider.make(snapshot, { allow: ["stringify-state", "stringify-description", "split-for-isolation"] })
  const providerName = options.provider ?? snapshot.provider
  const resolvedModel = options.model ?? null
  const plan = (prepared: Decision.Prepared) =>
    Effect.fromResult(Planner.plan(prepared, snapshot, { model: provider.model, allow: provider.allow }))
  const execute = <D extends Decision.Any>(prepared: Decision.Prepared<D>, p: Planner.DecisionPlan) =>
    Effect.gen(function*() {
      const ledger = yield* Ledger.Ledger
      const call = p.calls[0]!
      const fail = options.fail
      const usage: DecisionResult["usage"] = typeof options.usage === "function"
        ? options.usage(prepared.input)
        : options.usage ?? { inputTokens: undefined, outputTokens: undefined }
      const entry: Ledger.Entry = {
        callId: call.callId,
        attempt: 1,
        deployment: p.deployment,
        model: p.model,
        fingerprint: p.fingerprint,
        questionIds: p.calls.flatMap((c) => c.questionIds),
        outcome: fail === undefined ? "ok" : "failed",
        status: null,
        requestId: null,
        durationMillis: 0,
        error: fail === undefined ? null : {
          tag: fail._tag === "AiError" ? fail.reason._tag : fail._tag,
          message: fail.message,
          retryable: fail._tag === "AiError" && fail.isRetryable
        },
        usage: fail === undefined && options.usage !== undefined
          ? { ...usage, totalTokens: undefined, fields: {} } satisfies Codec.Usage
          : null
      }
      yield* ledger.record(entry)
      if (fail !== undefined) return yield* Effect.fail(fail)
      const answers: Record<string, Answer.Any> = {}
      for (const [id, q] of prepared.definition.questions) {
        const origin: Answer.Origin = {
          questionId: id,
          callId: call.callId,
          attempt: 1,
          provider: providerName,
          deployment: p.deployment,
          requestedModel: p.model,
          resolvedModel,
          lowerings: []
        }
        const c = options.answer({ definition: prepared.definition, questionId: id, question: q, input: prepared.input })
        const native = { confidence: typeof c === "object" && c._tag === "Distribution" ? c.confidence : undefined, fields: {} }
        if (c === undefined) {
          answers[id] = { status: "error", problem: "no answer in the response", origin, native }
        } else if (typeof c === "object" && c._tag === "Refused") {
          answers[id] = { status: "refused", reason: c.reason, origin, native }
        } else if (typeof c === "object" && c._tag === "Invalid") {
          answers[id] = { status: "error", problem: c.problem, origin, native }
        } else {
          const v = Validate.answer(q, localCandidate(q, typeof c === "object" ? c.probabilities : c), snapshot.tolerance)
          answers[id] = v._tag === "Valid"
            ? { status: "answered", value: v.value, evidence: v.evidence, corrections: v.corrections, origin, native }
            : { status: "error", problem: v.problem, origin, native }
        }
      }
      return {
        _tag: "DecisionResult",
        definition: prepared.definition.name,
        fingerprint: p.fingerprint,
        deployment: p.deployment,
        model: p.model,
        answers: answers as unknown as Decision.Answers<D>,
        usage,
        attempts: [entry]
      } satisfies DecisionResult<D>
    })
  return Engine.of({ provider, plan, execute })
}

/**
 * {@link makeLocal} as a layer.
 *
 * @since 0.2.0
 */
export const local = (options: LocalOptions): Layer.Layer<Engine> => Layer.succeed(Engine, makeLocal(options))
