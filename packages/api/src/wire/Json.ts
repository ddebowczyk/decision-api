/**
 * JSON value types shared by definitions, wire bodies and identities.
 *
 * @since 0.1.0
 */

/** @since 0.1.0 */
export type Json = string | number | boolean | null | JsonArray | JsonObject

/** @since 0.1.0 */
export interface JsonArray extends ReadonlyArray<Json> {}

/** @since 0.1.0 */
export interface JsonObject {
  readonly [key: string]: Json
}

/** @since 0.1.0 */
export const isJsonObject = (u: unknown): u is JsonObject =>
  typeof u === "object" && u !== null && !Array.isArray(u)
