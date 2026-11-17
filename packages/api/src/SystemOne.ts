/**
 * The System One wire format (TypeSafe, Basal, Perplexity): shared `state`,
 * questions keyed by name, answers keyed by the same names.
 *
 * Choice criteria are written in option order, even for integer-like labels.
 * Score criteria are the level descriptions, lowest first; answers key their
 * probabilities by level index.
 *
 * @since 0.1.0
 */
import { Result, Schema } from "effect"
import * as Codec from "./Codec.ts"
import { isJsonObject, type JsonObject } from "./Json.ts"
import type * as Question from "./Question.ts"
import * as Wire from "./Wire.ts"

const encodeQuestion = (q: Question.Any): Wire.Value => {
  switch (q.kind) {
    case "boolean": {
      const c = (q as Question.BooleanQuestion).criteria
      const criteria = c === undefined
        ? []
        : [
          ...(c.true !== undefined ? [["true", c.true] as const] : []),
          ...(c.false !== undefined ? [["false", c.false] as const] : [])
        ]
      return Wire.obj([
        ["type", "noul"],
        ["instructions", q.instructions],
        ...(criteria.length > 0 ? [["criteria", Wire.obj(criteria)] as const] : [])
      ])
    }
    case "choice":
      return Wire.obj([
        ["type", "choice"],
        ["instructions", q.instructions],
        ["criteria", Wire.obj((q as Question.ChoiceQuestion<string>).options.map((o) => [o.label, o.description]))]
      ])
    case "score":
      return Wire.obj([
        ["type", "score"],
        ["instructions", q.instructions],
        ["criteria", (q as Question.ScoreQuestion<string>).levels.map((l) => l.description ?? l.label)]
      ])
    default:
      throw new TypeError(`SystemOne: no encoder for ${q.kind}; the planner should have rejected it`)
  }
}

const Envelope = Schema.Struct({
  model: Schema.optionalKey(Schema.String),
  answers: Schema.Record(Schema.String, Schema.Unknown),
  usage: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))
})
const decodeEnvelope = Schema.decodeUnknownResult(Envelope)

const nativeOf = (a: JsonObject): { readonly confidence: number | undefined; readonly fields: JsonObject } => ({
  confidence: Codec.finiteOrUndefined(a["confidence"]),
  fields: a
})

const numericEntries = (u: unknown): ReadonlyArray<readonly [string, number]> | undefined =>
  isJsonObject(u) ? Object.entries(u).map(([k, v]) => [k, typeof v === "number" ? v : Number.NaN] as const) : undefined

const decodeAnswer = (q: Question.Any, raw: unknown): Codec.DecodedAnswer => {
  if (!isJsonObject(raw)) return { _tag: "Malformed", problem: "answer is not an object", native: { confidence: undefined, fields: {} } }
  const native = nativeOf(raw)
  const expected = q.kind === "boolean" ? "noul" : q.kind
  if (raw["type"] !== undefined && raw["type"] !== expected) {
    return { _tag: "Malformed", problem: `expected a ${expected} answer, got ${String(raw["type"])}`, native }
  }
  switch (q.kind) {
    case "boolean": {
      const p = raw["noul"]
      if (typeof p !== "number") return { _tag: "Malformed", problem: "noul is not a number", native }
      return { _tag: "Candidate", candidate: { probabilities: [["true", p], ["false", 1 - p]] }, native }
    }
    case "choice": {
      const label = raw["choice"]
      if (label !== undefined && typeof label !== "string") return { _tag: "Malformed", problem: "choice is not a string", native }
      return { _tag: "Candidate", candidate: { label, probabilities: numericEntries(raw["probabilities"]) }, native }
    }
    default: {
      const levels = (q as Question.ScoreQuestion<string>).levels
      const byIndex = numericEntries(raw["probabilities"])
      const probabilities = byIndex?.map(([i, p]) => [levels[Number(i)]?.label ?? `#${i}`, p] as const)
      // Fastino's `score` is the integer argmax; its weighted value is `expected_level`.
      const nativeScore = Codec.finiteOrUndefined(raw["expected_level"]) ?? Codec.finiteOrUndefined(raw["score"])
      return { _tag: "Candidate", candidate: { probabilities, nativeScore }, native }
    }
  }
}

const usageOf = (u: { readonly [k: string]: unknown } | undefined): Codec.Usage => {
  if (u === undefined) return Codec.unknownUsage
  const input = Codec.finiteOrUndefined(u["input_tokens"])
  const output = Codec.finiteOrUndefined(u["output_tokens"])
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: Codec.finiteOrUndefined(u["total_tokens"]) ?? (input !== undefined && output !== undefined ? input + output : undefined),
    fields: u as JsonObject
  }
}

/**
 * The System One codec, version 1.
 *
 * @since 0.1.0
 */
export const codec: Codec.Codec = {
  id: "system-one",
  version: "1",
  encode: (spec) =>
    Wire.obj([
      ["model", spec.model],
      ["state", spec.state],
      ["questions", Wire.obj(spec.questions.map(({ id, question }) => [id, encodeQuestion(question)]))]
    ]),
  decode: (spec, body) => {
    const r = decodeEnvelope(body)
    if (Result.isFailure(r)) return Result.fail(new Codec.CodecError({ codec: "system-one", message: r.failure.message }))
    const env = r.success
    const answers = new Map<string, Codec.DecodedAnswer>()
    for (const { id, question } of spec.questions) {
      if (id in env.answers) answers.set(id, decodeAnswer(question, env.answers[id]))
    }
    return Result.succeed({
      reportedModel: env.model ?? null,
      answers,
      usage: usageOf(env.usage)
    })
  }
}
