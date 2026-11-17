/**
 * Question constructors. A question is a typed, versioned specification; its
 * phantom `~types` carry the answer value and evidence types used by result
 * inference. Construct questions with `Q.boolean`, `Q.choice` and `Q.score`.
 *
 * @since 0.1.0
 */
import type * as Evidence from "./Evidence.ts"
import type { JsonArray, JsonObject } from "./Json.ts"

/**
 * Instructions or an option description: plain text or a structured JSON tree.
 * Sending a structured description to a deployment that only accepts text
 * requires the named lowering `stringify-description`.
 *
 * @since 0.1.0
 */
export type Description = string | JsonObject | JsonArray

/**
 * Base shape of every question kind, including extension kinds.
 *
 * @since 0.1.0
 */
export interface Question<Kind extends string = string, Value = unknown, Ev extends Evidence.Evidence = Evidence.Evidence> {
  readonly kind: Kind
  /** Primitive contract version; part of the definition identity. */
  readonly version: string
  readonly instructions: Description
  readonly "~types"?: { readonly value: Value; readonly evidence: Ev }
}

/** @since 0.1.0 */
export type Any = Question<string, any, any>

/** @since 0.1.0 */
export type ValueOf<Q extends Any> = Q extends Question<any, infer V, any> ? V : never

/** @since 0.1.0 */
export type EvidenceOf<Q extends Any> = Q extends Question<any, any, infer E> ? E : never

/**
 * A labelled outcome with an optional description.
 *
 * @since 0.1.0
 */
export interface Option<L extends string> {
  readonly label: L
  readonly description: Description | null
}

/**
 * Yes/no question. The answer value is the probability of yes; no threshold is
 * applied.
 *
 * @since 0.1.0
 */
export interface BooleanQuestion extends Question<"boolean", number, Evidence.FiniteDistribution<Evidence.BooleanOutcome>> {
  readonly criteria: { readonly true?: Description; readonly false?: Description } | undefined
}

/**
 * Pick one label. The answer value is the provider's chosen label.
 *
 * @since 0.1.0
 */
export interface ChoiceQuestion<L extends string>
  extends Question<"choice", L, Evidence.FiniteDistribution<L> | Evidence.LabelOnly>
{
  readonly options: ReadonlyArray<Option<L>>
}

/**
 * Rate on ordered levels, lowest first. The answer value is the expected
 * 0-based level index, recomputed locally from the distribution.
 *
 * @since 0.1.0
 */
export interface ScoreQuestion<Lv extends string> extends Question<"score", number, Evidence.FiniteDistribution<Lv>> {
  readonly levels: ReadonlyArray<Option<Lv>>
}

/** An option given as a bare label or a `[label, description]` pair. */
type OptionInput<L extends string> = L | readonly [L, Description | null]

const toOption = <L extends string>(o: OptionInput<L>): Option<L> =>
  typeof o === "string" ? { label: o, description: null } : { label: o[0], description: o[1] }

/**
 * Yes/no question.
 *
 * @example
 * Q.boolean("Is the customer asking for money back?")
 * Q.boolean("Is it urgent?", { true: "Explicitly time-sensitive", false: "No urgency expressed" })
 *
 * @since 0.1.0
 */
export const boolean = (
  instructions: Description,
  criteria?: { readonly true?: Description; readonly false?: Description }
): BooleanQuestion => ({ kind: "boolean", version: "1", instructions, criteria })

/**
 * Pick one of the given options, in the given order.
 *
 * @example
 * Q.choice("Which team?", [["billing", "Payments and refunds"], ["technical", "Bugs"], "other"])
 *
 * @since 0.1.0
 */
export const choice = <const L extends string>(
  instructions: Description,
  options: ReadonlyArray<OptionInput<L>>
): ChoiceQuestion<L> => ({ kind: "choice", version: "1", instructions, options: options.map(toOption) })

/**
 * Rate on ordered levels, lowest first. A bare label is also sent as the
 * level's description.
 *
 * @example
 * Q.score("How urgent?", ["routine", "soon", "immediate"])
 *
 * @since 0.1.0
 */
export const score = <const Lv extends string>(
  instructions: Description,
  levels: ReadonlyArray<OptionInput<Lv>>
): ScoreQuestion<Lv> => ({ kind: "score", version: "1", instructions, levels: levels.map(toOption) })

/**
 * Outcome labels of a question, in definition order. Booleans are `["true", "false"]`.
 *
 * @since 0.1.0
 */
export const outcomes = (q: Any): ReadonlyArray<string> => {
  const r = q as { readonly options?: ReadonlyArray<Option<string>>; readonly levels?: ReadonlyArray<Option<string>> }
  if (q.kind === "boolean") return ["true", "false"]
  if (r.options) return r.options.map((o) => o.label)
  if (r.levels) return r.levels.map((o) => o.label)
  return []
}
