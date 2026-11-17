/**
 * The Classifier.dev wire format (`POST /v1/classify`, dimensions mode, tier
 * `fast`): one text item and up to 20 dimensions, each a single-label choice
 * answered independently with a score per label.
 *
 * Dimension names are positional (`q0`, `q1`, … in call order), so question
 * ids need not fit the 64-character name rule; the id is named in the
 * dimension's instructions. Booleans are the labels `yes` / `no`, scores
 * `level <i>: <level>`, options `<id>` or `<id>: <description>`. These label
 * conventions follow the polyglot driver; the API itself only sees choices.
 * `share_data: false` is always sent (the API retains requests for training
 * by default). No `Idempotency-Key` is sent: a repeated key is a 409, not a
 * replay, so retries would fail.
 *
 * Sources: https://classifier.dev/openapi.json (`ClassifyRequest`,
 * `ClassifyResponse`, `DimensionResult`), https://classifier.dev/developers
 *
 * @since 0.1.0
 */
import { Result, Schema } from "effect"
import * as Codec from "./Codec.ts"
import { isJsonObject, type JsonObject } from "./Json.ts"
import * as Question from "./Question.ts"
import * as Wire from "./Wire.ts"

const MAX_LABEL = 200
const MAX_INSTRUCTIONS = 4_000
/** Above this, default Jev switches to paid long context. */
const MAX_ITEM = 32_000

const text = (d: Question.Description): string => (typeof d === "string" ? d : Wire.stringify(d))
const labelled = (head: string, d: Question.Description | null | undefined) => (d === null || d === undefined ? head : `${head}: ${text(d)}`)

/** The labels sent for a question, paired with the outcome each one stands for. */
const labelsOf = (q: Question.Any): ReadonlyArray<readonly [label: string, outcome: string]> => {
  switch (q.kind) {
    case "boolean": {
      const c = (q as Question.BooleanQuestion).criteria
      return [[labelled("yes", c?.true), "true"], [labelled("no", c?.false), "false"]]
    }
    case "choice":
      return (q as Question.ChoiceQuestion<string>).options.map((o) => [labelled(o.label, o.description), o.label])
    case "score":
      return (q as Question.ScoreQuestion<string>).levels.map((l, i) => [`level ${i}: ${text(l.description ?? l.label)}`, l.label])
    default:
      throw new TypeError(`ClassifierDev: no encoder for ${q.kind}; the planner should have rejected it`)
  }
}

const SENTENCE: Record<string, string> = {
  boolean: "Choose yes when the criterion holds and no otherwise.",
  choice: "Choose exactly one label.",
  score: "Choose exactly one ordered level, from lowest to highest."
}

const instructionsOf = (id: string, q: Question.Any): string =>
  [`Question ${JSON.stringify(id)}.`, SENTENCE[q.kind], text(q.instructions)].filter((s) => s !== undefined && s.length > 0).join(" ")

const preflight = (spec: Codec.CallSpec): ReadonlyArray<Codec.Problem> => {
  const problems: Array<Codec.Problem> = []
  if (typeof spec.state === "string" && (spec.state.length === 0 || spec.state.length > MAX_ITEM)) {
    problems.push({
      problem: `input is ${spec.state.length} characters; Classifier.dev takes 1 to ${MAX_ITEM} (longer is paid long context)`,
      hint: "Shorten the input, or use a deployment with a larger context"
    })
  }
  for (const { id, question } of spec.questions) {
    const labels = labelsOf(question).map(([l]) => l)
    if (new Set(labels).size !== labels.length) {
      problems.push({ problem: `question "${id}": rendered labels are not distinct (${labels.join(" | ")})`, hint: "Rename options so that \"id: description\" labels differ" })
    }
    const long = labels.filter((l) => l.length > MAX_LABEL)
    if (long.length > 0) problems.push({ problem: `question "${id}": ${long.length} label(s) over ${MAX_LABEL} characters`, hint: "Shorten option descriptions; they are part of the label" })
    if (instructionsOf(id, question).length > MAX_INSTRUCTIONS) {
      problems.push({ problem: `question "${id}": instructions over ${MAX_INSTRUCTIONS} characters`, hint: "Shorten the question's instructions" })
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

const decodeDimension = (q: Question.Any, raw: unknown): Codec.DecodedAnswer => {
  if (!isJsonObject(raw)) return { _tag: "Malformed", problem: "dimension result is not an object", native: { confidence: undefined, fields: {} } }
  const native = { confidence: Codec.finiteOrUndefined(raw["confidence"]), fields: raw }
  const scores = raw["scores"]
  if (!isJsonObject(scores)) return { _tag: "Malformed", problem: "no scores (unscored)", native }
  const outcomeOf = new Map(labelsOf(q))
  const unknown = Object.keys(scores).filter((l) => !outcomeOf.has(l))
  if (unknown.length > 0) return { _tag: "Malformed", problem: `unknown label(s) ${unknown.join(", ")}`, native }
  const probabilities = Object.entries(scores).map(([l, p]) => [outcomeOf.get(l)!, typeof p === "number" ? p : Number.NaN] as const)
  const label = typeof raw["label"] === "string" ? outcomeOf.get(raw["label"]) : undefined
  return { _tag: "Candidate", candidate: q.kind === "choice" ? { label, probabilities } : { probabilities }, native }
}

/**
 * The Classifier.dev dimensions codec, version 1.
 *
 * @since 0.1.0
 */
export const codec: Codec.Codec = {
  id: "classifier-dev",
  version: "1",
  preflight,
  encode: (spec) =>
    Wire.obj([
      ["items", [typeof spec.state === "string" ? spec.state : Wire.stringify(spec.state)]],
      ["tier", "fast"],
      ["model", spec.model],
      ["dimensions", Wire.obj(spec.questions.map(({ id, question }, i) => [
        `q${i}`,
        Wire.obj([["labels", labelsOf(question).map(([l]) => l)], ["instructions", instructionsOf(id, question)]])
      ]))],
      ["share_data", false]
    ]),
  decode: (spec, body) => {
    const r = decodeEnvelope(body)
    if (Result.isFailure(r)) return Result.fail(new Codec.CodecError({ codec: "classifier-dev", message: r.failure.message }))
    const rows = r.success.results
    const dims = rows.length === 1 && isJsonObject(rows[0]) ? rows[0]["dimensions"] : undefined
    if (!isJsonObject(dims)) {
      return Result.fail(new Codec.CodecError({ codec: "classifier-dev", message: `expected one result row with dimensions, got ${rows.length} rows` }))
    }
    const answers = new Map<string, Codec.DecodedAnswer>()
    spec.questions.forEach(({ id, question }, i) => {
      if (`q${i}` in dims) answers.set(id, decodeDimension(question, dims[`q${i}`]))
    })
    const u = r.success.usage
    return Result.succeed({
      reportedModel: r.success.model ?? null,
      answers,
      usage: u === undefined
        ? Codec.unknownUsage
        : {
          inputTokens: Codec.finiteOrUndefined(u["input_tokens"]),
          outputTokens: Codec.finiteOrUndefined(u["output_tokens"]),
          totalTokens: Codec.finiteOrUndefined(u["total_tokens"]),
          fields: u as JsonObject
        }
    })
  }
}
