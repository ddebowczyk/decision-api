import type * as Question from "../../domain/Question.ts"
import * as Codec from "../../wire/Codec.ts"
import { isJsonObject, type JsonObject } from "../../wire/Json.ts"

const malformed = (problem: string, fields: JsonObject = {}): Codec.DecodedAnswer =>
  ({ _tag: "Malformed", problem, native: { confidence: undefined, fields } })

export const decodeAnswer = (question: Question.Any, reply: JsonObject): Codec.DecodedAnswer => {
  const result = reply["result"]
  if (!isJsonObject(result)) return malformed("missing native decision result", reply)
  const native = { confidence: Codec.finiteOrUndefined(result["confidence"]), fields: reply }
  switch (question.kind) {
    case "boolean": {
      if (reply["kind"] !== "yesno") break
      const answer = result["answer"]
      if (answer === null) return { _tag: "Abstained", reason: "Sage returned no yes/no decision", native }
      const p = Codec.finiteOrUndefined(result["probability"])
      if ((answer === "yes" || answer === "no") && p !== undefined) {
        return { _tag: "Candidate", candidate: { probabilities: [["true", p], ["false", 1 - p]] }, native }
      }
      break
    }
    case "choice": {
      if (reply["kind"] !== "choice") break
      const label = result["chosen"]
      if (label === null || result["abstained"] === true) return { _tag: "Abstained", reason: "Sage returned no choice", native }
      if (typeof label !== "string") break
      const probabilities = Array.isArray(result["probabilities"]) ? result["probabilities"] : []
      return {
        _tag: "Candidate", native,
        candidate: {
          label,
          probabilities: probabilities.length === 0 ? undefined : probabilities.map((p) =>
            [String(p?.option), Codec.finiteOrUndefined(p?.probability) ?? NaN] as const)
        }
      }
    }
    case "score": {
      if (reply["kind"] !== "scale" || !Array.isArray(result["probabilities"])) break
      const levels = (question as Question.ScoreQuestion<string>).levels
      return {
        _tag: "Candidate", native,
        candidate: {
          probabilities: result["probabilities"].map((p) =>
            [levels[p?.level]?.label ?? `#${p?.level}`, Codec.finiteOrUndefined(p?.probability) ?? NaN] as const),
          nativeScore: Codec.finiteOrUndefined(result["expectation"])
        }
      }
    }
  }
  return malformed(`invalid Sage ${question.kind} answer`, reply)
}
