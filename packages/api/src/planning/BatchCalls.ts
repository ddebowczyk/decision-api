import { Result } from "effect"
import type * as Decision from "../domain/Decision.ts"
import type * as Deployment from "../providers/deployment.ts"
import type * as Codec from "../wire/Codec.ts"
import * as Wire from "../wire/Wire.ts"
import * as ContextLimits from "./ContextLimits.ts"

interface Options {
  readonly deployment: Deployment.Snapshot
  readonly codec: Codec.Codec
  readonly base: Omit<Codec.CallSpec, "questions">
  readonly headers: Readonly<Record<string, string>>
  readonly questions: (entries: ReadonlyArray<Decision.Entry>) => Codec.CallSpec["questions"]
  readonly groups: ReadonlyArray<ReadonlyArray<Decision.Entry>>
  readonly splittable: boolean
}

interface EncodedCall {
  readonly questionIds: ReadonlyArray<string>
  readonly spec: Codec.CallSpec
  readonly body: string
  readonly bytes: number
  readonly context: ContextLimits.Check
  readonly headers?: Options["headers"]
}

interface TooLarge {
  readonly message: string
  readonly hint: string
}

const encode = (options: Options, entries: ReadonlyArray<Decision.Entry>): EncodedCall => {
  const { codec, deployment, base, headers } = options
  const spec = { ...base, questions: options.questions(entries) }
  const body = Wire.stringify(codec.encode(spec))
  return {
    questionIds: entries.map(([id]) => id),
    spec,
    body,
    bytes: ContextLimits.bytes(body),
    context: ContextLimits.check(deployment, codec, spec),
    ...(Object.keys(headers).length === 0 ? {} : { headers })
  }
}

export const batchCalls = (options: Options): Result.Result<ReadonlyArray<EncodedCall>, TooLarge> => {
  const { questionsPerCall, bodyBytes } = options.deployment.limits
  const calls: Array<EncodedCall> = []

  const place = (entries: ReadonlyArray<Decision.Entry>): TooLarge | undefined => {
    if (questionsPerCall !== "unknown" && entries.length > questionsPerCall.value) {
      const limit = questionsPerCall.value
      if (!options.splittable) {
        return { message: `${entries.length} questions in one atomic group; at most ${limit}`, hint: "Split the definition" }
      }
      for (let start = 0; start < entries.length; start += limit) {
        const error = place(entries.slice(start, start + limit))
        if (error !== undefined) return error
      }
      return
    }
    const call = encode(options, entries)
    const bodyProblem = bodyBytes !== "unknown" && call.bytes > bodyBytes.value
      ? `a call of ${call.bytes} bytes exceeds ${bodyBytes.value} (${bodyBytes.evidence})`
      : undefined
    const problem = call.context.problem ?? bodyProblem
    if (problem === undefined) {
      calls.push(call)
      return
    }
    if (!options.splittable || entries.length === 1 ||
      (call.context.problem !== undefined && call.context.splittable !== true)) {
      return { message: problem, hint: "Shorten the input or the question texts" }
    }
    const mid = Math.ceil(entries.length / 2)
    return place(entries.slice(0, mid)) ?? place(entries.slice(mid))
  }

  for (const group of options.groups) {
    const error = place(group)
    if (error !== undefined) return Result.fail(error)
  }
  return Result.succeed(calls)
}
