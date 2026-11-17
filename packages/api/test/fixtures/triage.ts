import { Schema } from "effect"
import { Decision, Q } from "../../src/index.ts"

/** The running example used across the suite. */
export const Triage = Decision.make("ticket-triage", {
  revision: "1",
  input: Schema.Struct({ subject: Schema.String, body: Schema.String }),
  questions: [
    ["refund", Q.boolean("Is the customer asking for money back?")],
    ["team", Q.choice("Which team should own this?", [
      ["billing", "Charges, invoices, refunds"],
      ["technical", "Bugs, outages, error messages"],
      "sales"
    ])],
    ["urgency", Q.score("How urgent is it?", ["routine", "soon", "immediate"])]
  ]
})

export const triageInput = { subject: "Double charge", body: "I was charged twice for my order. Please refund it." }
