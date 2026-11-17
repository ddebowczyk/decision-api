# Unified decision API on Effect v4

**Date:** 2026-10-17 · **Status:** corrected proposal; no implementation · **Working name:** `@decisions/api` (placeholder)

A TypeScript library for asking typed questions of decision models across providers,
wire formats and deployments. Answers carry explicit evidence: a finite probability
distribution where available, independent label probabilities, a native estimate,
log probabilities, or no probability evidence. Portability does not imply equivalent
model behavior.

## Documents

| Document | What it answers |
| --- | --- |
| [00-destination.md](00-destination.md) | End state of the first implementation and its gates |
| [01-concept-dx.md](01-concept-dx.md) | Goals, principles, proposed API and error handling |
| [02-solution-design.md](02-solution-design.md) | Contracts, preparation, planner, codecs, execution, policy and Effect mapping |
| [03-implementation-plan.md](03-implementation-plan.md) | S1–S50 with dependencies, acceptance gates and release boundaries |
| [05-progress.md](05-progress.md) | Steps done, gate results and decisions |

## Key decisions

1. **Typed judgments are the core; distributions are an evidence facet.** A box,
   extracted value or generated label need not have a finite outcome distribution.
   Metrics and calibration require the evidence type they actually support.
2. **Primitives and dialect handlers are open registries.** Schemas, validation,
   encoding, decoding and optional derivations are executable, versioned registrations.
   Adding a primitive must be demonstrated without editing the core.
3. **Provider = codec × transport × deployment capabilities.** The research maps
   16 native API surfaces from 15 providers to four candidate codec families.
   Shared shape is a reuse opportunity, not proof of interchangeability.
4. **Prepare effectfully, plan purely, execute effectfully.** Schema encoding and
   media loading happen before planning. Joint groups are atomic; only independent
   groups can be partitioned. Limits are checked on final encoded calls.
5. **Results and failures have different control flow.** Answered, refused and
   invalid answers are result values. Transport failures remain in Effect's error
   channel through retry/fallback. Every answer links to its call and attempt.
6. **Calibration and automation qualification are separate.** Profiles transform
   supported evidence; held-out evaluation determines whether a particular policy
   meets an application-defined risk target. Unknown or mismatched evidence keeps
   policy in shadow mode. Neither mechanism guarantees future safety.
7. **Effect v4 integration respects service lifetimes.** Each fallback step builds
   its own Engine with its Provider through `Engine.layerFor`, a new layer object per
   call, so v4's nested layer memoization cannot reuse an Engine built higher up.
   The `effect/ai` bridge advertises only capabilities and provenance it can actually observe.
8. **Library first, four initial providers.** TypeSafe, Basal, Perplexity and OpenAI;
   Node is the first supported runtime, Bun the next validation target. Core and HTTP
   abstractions remain portable. Cross-caller batching and an HTTP gateway are deferred.

## Evidence base

- [Cheatsheet](../../../research/CHEATSHEET.md): provider commonalities and differences.
- [Provider archive](../../../research/provider-docs/README.md): 15 provider briefs,
  20 requested model listings, and related surfaces including Span-02. These are
  documentation captures, not live interoperability tests.
- The review inspected the published **Effect 4.0.5** package and ran isolated
  service-lifetime probes. Implementation must pin that development version initially
  and test any peer compatibility range it advertises.
- Official references: [DecisionModel](https://effect.website/docs/v4/api/effect/ai/DecisionModel),
  [ExecutionPlan](https://effect.website/docs/v4/api/effect/ExecutionPlan),
  [Schema codecs](https://effect.website/docs/v4/schema/canonical-codecs).

## Scope and unresolved choices

The default scope is a library, with Node-based examples, replay tests and evaluation
tools. Workers support needs its own runtime gate; browser use is initially pure core
or an application-controlled proxy. Provider credentials belong on the server.

Domain owners must supply labelled data, risk targets and approval criteria before
any automation qualification can be claimed. Package name, license, profile storage,
and later runtime support remain open in [design §16](02-solution-design.md#16-open-questions).
