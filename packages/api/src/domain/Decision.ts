/**
 * Decision definitions: a name, an application revision, an input schema and
 * ordered, typed questions.
 *
 * @since 0.1.0
 */
import { Data, Effect, Schema } from "effect"
import type * as Answer from "./Answer.ts"
import * as Identity from "./Identity.ts"
import type { Json } from "../wire/Json.ts"
import * as Question from "./Question.ts"

/**
 * `independent`: no question may see another. `joint`: the questions form one
 * atomic group that is always asked together.
 *
 * @since 0.1.0
 */
export type Mode = "independent" | "joint"

/** @since 0.1.0 */
export type Entry = readonly [id: string, question: Question.Any]

/** @since 0.1.0 */
export type Entries = ReadonlyArray<Entry>

/** @since 0.1.0 */
export interface Definition<
  Name extends string = string,
  S extends Schema.Constraint = Schema.Constraint,
  Qs extends Entries = Entries
> {
  readonly _tag: "DecisionDefinition"
  readonly name: Name
  /** Application-owned. Change it when input encoding or behaviour changes. */
  readonly revision: string
  readonly input: S
  readonly mode: Mode
  readonly questions: Qs
}

/** @since 0.1.0 */
export type Any = Definition<string, any, Entries>

/** Question ids of a definition. @since 0.1.0 */
export type QuestionId<D extends Any> = D["questions"][number][0]

/** Typed answers keyed by question id. @since 0.1.0 */
export type Answers<D extends Any> = {
  readonly [E in D["questions"][number] as E[0]]: Answer.Of<E[1]>
}

/** Plain answer values keyed by question id. @since 0.1.0 */
export type Values<D extends Any> = {
  readonly [E in D["questions"][number] as E[0]]: Question.ValueOf<E[1]>
}

/** The decoded input type of a definition. @since 0.1.0 */
export type Input<D extends Any> = D["input"]["Type"]

/**
 * A malformed definition. Thrown by `Decision.make`, because it is a
 * programming error found when the module loads, not a runtime condition.
 *
 * @since 0.1.0
 */
export class DefinitionError extends Data.TaggedError("DefinitionError")<{
  readonly definition: string
  readonly message: string
  readonly hint: string
}> {}

const fail = (definition: string, message: string, hint: string): never => {
  throw new DefinitionError({ definition, message: `${definition}: ${message}`, hint })
}

const findDuplicate = (xs: ReadonlyArray<string>): string | undefined => {
  const seen = new Set<string>()
  for (const x of xs) {
    if (seen.has(x)) return x
    seen.add(x)
  }
  return undefined
}

const validate = (name: string, questions: Entries): void => {
  if (name.length === 0) fail("<unnamed>", "name is empty", "Give the decision a stable, non-empty name")
  if (questions.length === 0) fail(name, "no questions", "Add at least one [id, question] entry")
  const dup = findDuplicate(questions.map(([id]) => id))
  if (dup !== undefined) fail(name, `duplicate question id "${dup}"`, "Question ids must be unique")
  for (const [id, q] of questions) {
    if (id.length === 0) fail(name, "empty question id", "Use a non-empty id such as \"refund\"")
    if (q.kind === "choice" || q.kind === "score") {
      const labels = Question.outcomes(q)
      const what = q.kind === "choice" ? "options" : "levels"
      if (labels.length < 2) fail(name, `question "${id}" needs at least two ${what}`, `Add ${what} to "${id}"`)
      if (labels.some((l) => l.length === 0)) fail(name, `question "${id}" has an empty label`, "Labels must be non-empty")
      const d = findDuplicate(labels)
      if (d !== undefined) fail(name, `question "${id}" repeats label "${d}"`, "Labels must be unique within a question")
    }
  }
}

