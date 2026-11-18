# Decision API

`@decisions/api` is a TypeScript library for asking decision models typed questions with Effect. For example, a support router can ask which team owns a ticket, restrict the answer to `"billing" | "technical"`, and inspect the model’s evidence before routing it.

The application defines the questions and input schema. The engine checks whether the selected provider and model can answer them before sending a request. Each question gets its own outcome, so a caller can use answered questions and handle abstentions, refusals, or invalid answers individually.

## Try it locally

From the repository root, install dependencies and run the offline support-routing example.

```sh
just install
just example testing
```

The example exercises two paths with a fake engine. An answered ticket routes to `technical`, and a refusal routes to `manual-review`. Run `just example preview` to see how different providers would execute the same decision without sending it. [Routing example](packages/api/examples/testing.ts) · [Plan preview](packages/api/examples/preview.ts)

## Use it in an application

Download the package tarball from [GitHub Releases](https://github.com/ddebowczyk/decision-api/releases). For v0.3.0, install the archive alongside its Effect peer dependency.

```sh
pnpm add ./decisions-api-0.3.0.tgz effect@4.1.3
```

## Documentation

- [Agent cheatsheet](CHEATSHEET.md) — a runnable TypeScript example and a guide to choosing an entry point.
- [Decision lifecycle](docs/design.md) — how definitions become calls and how to interpret results.
- [Provider design](docs/providers.md) — how model capabilities, codecs, and fallback fit together.
- [API and provider reference](packages/api/README.md) — supported providers, configuration, and native features.
- [Repository operations](ops/README.md) — run `just gate` to type-check and test, or `just ops` to discover packaging and release commands.
