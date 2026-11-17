/**
 * Order-preserving JSON for wire bodies and identities.
 *
 * JavaScript objects list integer-like keys first, so `{ billing, "10", "2" }`
 * serializes as `{"2","10","billing"}`. Providers that read option order from
 * an object's keys need the written order, so wire bodies use `Wire.obj`.
 *
 * @since 0.1.0
 */
import type { Json } from "./Json.ts"

const OrderedTypeId: unique symbol = Symbol.for("@decisions/api/Wire/Ordered")

/**
 * An object whose keys serialize in entry order.
 *
 * @since 0.1.0
 */
export interface Ordered {
  readonly [OrderedTypeId]: typeof OrderedTypeId
  readonly entries: ReadonlyArray<readonly [string, Value]>
}

/** @since 0.1.0 */
export type Value = Json | Ordered | ReadonlyArray<Value> | { readonly [key: string]: Value }

/**
 * Build an object that keeps its entry order when written.
 *
 * @since 0.1.0
 */
export const obj = (entries: ReadonlyArray<readonly [string, Value]>): Ordered => ({ [OrderedTypeId]: OrderedTypeId, entries })

/** @since 0.1.0 */
export const isOrdered = (u: unknown): u is Ordered => typeof u === "object" && u !== null && OrderedTypeId in u

const write = (v: Value, sortPlain: boolean): string => {
  if (v === null) return "null"
  switch (typeof v) {
    case "string":
      return JSON.stringify(v)
    case "boolean":
      return v ? "true" : "false"
    case "number":
      if (!Number.isFinite(v)) throw new TypeError(`Wire: non-finite number ${v} cannot be written as JSON`)
      return JSON.stringify(v)
  }
  if (Array.isArray(v)) return `[${v.map((x: Value) => write(x, sortPlain)).join(",")}]`
  const entries = isOrdered(v)
    ? v.entries
    : sortPlain
    ? Object.entries(v as Record<string, Value>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    : Object.entries(v as Record<string, Value>)
  return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${write(x, sortPlain)}`).join(",")}}`
}

/**
 * Write a wire body. Ordered objects keep entry order; plain objects keep
 * JavaScript's own key order, as `JSON.stringify` would.
 *
 * @throws TypeError on non-finite numbers.
 * @since 0.1.0
 */
export const stringify = (v: Value): string => write(v, false)

/**
 * Canonical form for hashing: plain-object keys sorted by UTF-16 code units
 * (as RFC 8785), ordered objects and arrays kept in order, numbers in
 * ECMAScript shortest form.
 *
 * @throws TypeError on non-finite numbers.
 * @since 0.1.0
 */
export const canonical = (v: Value): string => write(v, true)

/**
 * Convert to plain JSON for inspection. Ordered objects become plain objects,
 * so integer-like keys may move; use `stringify` for anything sent on the wire.
 *
 * @since 0.1.0
 */
export const toJson = (v: Value): Json => {
  if (v === null || typeof v !== "object") return v
  if (Array.isArray(v)) return v.map(toJson)
  const entries = isOrdered(v) ? v.entries : Object.entries(v as Record<string, Value>)
  return Object.fromEntries(entries.map(([k, x]) => [k, toJson(x)]))
}
