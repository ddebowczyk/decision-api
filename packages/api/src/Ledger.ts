/**
 * Every call attempt, successful or not. The default ledger discards entries;
 * `Ledger.capture` collects them for one effect.
 *
 * @since 0.1.0
 */
import { Context, Effect, Ref } from "effect"
import type * as Codec from "./Codec.ts"

/** @since 0.1.0 */
export interface Entry {
  readonly callId: string
  readonly attempt: number
  readonly deployment: string
  readonly model: string
  readonly fingerprint: string
  readonly questionIds: ReadonlyArray<string>
  readonly outcome: "ok" | "failed"
  /** HTTP status, `null` when no response arrived. */
  readonly status: number | null
  readonly requestId: string | null
  readonly durationMillis: number
  readonly error: { readonly tag: string; readonly message: string; readonly retryable: boolean } | null
  readonly usage: Codec.Usage | null
}

/** @since 0.1.0 */
export interface Service {
  readonly record: (entry: Entry) => Effect.Effect<void>
}

/**
 * The current ledger; discards entries by default.
 *
 * @since 0.1.0
 */
export const Ledger = Context.Reference<Service>("@decisions/api/Ledger", { defaultValue: () => ({ record: () => Effect.void }) })

/**
 * Run an effect with a fresh in-memory ledger and return its entries too.
 * Entries are also forwarded to the outer ledger.
 *
 * @since 0.1.0
 */
export const capture = <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<[A, ReadonlyArray<Entry>], E, R> =>
  Effect.gen(function*() {
    const outer = yield* Ledger
    const log = yield* Ref.make<ReadonlyArray<Entry>>([])
    const inner: Service = { record: (e) => Ref.update(log, (xs) => [...xs, e]).pipe(Effect.andThen(outer.record(e))) }
    const a = yield* Effect.provideService(self, Ledger, inner)
    return [a, yield* Ref.get(log)] as [A, ReadonlyArray<Entry>]
  })

/**
 * Like `capture`, but entries are returned on failure too.
 *
 * @since 0.1.0
 */
export const captureExit = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.gen(function*() {
    const outer = yield* Ledger
    const log = yield* Ref.make<ReadonlyArray<Entry>>([])
    const inner: Service = { record: (e) => Ref.update(log, (xs) => [...xs, e]).pipe(Effect.andThen(outer.record(e))) }
    const exit = yield* Effect.exit(Effect.provideService(self, Ledger, inner))
    return { exit, entries: yield* Ref.get(log) }
  })
