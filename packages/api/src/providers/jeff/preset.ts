import * as Deployment from "./deployment.ts"
import { make, withBaseUrl, type Options, type Provider } from "../core.ts"

/**
 * Jeff on a self-hosted server; no key unless given. `isolate` says how the
 * server runs: `"nouls"` (upstream default, choice and score joint) or
 * `"all"` (independent).
 *
 * @example
 * Provider.jeff({ baseUrl: "http://127.0.0.1:8091", isolate: "all" })
 *
 * @since 0.1.0
 */
export const jeff = (options: Options & { readonly baseUrl?: string; readonly isolate?: "nouls" | "all" } = {}): Provider =>
  make(withBaseUrl(options.isolate === "all" ? Deployment.jeffIsolated : Deployment.jeff, options.baseUrl), options)
