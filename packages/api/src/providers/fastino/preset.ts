import { Config, Duration } from "effect"
import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * Fastino GLiDE. Key from `FASTINO_API_KEY`, sent as `X-API-Key`. Waits up
 * to 300 s by default, as Fastino recommends; structured descriptions need
 * `allow: ["stringify-description"]`.
 *
 * @since 0.1.0
 */
export const fastino = (options: Options = {}): Provider =>
  make(Deployment.fastino, { apiKey: Config.Redacted("FASTINO_API_KEY"), timeout: Duration.seconds(300), ...options })
