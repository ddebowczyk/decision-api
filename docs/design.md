# How a decision runs

An application defines a decision once and supplies its engine as an Effect layer. The definition owns the input schema, ordered question IDs and answer types. The engine owns the provider, model and execution policy. Switching engines can change whether a decision is executable.

| Stage | Responsibility |
| --- | --- |
| Define | `Decision.make` names and revisions a set of questions. Independent questions must be answerable in isolation. Joint questions must share one call. |
| Prepare | `Decision.prepare` uses the Effect schema to encode input, validates supplied images and computes identities for the definition and input. |
| Plan | `Planner.plan` is pure. It checks an exact provider and model, preserves grouping, applies explicitly allowed transformations and encodes each call. It returns a plan or a `PlanError` with a reason and hint. |
| Execute | The engine replans the prepared input and checks the fingerprint before sending. Transport makes one HTTP attempt. The engine owns retries and records attempts in the ledger. |
| Interpret | The codec decodes the envelope and individual answers. Validation checks each candidate against its original question and records any probability corrections. |

`Engine.decide` runs these stages after definition. To inspect a request offline, prepare it and pass it to `Planner.plan` with a deployment snapshot. `Planner.preview` omits bodies by default because they contain the input. [Runnable preview](../packages/api/examples/preview.ts)

## What the result means

Each question settles independently as `answered`, `abstained`, `refused` or `error`. A malformed answer can sit beside a valid one. A transport failure or unusable response envelope fails the Effect. Use `Engine.decideAll` when the caller needs every value and should fail on an incomplete result.

An answered boolean carries P(true). A choice can carry a distribution or just a label. A score is the expected zero-based level index. A box carries normalized edges. Check the evidence kind before computing a margin or entropy. Provider confidence retains its native meaning. [Evidence types](../packages/api/src/domain/Evidence.ts)

The fingerprint identifies the definition, encoded input and execution choices. Each answer records its question, call, attempt, deployment and requested model. The resolved model can be unknown. A fallback retries the whole decision on another engine, so its answers belong to one deployment and its ledger can span several. [Provider design](providers.md) · [Agent cheatsheet](../CHEATSHEET.md)
