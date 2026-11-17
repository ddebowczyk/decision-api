import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import type { Reasoning } from "../deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * Levanto Sage SystemOne. Key from `LEVANTO_API_KEY` (or `SAGE_API_KEY`) unless given.
 * Defaults to `levanto-sage-2`; `sage-latest` is also accepted.
 *
 * @since 0.1.0
 */
export const levanto = (options: Options & {
  readonly mode?: "system-one" | "native"
  readonly reasoning?: Reasoning
} = {}): Provider => {
  const deployment = options.mode === "native" ? Deployment.levantoNative : Deployment.levanto
  return make(options.reasoning === undefined ? deployment : {
    ...deployment, request: { reasoning: options.reasoning }
  }, {
    apiKey: Config.Redacted("LEVANTO_API_KEY").pipe(Config.orElse(() => Config.Redacted("SAGE_API_KEY"))),
    ...options
  })
}
