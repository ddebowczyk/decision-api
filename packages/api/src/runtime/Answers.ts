import type * as Answer from "../domain/Answer.ts"
import * as Decision from "../domain/Decision.ts"
import type * as Question from "../domain/Question.ts"
import * as Validate from "../domain/Validate.ts"
import type * as Planner from "../planning/Planner.ts"
import type * as Deployment from "../providers/deployment.ts"
import type * as Codec from "../wire/Codec.ts"

interface CallResult {
  readonly call: Planner.Call
  readonly decoded: Codec.Decoded
  readonly attempt: number
}

const settle = (question: Question.Any, answer: Codec.DecodedAnswer | undefined, origin: Answer.Origin, tolerance: number): Answer.Any => {
  switch (answer?._tag) {
    case "Refused":
      return { status: "refused", reason: answer.reason, origin, native: answer.native }
    case "Abstained":
      return { status: "abstained", reason: answer.reason, origin, native: answer.native }
    case "Malformed":
      return { status: "error", problem: answer.problem, origin, native: answer.native }
    case "Candidate": {
      const verdict = Validate.answer(question, answer.candidate, tolerance)
      return verdict._tag === "Valid"
        ? { status: "answered", value: verdict.value, evidence: verdict.evidence, corrections: verdict.corrections, origin, native: answer.native }
        : { status: "error", problem: verdict.problem, origin, native: answer.native }
    }
    default:
      return { status: "error", problem: "no answer in the response", origin, native: { confidence: undefined, fields: {} } }
  }
}

export const assembleAnswers = <D extends Decision.Any>(
  definition: D,
  plan: Planner.DecisionPlan,
  deployment: Deployment.Snapshot,
  results: ReadonlyArray<CallResult>
): Decision.Answers<D> => {
  const answers: Record<string, Answer.Any> = {}
  for (const { call, decoded, attempt } of results) {
    const reported = decoded.reportedModel
    const resolvedModel = reported === plan.model && Object.hasOwn(deployment.aliases, plan.model) ? null : reported
    for (const [index, id] of call.questionIds.entries()) {
      const origin: Answer.Origin = {
        questionId: id,
        callId: call.callId,
        attempt,
        provider: deployment.provider,
        deployment: plan.deployment,
        requestedModel: plan.model,
        resolvedModel,
        ...(plan.request === undefined ? {} : { request: plan.request }),
        lowerings: plan.lowerings.filter((lowering) => lowering.questionIds.length === 0 || lowering.questionIds.includes(id)).map((lowering) => lowering.name)
      }
      const decodedAnswer = decoded.answers.get(call.spec.questions[index]!.id)
      answers[id] = settle(Decision.question(definition, id), decodedAnswer, origin, deployment.tolerance)
    }
  }
  return answers as unknown as Decision.Answers<D>
}
