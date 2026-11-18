# How providers fit

A provider preset combines three pieces. Keeping them separate lets models share a wire format while retaining different limits, question semantics and native features.

| Piece | What it owns | Example |
| --- | --- | --- |
| Deployment snapshot | Endpoint, authentication scheme, response envelope, grouping and retryable statuses | A joint endpoint can answer independent questions through separate calls when the caller allows `split-for-isolation`. |
| Capability declaration | Facts about one exact provider and model, including primitive bounds and provider and adapter support for features | Jev 1.13 and 1.14 accept images. Only 1.14 implements the Box question. |
| Codec | Pure request encoding, response decoding and wire-specific constraints | Jev sends referenced image assets. Clef sends data URLs. Both accept the same application image input. |

## What happens on a provider swap

The prepared decision carries its images and any native-abstention requirement into the next plan. The planner checks the selected model declaration and the codec. A text-only fallback rejects an image request before HTTP. A Sage caller that requires abstention uses native mode and boolean or choice questions. [Feature checks](../packages/api/src/planning/RequestFeatures.ts)

Independent groups can split to fit call limits. Joint groups must fit intact. The planner measures encoded body bytes and state characters, and estimates request-wide and per-question token counts. Preview warnings identify unknown image costs and deployments that may truncate state. [Batching](../packages/api/src/planning/BatchCalls.ts) · [Context limits](../packages/api/src/planning/ContextLimits.ts)

## Where a change goes

1. Put sourced deployment facts and the preset under `packages/api/src/providers/<provider>/`. Declare the exact model and leave unverified capabilities unknown.
2. Reuse an existing codec when the wire contract matches. For a new wire format, add a provider-local codec and register it in the [codec registry](../packages/api/src/planning/Codecs.ts). Use ordered wire objects where question or criterion order matters.
3. Test request bytes, decoded evidence and preflight rejection with fixtures. Run `just gate` and verify changed codecs or deployments with `just live`. [Contributor guide](../packages/api/AGENTS.md)
