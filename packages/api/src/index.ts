/**
 * @decisions/api — typed, provider-portable decisions on Effect v4.
 *
 * @since 0.1.0
 */
export const version = "0.2.0" as const

export * as Answer from "./domain/Answer.ts"
export * as Decision from "./domain/Decision.ts"
export * as Evidence from "./domain/Evidence.ts"
export * as Q from "./domain/Question.ts"
export type { Json, JsonArray, JsonObject } from "./wire/Json.ts"
export * as Identity from "./domain/Identity.ts"
export * as Wire from "./wire/Wire.ts"
export * as Validate from "./domain/Validate.ts"
export * as Deployment from "./providers/deployments.ts"
export * as Capabilities from "./providers/Capabilities.ts"
export * as Codec from "./wire/Codec.ts"
export * as SystemOne from "./wire/SystemOne.ts"
export * as OpenAiDecisions from "./providers/openai/codec.ts"
export * as Respan from "./providers/respan/codec.ts"
export * as ClassifierDev from "./providers/classifier-dev/codec.ts"
export * as Planner from "./planning/Planner.ts"
export * as Transport from "./runtime/Transport.ts"
export * as Engine from "./runtime/Engine.ts"
export * as Ledger from "./runtime/Ledger.ts"
export * as Metrics from "./runtime/Metrics.ts"
export * as Budget from "./runtime/Budget.ts"
export * as Fallback from "./runtime/Fallback.ts"
export * as Bridge from "./integrations/Bridge.ts"
export * as Errors from "./runtime/Errors.ts"
