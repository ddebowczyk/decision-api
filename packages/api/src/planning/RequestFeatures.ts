import { Result } from "effect"
import type { Prepared } from "../domain/Decision.ts"
import type { Declaration } from "../providers/Capabilities.ts"
import type { Snapshot } from "../providers/deployment.ts"
import type { Codec, CallSpec, Problem } from "../wire/Codec.ts"
import type { JsonObject } from "../wire/Json.ts"

export const available = (declaration: Declaration, name: string): boolean => {
  const feature = declaration.features[name]
  return feature?.support === "supported" && feature.adapterSupport === "supported"
}

interface Unsupported extends Problem {
  readonly reason: "unsupported" | "provider-constraint"
}

interface Features {
  readonly spec: Pick<CallSpec, "images" | "reasoning">
  readonly headers: Readonly<Record<string, string>>
  readonly summary: JsonObject
}

export const select = (prepared: Prepared, deployment: Snapshot, declaration: Declaration, codec: Codec): Result.Result<Features, Unsupported> => {
  const questions = prepared.definition.questions
  if (prepared.requireNativeAbstention && (
    !codec.nativeAbstention || !available(declaration, "native-abstention") ||
    questions.some(([, question]) => question.kind !== "boolean" && question.kind !== "choice")
  )) {
    return Result.fail({
      reason: "unsupported", problem: "native abstention is required for every question",
      hint: "Use a native abstention deployment and boolean or choice questions"
    })
  }
  const reasoning = deployment.request?.reasoning
  if (reasoning !== undefined && (!codec.reasoning || !available(declaration, "reasoning"))) {
    return Result.fail({
      reason: "unsupported", problem: "reasoning mode is not supported by this provider, model and endpoint",
      hint: "Use a reasoning-capable Sage deployment"
    })
  }
  const images = prepared.images?.length ? prepared.images : undefined
  const imageRequest = images === undefined ? undefined : codec.images
  if (images !== undefined && (imageRequest === undefined || !available(declaration, "images"))) {
    return Result.fail({
      reason: "unsupported", problem: "this provider, model and endpoint cannot send images",
      hint: "Select an image-capable deployment"
    })
  }
  const mediaProblems = images === undefined ? [] : imageRequest?.preflight(images) ?? []
  if (mediaProblems.length > 0) {
    return Result.fail({
      reason: "provider-constraint", problem: mediaProblems.map((issue) => issue.problem).join("; "),
      hint: mediaProblems[0]!.hint
    })
  }
  return Result.succeed({
    spec: { ...(images === undefined ? {} : { images }), ...(reasoning === undefined ? {} : { reasoning }) },
    headers: {
      ...(deployment.request?.longContext ? { "TypeSafe-Danger-Zone-Long-Context": "true" } : {}),
      ...imageRequest?.headers
    },
    summary: {
      ...deployment.request,
      ...(codec.nativeAbstention ? { nativeAbstention: true } : {}),
      ...(images === undefined ? {} : { images: images.length }),
      ...(questions.some(([, question]) => question.kind === "box") ? { box: true } : {})
    }
  })
}
