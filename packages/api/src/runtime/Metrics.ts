/**
 * Metrics recorded by the engine. Attributes: `deployment`, plus `outcome`,
 * `status` or `kind` as named.
 *
 * @since 0.1.0
 */
import { Metric } from "effect"

/** Call attempts by `deployment` and `outcome` (`ok`/`failed`). @since 0.1.0 */
export const calls = Metric.counter("decision_calls_total", { description: "Decision call attempts" })

/** Attempt latency in milliseconds by `deployment`. @since 0.1.0 */
export const latency = Metric.histogram("decision_call_duration_ms", {
  description: "Decision call attempt latency",
  boundaries: Metric.exponentialBoundaries({ start: 25, factor: 2, count: 12 })
})

/** Reported tokens by `deployment` and `kind` (`input`/`output`). Unknown counts are not recorded. @since 0.1.0 */
export const tokens = Metric.counter("decision_tokens_total", { description: "Tokens reported by providers" })

/** Answers by `deployment` and `status` (`answered`/`refused`/`error`). @since 0.1.0 */
export const answers = Metric.counter("decision_answers_total", { description: "Per-question answers" })
