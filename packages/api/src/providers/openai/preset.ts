import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * OpenAI Decisions. Key from `OPENAI_API_KEY`. Object input needs
 * `allow: ["stringify-state"]`.
 *
 * @since 0.1.0
 */
export const openai = (options: Options = {}): Provider =>
  make(Deployment.openai, { apiKey: Config.Redacted("OPENAI_API_KEY"), ...options })
