/**
 * Explicit limits on attempts and time for everything inside a scope: all
 * calls, retries and fallback steps share them. Without `Budget.limit` the
 * only bounds are each provider's retry count and timeout.
 *
 * @since 0.1.0
 */
import { Clock, Context, Data, Duration, Effect, Ref } from "effect"

/**
 * The scope's budget ran out. Terminal: never retried, never a reason to fall
 * back. `lastError` is the failure that would have been retried.
 *
 * @since 0.1.0
 */
export class BudgetExhausted extends Data.TaggedError("BudgetExhausted")<{
  readonly kind: "attempts" | "deadline"
  readonly message: string
  readonly hint: string
  readonly lastError: unknown
}> {}

/** @since 0.1.0 */
export interface Service {
  /** Take one attempt from the budget, or fail. */
  readonly reserveAttempt: Effect.Effect<void, BudgetExhausted>
  /** Milliseconds left before the deadline; `undefined` without one. */
  readonly remainingMillis: Effect.Effect<number | undefined>
}

/** The current budget; unlimited by default. @since 0.1.0 */
export const Budget = Context.Reference<Service>("@decisions/api/Budget", {
  defaultValue: () => ({ reserveAttempt: Effect.void, remainingMillis: Effect.succeed(undefined) })
})

/**
 * Bound everything in `self` to `attempts` call attempts in total and/or a
 * deadline `within` from now. Nested limits apply together.
 *
 * @example
 * Engine.decide(Triage, input).pipe(Budget.limit({ attempts: 4, within: "20 seconds" }))
 *
 * @since 0.1.0
 */
export const limit = (options: { readonly attempts?: number | undefined; readonly within?: Duration.Input | undefined }) =>
<A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E | BudgetExhausted, R> =>
  Effect.gen(function*() {
    const outer = yield* Budget
    const used = yield* Ref.make(0)
    const within = options.within === undefined ? undefined : Duration.fromInputUnsafe(options.within)
    const deadline = within === undefined ? undefined : (yield* Clock.currentTimeMillis) + Duration.toMillis(within)
    const inner: Service = {
      reserveAttempt: Effect.gen(function*() {
        const n = yield* Ref.updateAndGet(used, (x) => x + 1)
        if (options.attempts !== undefined && n > options.attempts) {
          return yield* new BudgetExhausted({
            kind: "attempts",
            message: `attempt budget of ${options.attempts} used up`,
            hint: "Raise Budget.limit({ attempts }) or lower provider retry.times",
            lastError: undefined
          })
        }
        yield* outer.reserveAttempt
      }),
      remainingMillis: Effect.gen(function*() {
        const mine = deadline === undefined ? undefined : deadline - (yield* Clock.currentTimeMillis)
        const theirs = yield* outer.remainingMillis
        return mine === undefined ? theirs : theirs === undefined ? mine : Math.min(mine, theirs)
      })
    }
    const run = Effect.provideService(self, Budget, inner)
    return yield* within === undefined ? run : run.pipe(
      Effect.timeoutOrElse({
        duration: within,
        orElse: () =>
          Effect.fail(
            new BudgetExhausted({
              kind: "deadline",
              message: `deadline of ${Duration.format(within)} reached`,
              hint: "Raise Budget.limit({ within }) or lower provider timeout",
              lastError: undefined
            })
          )
      })
    )
  })
