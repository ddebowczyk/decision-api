import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * RESPAN span-01. Key from `RESPAN_API_KEY`. Boolean questions only, over a
 * conversation span (`Respan.Span`); `model: "span-01-pro"` needs credits.
 *
 * @since 0.1.0
 */
export const respan = (options: Options = {}): Provider =>
  make(Deployment.respan, { apiKey: Config.Redacted("RESPAN_API_KEY"), ...options })