/**
 * Define a decision. Question ids, option labels and level labels are inferred
 * as literal types, so answers are typed per question.
 *
 * @example
 * const Triage = Decision.make("ticket-triage", {
 *   revision: "1",
 *   input: Schema.Struct({ subject: Schema.String, body: Schema.String }),
 *   questions: [
 *     ["refund", Q.boolean("Is the customer asking for money back?")],
 *     ["team", Q.choice("Which team?", [["billing", "Payments"], ["technical", "Bugs"]])]
 *   ]
 * })
 *
 * @throws DefinitionError on duplicate ids or labels, or too few options.
 * @since 0.1.0
 */
export const make = <const Name extends string, S extends Schema.Constraint, const Qs extends Entries>(
  name: Name,
  options: {
    readonly revision: string
    readonly input: S
    readonly mode?: Mode | undefined
    readonly questions: Qs
  }
): Definition<Name, S, Qs> => {
  validate(name, options.questions)
  return {
    _tag: "DecisionDefinition",
    name,
    revision: options.revision,
    input: options.input,
    mode: options.mode ?? "independent",
    questions: options.questions
  }
}

/**
 * Look up a question by id.
 *
 * @since 0.1.0
 */
export const question = <D extends Any>(d: D, id: QuestionId<D>): Question.Any => {
  const e = d.questions.find(([qid]) => qid === id)
  if (e === undefined) throw new Error(`unknown question id ${id}`)
  return e[1]
}

/**
 * A definition with its input encoded to JSON and both identities computed.
 * Everything the pure planner needs.
 *
 * @since 0.1.0
 */
export interface Prepared<D extends Any = Any> {
  readonly _tag: "PreparedDecision"
  readonly definition: D
  readonly definitionId: string
  readonly input: Json
  readonly inputId: string
}

/**
 * The input did not encode with the definition's schema.
 *
 * @since 0.1.0
 */
export class PreparationError extends Data.TaggedError("PreparationError")<{
  readonly definition: string
  readonly message: string
  readonly hint: string
  readonly cause: unknown
}> {}

/**
 * Encode an input with the definition's canonical JSON codec
 * (`Schema.toCodecJson`). Services the schema needs for encoding stay in `R`.
 *
 * @example
 * const prepared = yield* Decision.prepare(Triage, { subject: "Double charge", body: "Charged twice" })
 *
 * @since 0.1.0
 */
export const prepare = <D extends Any>(
  definition: D,
  input: Input<D>
): Effect.Effect<Prepared<D>, PreparationError, D["input"]["EncodingServices"]> =>
  Schema.encodeEffect(Schema.toCodecJson(definition.input as Schema.Constraint))(input).pipe(
    Effect.mapError((cause) =>
      new PreparationError({
        definition: definition.name,
        message: `${definition.name}: input does not encode: ${cause.message}`,
        hint: "Pass an input that matches the definition's input schema; the message names the failing path",
        cause
      })
    ),
    Effect.map((encoded) => {
      const json = encoded as Json
      return {
        _tag: "PreparedDecision" as const,
        definition,
        definitionId: Identity.definition(definition),
        input: json,
        inputId: Identity.input(json)
      }
    }),
    Effect.withSpan("Decision.prepare", { attributes: { "decision.name": definition.name } })
  ) as Effect.Effect<Prepared<D>, PreparationError, D["input"]["EncodingServices"]>

const VALUE: Readonly<Record<string, string>> = {
  boolean: "probability of true, 0..1",
  choice: "one of outcomes",
  score: "expected 0-based level index, 0..levels-1"
}

/**
 * A JSON description of a definition for people and agents: identity,
 * mode, and each question with its outcomes and what its value means.
 *
 * @since 0.1.0
 */
export const describe = (d: Any): Json => ({
  name: d.name,
  revision: d.revision,
  id: Identity.definition(d),
  mode: d.mode,
  questions: d.questions.map(([id, q]) => ({
    id,
    kind: q.kind,
    instructions: q.instructions,
    outcomes: [...Question.outcomes(q)],
    value: VALUE[q.kind] ?? "see primitive"
  }))
})
