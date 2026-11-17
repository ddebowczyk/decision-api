import * as Deployment from "./deployment.ts"
import { make, withBaseUrl, type Options, type Provider } from "../core.ts"

/**
 * Basal on a local server; no key unless given.
 *
 * @since 0.1.0
 */
export const basal = (options: Options & { readonly baseUrl?: string } = {}): Provider =>
  make(withBaseUrl(Deployment.basal, options.baseUrl), options)
