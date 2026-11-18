# Agent guide: @decisions/api

For agents that write code with the library or change it. Start with the [agent cheatsheet](../../CHEATSHEET.md) and [library design](../../docs/design.md). See [README.md](README.md) for the API reference.

## Use the library

1. **Inspect before sending.** `Decision.describe(def)` and `Planner.preview(plan)` return JSON. `Planner.plan` is pure and makes no calls, so you can check whether a deployment can run a definition without network or keys (`examples/preview.ts`).
2. **Read `hint`.** `PlanError`, `PreparationError`, `DecisionIncomplete`, `BudgetExhausted` and `DefinitionError` all carry one. For any error, `Errors.explain(e)` gives `{ tag, message, hint, retryable }`, and `Errors.classify(e)` says whether it is `unavailable`, `exhausted` (budget), `rejected` or `misconfigured`. A `PlanError` also has a machine-readable `reason`, one of `unsupported`, `joint-unsupported`, `isolation-required`, `unknown-grouping`, `lowering-required`, `too-large`, `stale-plan` or `provider-constraint` (a codec's own rule, e.g. RESPAN's span input or Classifier.dev's label length).
3. **Branch on `status`, not on exceptions.** A refused or invalid answer is part of the result. Use `decideAll` only when every answer must be `answered`; it fails with `DecisionIncomplete` otherwise.
4. **Opt into lowerings explicitly.** Only `allow: [...]` changes what gets sent. Do not add a lowering to make a `PlanError` go away without telling the user what it changes. For example, `split-for-isolation` multiplies the number of calls.
5. **Read `evidence.undetermined` where it exists.** RESPAN reports mass for "cannot be judged from the input"; the outcome probabilities are then conditional on the question being answerable.
6. **Pin models in production.** On an alias such as `jev-latest`, `origin.resolvedModel` is null when the provider only echoes the alias (Perplexity does).
7. **Use `Engine.layerFor` per fallback step.** Do not share one engine layer constant between an outer `provide` and a fallback step: Effect v4 memoizes layers, and the outer engine would answer.

## Change the library

- **Gates:** run `just gate` for every change. Run `just live` when you touch a codec, transport or deployment, and record the result in `docs/plans/2026-10-17-unified-decision-api/05-progress.md`.
- **Tests first:** a behaviour change starts with a test that fails. Retry and budget tests use `TestClock`, and HTTP tests use `ScriptedHttp`.
- **Purity:** codecs (`encode`/`decode`), `Planner.plan`, `Validate.answer` and `Identity` are pure. Keep effects in `Decision.prepare`, `Transport.send` and `Engine`.
- **One retry owner:** retries live only in `Engine`. Transport makes a single attempt.
- **Adding a provider:** official docs first, other clients second; cite them in the snapshot's `sources`. A new wire shape is a codec (registered in `src/planning/Codecs.ts`); a System One variant is a snapshot. Put HTTP-level framing (`envelope`, `auth`, `{model}` in the path, `{name}` URL parameters) in the snapshot, not in the codec. Unknown grouping or limits stay `"unknown"`, never guessed. Fixtures hold response bodies only.
- **Wire order:** encode request bodies with `Wire.obj`/`Wire.stringify`, because TypeSafe keeps criteria in the order they were sent. Use `Wire.canonical` only for hashing.
- **Deployment facts:** a fact about a deployment cites a source and states its `verification` (`documented`, `replay-tested`, `live-tested`, `unknown`). When you change a snapshot, bump its `version`, which changes plan fingerprints.
- **Model capabilities:** declarations are keyed by exact provider + model. Use `Capabilities.builtIn/get/override` for static discovery and runtime changes; validate metadata with `Capabilities.decode`. New models need an explicit declaration. Preserve `support` versus `adapterSupport`; unknown feature names do not imply support. Capability content is hashed into plans; pass the resolved declaration when planning outside the engine, and rebuild providers/engines after updating a catalog.
- **Secrets:** keys stay `Redacted`. Never log a key or put it in a span attribute. Fixtures hold response bodies only, never headers. `.env` is git-ignored and only `.env` holds keys.

## Layout

| Path | Contents |
| --- | --- |
| `src/domain/` | Questions, prepared decisions, answers, evidence, validation and identity |
| `src/planning/` | Pure planning, capability checks and request partitioning |
| `src/runtime/` | Engine, HTTP transport, retries, fallback, budget, ledger and metrics |
| `src/wire/` | JSON and wire encoding, codec contract and shared System One codec |
| `src/providers/<provider>/` | Provider preset, deployment snapshots and any provider-specific codec or feature declarations |
| `src/providers/` | Shared provider construction, capability catalog and the `@decisions/api/providers` entry point |
| `src/integrations/` | Effect AI decision-model bridge |
| `src/testing/` | Fake engine, scripted HTTP and reply builders, exported as `@decisions/api/testing` |
| `test/` | Offline suites grouped by responsibility, shared fixtures and opt-in live tests under `test/live/` |
| `examples/` | Type-checked by `just check` and run with `just example <name>` |
