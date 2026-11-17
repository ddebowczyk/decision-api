import * as Deployment from "./deployment.ts"
import { make, withBaseUrl, type Options, type Provider } from "../core.ts"

/**
 * Laya typed decisions on a self-hosted server (`laya-serve` or
 * typed-decision-lab); no key unless given.
 *
 * @since 0.1.0
 */
export const laya = (options: Options & { readonly baseUrl?: string } = {}): Provider =>
  make(withBaseUrl(Deployment.laya, options.baseUrl), options)
