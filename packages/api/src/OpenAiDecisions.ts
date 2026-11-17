/**
 * The OpenAI Decisions wire format: string `input`, an ordered `questions`
 * array, answers in question order. Any answer may be a refusal, named or
 * `null` when the question was unnamed.
 *
 * Every question is sent with its id as `name`. Answers are matched by
 * position when the counts agree (a named answer must carry the expected
 * name), otherwise by name.
 *
 * @since 0.1.0
 */
import { Result, Schema } from "effect"
import * as Codec from "./Codec.ts"
import { isJsonObject, type JsonObject } from "./Json.ts"
import type * as Question from "./Question.ts"
import * as Wire from "./Wire.ts"

const described = (head: ReadonlyArray<readonly [string, Wire.Value]>, description: Question.Description | null) =>
  Wire.obj(description === null ? head : [...head, ["description", description]])

const encodeQuestion = (id: string, q: Question.Any): Wire.Value => {
  switch (q.kind) {
    case "boolean":
      if ((q as Question.BooleanQuestion).criteria !== undefined) {
        throw new TypeError(`OpenAiDecisions: predicate "${id}" cannot carry criteria; the planner should have rejected it`)
      }
      return Wire.obj([["type", "predicate"], ["name", id], ["instructions", q.instructions]])
    case "choice":
      return Wire.obj([
        ["type", "choice"],
        ["name", id],
        ["instructions", q.instructions],
        ["choices", (q as Question.ChoiceQuestion<string>).options.map((o) => described([["value", o.label]], o.description))]
      ])
    case "score":
      return Wire.obj([
        ["type", "score"],
        ["name", id],
        ["instructions", q.instructions],
        ["levels", (q as Question.ScoreQuestion<string>).levels.map((l) => described([["label", l.label]], l.description))]
      ])
    default:
      throw new TypeError(`OpenAiDecisions: no encoder for ${q.kind}; the planner should have rejected it`)
  }
}

const Envelope = Schema.Struct({
  model: Schema.optionalKey(Schema.String),
  answers: Schema.Array(Schema.Unknown),
  usage: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))
})
const decodeEnvelope = Schema.decodeUnknownResult(Envelope)

const nativeOf = (a: JsonObject) => ({ confidence: Codec.finiteOrUndefined(a["confidence"]), fields: a })

/** `[{ <key>, probability }]` → entries, keyed by `key`. */
const entries = (u: unknown, key: string): ReadonlyArray<readonly [string, number]> | undefined =>
  Array.isArray(u)
    ? u.map((x) =>
      isJsonObject(x)
        ? [String(x[key]), typeof x["probability"] === "number" ? x["probability"] : Number.NaN] as const
        : ["<malformed>", Number.NaN] as const
    )
    : undefined

const decodeAnswer = (q: Question.Any, a: JsonObject): Codec.DecodedAnswer => {
  const native = nativeOf(a)
  if (a["type"] === "refusal") return { _tag: "Refused", reason: null, native }
  const expected = q.kind === "boolean" ? "predicate" : q.kind
  if (a["type"] !== expected) return { _tag: "Malformed", problem: `expected a ${expected} answer, got ${String(a["type"])}`, native }
  switch (q.kind) {
    case "boolean": {
      const p = a["probability"]
      if (typeof p !== "number") return { _tag: "Malformed", problem: "probability is not a number", native }
      return { _tag: "Candidate", candidate: { probabilities: [["true", p], ["false", 1 - p]] }, native }
    }
    case "choice": {
      const label = a["choice"]
      if (label !== undefined && typeof label !== "string") return { _tag: "Malformed", problem: "choice is not a string", native }
      return { _tag: "Candidate", candidate: { label, probabilities: entries(a["probabilities"], "value") }, native }
    }
    default: {
      const levels = (q as Question.ScoreQuestion<string>).levels
      const probabilities = entries(a["probabilities"], "value")?.map(([i, p]) => [levels[Number(i)]?.label ?? `#${i}`, p] as const)
      return { _tag: "Candidate", candidate: { probabilities, nativeScore: Codec.finiteOrUndefined(a["score"]) }, native }
    }
  }
}

const usageOf = (u: { readonly [k: string]: unknown } | undefined): Codec.Usage =>
  u === undefined ? Codec.unknownUsage : {
    inputTokens: Codec.finiteOrUndefined(u["input_tokens"]),
    outputTokens: Codec.finiteOrUndefined(u["output_tokens"]),
    totalTokens: Codec.finiteOrUndefined(u["total_tokens"]),
    fields: u as JsonObject
  }

/**
 * The OpenAI Decisions codec, version 1.
 *
 * @since 0.1.0
 */
export const codec: Codec.Codec = {
  id: "openai-decisions",
  version: "1",
  encode: (spec) => {
    if (typeof spec.state !== "string") {
      throw new TypeError("OpenAiDecisions: input must be a string; allow the stringify-state lowering for object state")
    }
    return Wire.obj([
      ["model", spec.model],
      ["input", spec.state],
      ["questions", spec.questions.map(({ id, question }) => encodeQuestion(id, question))]
    ])
  },
  decode: (spec, body) => {
    const r = decodeEnvelope(body)
    if (Result.isFailure(r)) return Result.fail(new Codec.CodecError({ codec: "openai-decisions", message: r.failure.message }))
    const env = r.success
    const raw = env.answers.map((a) => (isJsonObject(a) ? a : {}))
    const answers = new Map<string, Codec.DecodedAnswer>()
    if (raw.length === spec.questions.length) {
      spec.questions.forEach(({ id, question }, i) => {
        const a = raw[i]!
        const name = a["name"]
        answers.set(
          id,
          name === null || name === undefined || name === id
            ? decodeAnswer(question, a)
            : { _tag: "Malformed", problem: `answer ${i} is named "${String(name)}", expected "${id}"`, native: nativeOf(a) }
        )
      })
    } else {
      for (const { id, question } of spec.questions) {
        const a = raw.find((x) => x["name"] === id)
        if (a !== undefined) answers.set(id, decodeAnswer(question, a))
      }
    }
    return Result.succeed({ reportedModel: env.model ?? null, answers, usage: usageOf(env.usage) })
  }
}
