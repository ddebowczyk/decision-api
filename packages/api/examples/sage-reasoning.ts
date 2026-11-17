/** Opt-in paired live probe on synthetic inputs. Uses the configured Sage deployment. */
import { Effect, Layer, Schema } from "effect"
import { FetchHttpClient } from "effect/http"
import { Decision, Engine, Q } from "../src/index.ts"
import { Provider } from "../src/providers/index.ts"

const Eligibility = Decision.make("synthetic-discount-eligibility", {
  revision: "1",
  input: Schema.String,
  questions: [["eligible", Q.boolean("Does the stated rule make this purchase eligible?")]]
})

const cases = [
  { eligible: true, text: "A coupon applies to blue items unless returned. The purchased item is blue and has not been returned." },
  { eligible: false, text: "A coupon applies to blue items unless returned. The purchased item is blue and has been returned." },
  { eligible: true, text: "The discount applies only to orders before noon with two eligible items. Order was 11:55. The three items were eligible, eligible, ineligible." },
  { eligible: false, text: "The discount applies only to orders before noon with two eligible items. Order was 11:55. The three items were eligible, ineligible, ineligible." },
  { eligible: true, text: "Eligible orders require a current account and either a credit payment or managerial approval. Account is current. Payment is cash. Approval was granted." },
  { eligible: false, text: "Eligible orders require a current account and either a credit payment or managerial approval. Account is current. Payment is cash. Approval was requested and declined." }
] as const

const run = (reasoning: "off" | "on") =>
  Effect.forEach(cases, (scenario) => Engine.decide(Eligibility, scenario.text, { requireNativeAbstention: true }).pipe(
    Effect.map((result) => ({
      expected: scenario.eligible,
      status: result.answers.eligible.status,
      actual: result.answers.eligible.status === "answered" ? result.answers.eligible.value >= 0.5 : null,
      millis: result.attempts.reduce((sum, attempt) => sum + attempt.durationMillis, 0),
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens
    }))
  )).pipe(Effect.provide(Engine.layerFor(Provider.levanto({ mode: "native", reasoning })).pipe(Layer.provide(FetchHttpClient.layer))))

const median = (values: ReadonlyArray<number>) => {
  const sorted = [...values].sort((a, b) => a - b)
  return (sorted[Math.floor((sorted.length - 1) / 2)]! + sorted[Math.floor(sorted.length / 2)]!) / 2
}

await Effect.runPromise(Effect.gen(function*() {
  for (const mode of ["off", "on"] as const) {
    const outcomes = yield* run(mode)
    console.log(`${mode}:`)
    console.log(`  correct: ${outcomes.filter((r) => r.actual === r.expected).length}`)
    console.log(`  incorrect: ${outcomes.filter((r) => r.actual !== null && r.actual !== r.expected).length}`)
    console.log(`  abstained: ${outcomes.filter((r) => r.status === "abstained").length}`)
    console.log(`  invalid: ${outcomes.filter((r) => r.status === "error" || r.status === "refused").length}`)
    console.log(`  medianMillis: ${median(outcomes.map((r) => r.millis))}`)
    for (const key of ["inputTokens", "outputTokens"] as const) {
      const totals = outcomes.map((r) => r[key])
      console.log(`  ${key}: ${totals.some((n) => n === undefined) ? "null" : totals.reduce<number>((sum, n) => sum + n!, 0)}`)
    }
  }
}))
