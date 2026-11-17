import type { Snapshot, Limit } from "../providers/deployment.ts"
import type { CallSpec, Codec } from "../wire/Codec.ts"
import { stringify } from "../wire/Wire.ts"

const utf8 = new TextEncoder()
export const bytes = (text: string): number => utf8.encode(text).length

export const stateProblem = (state: CallSpec["state"], limit: Limit): string | undefined => {
  if (limit === "unknown") return undefined
  const chars = Array.from(typeof state === "string" ? state : stringify(state)).length
  return chars > limit.value ? `state has ${chars} characters, exceeding the ${limit.value}-character limit` : undefined
}

export interface Check {
  readonly requestEstimate?: number
  readonly questionEstimate?: number
  readonly imageTokensUnknown?: boolean
  readonly problem?: string
  readonly splittable?: boolean
}

/**
 * One estimated token per three UTF-8 bytes of the encoded text-only request.
 * This is a sizing heuristic. Provider tokenizers and server-side framing are unknown.
 */
export const check = (snapshot: Snapshot, codec: Codec, spec: CallSpec): Check => {
  const { requestTokens, questionTokens = "unknown" } = snapshot.limits
  if (requestTokens === "unknown" && questionTokens === "unknown") return {}
  const { images, ...text } = spec
  const media = images?.length ? codec.images?.estimateTokens?.(images) : 0
  const estimate = (call: CallSpec) => Math.ceil(bytes(stringify(codec.encode(call))) / 3) + (media ?? 0)
  const requestEstimate = estimate(text)
  const questionEstimate = questionTokens === "unknown" ? undefined :
    text.questions.reduce((max, question) => Math.max(max, estimate({ ...text, questions: [question] })), 0)
  const info = {
    requestEstimate,
    ...(questionEstimate === undefined ? {} : { questionEstimate }),
    ...(media === undefined ? { imageTokensUnknown: true } : {})
  }
  if (questionTokens !== "unknown" && questionEstimate! > questionTokens.value) {
    return { ...info, problem: `per-question context estimate ${questionEstimate} exceeds ${questionTokens.value} tokens` }
  }
  if (requestTokens !== "unknown" && requestEstimate > requestTokens.value) {
    return { ...info, problem: `request context estimate ${requestEstimate} exceeds ${requestTokens.value} tokens`, splittable: true }
  }
  return info
}
