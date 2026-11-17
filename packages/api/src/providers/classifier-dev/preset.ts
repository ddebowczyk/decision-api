import * as Deployment from "./deployment.ts"
import { make, type Options, type Provider } from "../core.ts"

/**
 * Classifier.dev. Keyless by default (free per-IP limits); pass `apiKey`
 * (e.g. `Config.Redacted("CLASSIFIER_API_KEY")`) for workspace limits.
 * Object input needs `allow: ["stringify-state"]`.
 *
 * @since 0.1.0
 */
export const classifierDev = (options: Options = {}): Provider => make(Deployment.classifierDev, options)
