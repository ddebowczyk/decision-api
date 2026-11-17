import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * TypeSafe Jev. Key from `TYPESAFE_API_KEY` unless given. `longContext`
 * sends the documented opt-in header.
 *
 * @example
 * Provider.typesafe({ model: "jev-latest" })
 *
 * @since 0.1.0
 */
export const typesafe = (options: Options & { readonly longContext?: boolean } = {}): Provider =>
  make(Deployment.typesafe, {
    apiKey: Config.Redacted("TYPESAFE_API_KEY"),
    ...options,
    headers: { ...(options.longContext === true ? { "TypeSafe-Danger-Zone-Long-Context": "true" } : {}), ...options.headers }
  })
