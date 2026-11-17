/** Shared helpers for the live suites: real HTTP, and a report that prints values and request ids, never keys. */
import { Layer } from "effect"
import { FetchHttpClient } from "effect/http"
import { type Answer, Engine } from "../../src/index.ts"
import type { Provider } from "../../src/providers/index.ts"

export const has = (...keys: ReadonlyArray<string>) => keys.every((k) => (process.env[k] ?? "").length > 0)
export const live = (p: Provider.Provider) => Engine.layerFor(p).pipe(Layer.provide(FetchHttpClient.layer))

export const report = (label: string, r: Engine.DecisionResult) => {
  const answers = Object.entries(r.answers as Record<string, Answer.Any>).map(([id, a]) => [
    id,
    a.status === "answered" ? a.value : a.status === "error" ? `error: ${a.problem}` : a.status,
    a.status === "answered" && a.evidence.kind === "finite-distribution" && a.evidence.undetermined !== undefined ? { undetermined: a.evidence.undetermined } : null,
    a.status === "answered" ? a.corrections : []
  ])
  console.log(JSON.stringify({
    label,
    deployment: r.deployment,
    resolved: Object.values(r.answers as Record<string, Answer.Any>)[0]?.origin.resolvedModel ?? null,
    usage: r.usage,
    attempts: r.attempts.map((a) => ({ status: a.status, requestId: a.requestId, ms: a.durationMillis, outcome: a.outcome })),
    answers
  }))
}

export const expectAnswered = (r: Engine.DecisionResult) => {
  for (const [id, a] of Object.entries(r.answers as Record<string, Answer.Any>)) {
    if (a.status !== "answered") throw new Error(`${id}: ${a.status === "error" ? a.problem : a.status === "refused" ? a.reason : ""}`)
  }
}
