/**
 * The RESPAN span-01 wire format (`POST /api/v1/scores`): a conversation span
 * and plain-language behavior definitions. Each behavior is judged on its own
 * branch and answered with `p_present`, `p_absent` and `p_not_observable`.
 *
 * Only boolean questions map: a question becomes one behavior, its id the
 * behavior id. Criteria have no wire field, so they are appended to the
 * definition as `Present when:` / `Absent when:` lines. `p_not_observable` is
 * undetermined mass, not "absent" (RESPAN: treat it as unknown).
 *
 * Sources: https://respan.ai/docs/openapi.json (`Span1ScoreRequest`,
 * `Span1ScoreResponse`), https://www.respan.ai/docs/apis/gateway/run-span-01,
 * https://www.respan.ai/docs/documentation/span-01/concept
 *
 * @since 0.1.0
 */
import { Result, Schema } from "effect"
import * as Codec from "../../wire/Codec.ts"
import { isJsonObject, type Json, type JsonObject } from "../../wire/Json.ts"
import type * as Question from "../../domain/Question.ts"
import * as Wire from "../../wire/Wire.ts"

/**
 * One message of a span. The API marks both fields optional; span-01 scores
 * text, so `content` is required here.
 *
 * @since 0.1.0
 */
export const Message = Schema.Struct({
  role: Schema.optionalKey(Schema.String),
  content: Schema.String
})

/**
 * The input a RESPAN decision needs: the conversation so far, oldest first,
 * and the reply being judged. Use it as a definition's `input`.
 *
 * @example
 * Decision.make("support-review", { revision: "1", input: Respan.Span, questions: [...] })
 *
 * @since 0.1.0
 */
export const Span = Schema.Struct({
  input: Schema.Array(Message),
  output: Message
})

const isSpan = Schema.is(Span)

/** Minimum definition length, from the API schema. */
const MIN_DEFINITION = 3

const text = (d: Question.Description): string => (typeof d === "string" ? d.trim() : Wire.stringify(d))

const definitionOf = (q: Question.BooleanQuestion): string =>
  [
    text(q.instructions),
    ...(q.criteria?.true !== undefined ? [`Present when: ${text(q.criteria.true)}`] : []),
    ...(q.criteria?.false !== undefined ? [`Absent when: ${text(q.criteria.false)}`] : [])
  ].join("\n")

const preflight = (spec: Codec.CallSpec): ReadonlyArray<Codec.Problem> => {
  const problems: Array<Codec.Problem> = []
  if (!isSpan(spec.state)) {
    problems.push({
      problem: "RESPAN needs a conversation span as input: { input: [{ role, content }], output: { role, content } }",
      hint: "Use Respan.Span as the definition's input schema, or map your input to that shape"
    })
  }
  for (const { id, question } of spec.questions) {
    if (question.kind === "boolean" && definitionOf(question as Question.BooleanQuestion).length < MIN_DEFINITION) {
      problems.push({ problem: `behavior "${id}" needs a definition of at least ${MIN_DEFINITION} characters`, hint: "Describe the behavior to look for in a sentence" })
    }
  }
  return problems
}

const Envelope = Schema.Struct({
  model: Schema.optionalKey(Schema.String),
  results: Schema.Array(Schema.Unknown),
  usage: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown))
})
const decodeEnvelope = Schema.decodeUnknownResult(Envelope)

const native = (fields: JsonObject): Codec.DecodedAnswer["native"] => ({ confidence: undefined, fields })

const decodeResult = (raw: JsonObject): Codec.DecodedAnswer => {
  const [present, absent, unobservable] = [raw["p_present"], raw["p_absent"], raw["p_not_observable"]]
  if (typeof present !== "number" || typeof absent !== "number" || typeof unobservable !== "number") {
    return { _tag: "Malformed", problem: "p_present, p_absent and p_not_observable must be numbers", native: native(raw) }
  }
  return {
    _tag: "Candidate",
    candidate: { probabilities: [["true", present], ["false", absent]], undetermined: unobservable },
    native: native(raw)
  }
}

/**
 * The RESPAN span-01 codec, version 1.
 *
 * @since 0.1.0
 */
export const codec: Codec.Codec = {
  id: "respan",
  version: "1",
  preflight,
  encode: (spec) =>
    Wire.obj([
      ["model", spec.model],
      ["span", spec.state],
      [
        "behaviors",
        spec.questions.map(({ id, question }) => {
          if (question.kind !== "boolean") throw new TypeError(`Respan: no encoder for ${question.kind}; the planner should have rejected it`)
          return Wire.obj([["id", id], ["definition", definitionOf(question as Question.BooleanQuestion)]])
        })
      ]
    ]),
  decode: (spec, body) => {
    const r = decodeEnvelope(body)
    if (Result.isFailure(r)) return Result.fail(new Codec.CodecError({ codec: "respan", message: r.failure.message }))
    const byId = new Map<string, Array<JsonObject>>()
    for (const x of r.success.results) {
      if (isJsonObject(x) && typeof x["id"] === "string") byId.set(x["id"], [...(byId.get(x["id"]) ?? []), x])
    }
    const answers = new Map<string, Codec.DecodedAnswer>()
    for (const { id } of spec.questions) {
      const found = byId.get(id)
      if (found === undefined) continue
      answers.set(id, found.length > 1
        ? { _tag: "Malformed", problem: `${found.length} results for behavior "${id}"`, native: native({ results: found as Array<Json> }) }
        : decodeResult(found[0]!))
    }
    const u = r.success.usage
    const input = u === undefined ? undefined : Codec.finiteOrUndefined(u["input_tokens"])
    return Result.succeed({
      reportedModel: r.success.model ?? null,
      answers,
      usage: u === undefined
        ? Codec.unknownUsage
        // Output is not generated and not reported.
        : { inputTokens: input, outputTokens: undefined, totalTokens: undefined, fields: u as JsonObject }
    })
  }
}
