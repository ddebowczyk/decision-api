import { Result } from "effect"
import type * as Question from "../../domain/Question.ts"
import * as Codec from "../../wire/Codec.ts"
import { isJsonObject, type JsonObject } from "../../wire/Json.ts"
import { decodeAnswer } from "./native-answers.ts"

const encodeQuestion = ({ id, question }: Codec.CallSpec["questions"][number]): JsonObject => {
  const instructions = question.instructions
  switch (question.kind) {
    case "boolean":
      return { id, kind: "yesno", instructions }
    case "choice":
      return {
        id, kind: "choice", instructions,
        options: (question as Question.ChoiceQuestion<string>).options.map(({ label, description }) => ({ option: label, description }))
      }
    case "score":
      return {
        id, kind: "scale", instructions,
        levels: (question as Question.ScoreQuestion<string>).levels.map(({ label, description }, level) => ({ level, description: description ?? label }))
      }
    default:
      throw new TypeError(`Sage native decisions do not support ${question.kind} questions`)
  }
}

export const codec: Codec.Codec = {
  id: "levanto-native-batch",
  version: "1",
  nativeAbstention: true,
  reasoning: true,
  preflight: (spec) => spec.model === "levanto-sage-2" ? [] : [{
    problem: "Sage's native batch endpoint does not accept a model selector",
    hint: "Use the documented levanto-sage-2 deployment for native decisions"
  }],
  encode: (spec) => ({
    ...(spec.reasoning === undefined ? {} : { reasoning: spec.reasoning }),
    requests: [{ content: spec.state, questions: spec.questions.map(encodeQuestion) }]
  }),
  decode: (spec, body) => {
    const fail = (message: string) => Result.fail(new Codec.CodecError({ codec: "levanto-native-batch", message }))
    if (!isJsonObject(body) || !Array.isArray(body["results"]) || body["results"].length !== 1) return fail("expected one result group")
    const group = body["results"][0]
    if (!isJsonObject(group) || !Array.isArray(group["answers"]) || group["answers"].length !== spec.questions.length) {
      return fail("native response count does not match the request")
    }
    const meta = isJsonObject(body["meta"]) ? body["meta"] : {}
    const model = meta["model"]
    if (typeof model === "string" && model !== spec.model) return fail("native endpoint reported an unexpected model")
    const usage = isJsonObject(meta["usage"]) ? meta["usage"] : {}
    const inputTokens = Codec.finiteOrUndefined(usage["input_tokens"]) ?? Codec.finiteOrUndefined(usage["billed_input_tokens"])
    const outputTokens = Codec.finiteOrUndefined(usage["output_tokens"])
    const answers = new Map<string, Codec.DecodedAnswer>()
    for (const [index, entry] of spec.questions.entries()) {
      const row = group["answers"][index]
      if (isJsonObject(row) && row["ok"] === true && isJsonObject(row["result"]) && row["result"]["id"] === entry.id) {
        answers.set(entry.id, decodeAnswer(entry.question, row["result"]))
        continue
      }
      const problem = isJsonObject(row) && typeof row["error"] === "string" ? row["error"] : "missing or mismatched native decision answer"
      answers.set(entry.id, { _tag: "Malformed", problem, native: { confidence: undefined, fields: {} } })
    }
    return Result.succeed({
      reportedModel: typeof model === "string" ? model : null,
      answers,
      usage: { inputTokens, outputTokens, totalTokens: inputTokens === undefined || outputTokens === undefined ? undefined : inputTokens + outputTokens, fields: usage }
    })
  }
}
