/**
 * Provider response bodies built from plain values, for `ScriptedHttp`.
 *
 * @since 0.1.0
 */
import type * as Decision from "../Decision.ts"
import type { JsonObject } from "../Json.ts"
import * as Question from "../Question.ts"

/**
 * A System One body: booleans as `noul`, choices with all mass on the label,
 * scores with all mass on the named level.
 *
 * @example
 * ScriptedHttp.layer([{ status: 200, body: Replies.systemOne(Triage, { refund: 0.9, team: "billing", urgency: "soon" }) }])
 *
 * @since 0.1.0
 */
export const systemOne = <D extends Decision.Any>(
  definition: D,
  values: Partial<{ readonly [E in D["questions"][number] as E[0]]: E[1] extends Question.BooleanQuestion ? number : string }>,
  model = "fake-1"
): JsonObject => {
  const answers: Record<string, JsonObject> = {}
  for (const [id, q] of definition.questions) {
    const v = (values as Record<string, number | string | undefined>)[id]
    if (v === undefined) continue
    const outcomes = Question.outcomes(q)
    if (q.kind === "boolean") answers[id] = { type: "noul", noul: v as number }
    else if (q.kind === "choice") {
      answers[id] = { type: "choice", choice: v as string, probabilities: Object.fromEntries(outcomes.map((o) => [o, o === v ? 1 : 0])) }
    } else {
      const i = outcomes.indexOf(v as string)
      answers[id] = { type: "score", score: i, probabilities: Object.fromEntries(outcomes.map((_, j) => [String(j), j === i ? 1 : 0])) }
    }
  }
  return { model, answers, usage: { input_tokens: 0, output_tokens: 0 } }
}
