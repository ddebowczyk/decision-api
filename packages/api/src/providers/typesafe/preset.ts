import { Config } from "effect"
import { typesafe as deployment } from "./deployment.ts"
import { exact } from "../deployment-defaults.ts"
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
  make(options.longContext === true ? {
    ...deployment,
    request: { longContext: true },
    limits: { ...deployment.limits, requestTokens: exact(262_144), questionTokens: exact(262_144) }
  } : deployment, { apiKey: Config.Redacted("TYPESAFE_API_KEY"), ...options })
