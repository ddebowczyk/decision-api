import { Config } from "effect"
import * as Deployment from "./deployment.ts"
import { make, param, type Options, type Provider } from "../core.ts"

/**
 * Cloudflare Clef on Workers AI. `model` picks the snapshot (`clef` or
 * `clef-flash`). Token from `CLOUDFLARE_API_TOKEN`, account id from
 * `CLOUDFLARE_ACCOUNT_ID`. Questions are joint, so independent definitions
 * need `allow: ["split-for-isolation"]`.
 *
 * @example
 * Provider.clef({ model: "clef-flash", allow: ["split-for-isolation"] })
 *
 * @since 0.1.0
 */
export const clef = (options: Options & { readonly model?: "clef" | "clef-flash" | undefined } = {}): Provider =>
  make(options.model === "clef-flash" ? Deployment.clefFlash : Deployment.clef, {
    apiKey: Config.Redacted("CLOUDFLARE_API_TOKEN"),
    ...options,
    urlParams: { account_id: param("CLOUDFLARE_ACCOUNT_ID"), ...options.urlParams }
  })
