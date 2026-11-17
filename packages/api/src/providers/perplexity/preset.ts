import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * Perplexity Decider. Key from `PERPLEXITY_API_KEY`. Questions are joint, so
 * independent definitions need `allow: ["split-for-isolation"]`.
 *
 * @since 0.1.0
 */
export const perplexity = (options: Options = {}): Provider =>
  make(Deployment.perplexity, { apiKey: Config.Redacted("PERPLEXITY_API_KEY"), ...options })
