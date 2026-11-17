# API comparison and integration implications

Checked 2026-10-17. Each provider link leads to source-linked notes and local documentation. This is a contract comparison, not a quality leaderboard. “Core” means named Noul, Choice and Score questions over shared state. Similar JSON does not guarantee identical inference, billing or confidence semantics.

## Documented API surfaces

| Provider | Native transport | Core compatibility | Distinctive capability or constraint |
| --- | --- | --- | --- |
| [TypeSafe](providers/typesafe.md) | `api.typesafe.ai/v1/systemone` | Baseline | Independent questions; experimental Jev 1.14 Images/Box behind a header |
| [Basal](providers/basal.md) | Local `/v1/systemone`; `/v1/basal` alias | Core shape; upstream says SDK not tested | Multi-label, cost-based actions, tools, verify/compress/extract; confidence means selected probability |
| [classifier.dev](providers/classifier-dev.md) | `/v1/systemone`; `/v1/classify` | Documented official SDK compatibility | Jev-backed orchestration, batching, MCP, escalation, URL and document processing |
| [Perplexity](providers/perplexity.md) | `api.perplexity.ai/v1/decisions` | Core payload; different route | V1.1 hosted name now selects V1.2; V1.2 questions see one another |
| [Drex](providers/nace-ai.md) | Local `/v1/systemone`; OpenRouter | Core shape | Self-hosting through model-specific inference code/forks; Open RAIL-M weights |
| [OpenAI](providers/openai.md) | `api.openai.com/v1/decisions` | Native schema translation required | `input`, question array, `predicate`, typed choices, refusals |
| [Microsoft](providers/microsoft.md) | Foundry `/providers/microsoft/v1/systemone` | Core shape plus deployment transport | Request model is deployment name; resource identity and region matter |
| [Mercury Decide](providers/inception.md) | `api.inceptionlabs.ai/v1/decisions` | Core payload; different route | Current image support; paid/free router routes; promotional input pricing |
| [Clef](providers/cloudflare.md) | Workers AI account/model route or binding | Core payload plus platform transport | Images/video; Omni adds audio; hosted text truncation documented |
| [Liquid](providers/liquid.md) | `api.liquid.ai/decisions/v1/systemone` | Core payload plus image extension | Each question separately billed with images; smaller open-weight models also documented |
| [Kev](providers/jaredpalmer.md) | Local `/v1/systemone` | Core and documented TypeSafe SDK use | Inspectable calibration, local inference/fine-tuning; accepted vs validated context differs |
| [Solar Decide](providers/upstage.md) | Model page specifies `/v1/systemone` schema | Documented core; transport details incomplete in captured model page | Beta; 512K advertised context; Korean positioning |
| [Span-01](providers/respan.md) | `api.respan.ai/api/v1/scores` | Different native schema and task semantics | Present/absent/not-observable probabilities over trace behaviors |
| [Classify-1](providers/scaledown.md) | `api.scaledown.xyz/v1/scaledown` | Core payload with state restrictions | Reads only selected object fields; each question becomes a separate internal call |
| [Tev1](providers/together.md) | Together `/v1/chat/completions` | Different native inference interface | Constrained generated option letter; logprobs are not calibrated confidence |

[OpenRouter's TypeSafe SDK guide](sources/openrouter/docs/guides/community/typesafe-sdk.md) documents base URL `https://openrouter.ai/api`, which produces `POST /api/v1/systemone`. Its separate Decisions endpoint is `POST /api/alpha/decisions`. Use the selected route's reference and authentication; a model's presence on OpenRouter does not establish native SDK compatibility.

## Important differences to preserve

1. **Question isolation.** Jev's questions are independent. Perplexity V1.2 explicitly lets questions see one another, and grouping can change answers. A provider adapter cannot repair this by renaming fields. Record the behavior and test combined versus isolated requests.
2. **Confidence meaning.** TypeSafe and Kev describe transformed confidence for Choice/Score; Basal uses the selected probability. classifier.dev can return null after escalation; Tev1 logprobs have no demonstrated calibration equivalence. Keep raw distributions and provenance; tune thresholds per model and deployment.
3. **Unknown and refusal.** Span-01's not-observable is a distinct outcome. OpenAI may refuse an individual question. Neither is equivalent to a false Noul or an ordinary option with low confidence.
4. **State fidelity.** ScaleDown reads only `state.text`/`state.document` from object state. Cloudflare documents truncation to fit its hosted context. classifier.dev may select a subset of chunks for a final judgment. Record what evidence was actually evaluated where the API exposes it.
5. **Billing unit.** Liquid repeats input/image billing per question; ScaleDown sums internal classify usage. Perplexity V1.2 bills shared state once per group and may split groups. Do not estimate all providers using one shared-state formula.
6. **Model identity.** Jev latest/preview differ; Perplexity's old direct name selects a newer model; Azure requests use deployment names. Keep requested ID, returned ID, underlying checkpoint/revision where available, and deployment separate.
7. **Media and context.** Raw provider, SDK, router and local runtime can have different features and limits. Context accepted by a server is not context whose accuracy was validated. Image presence in a model family does not imply every checkpoint or route accepts it.
8. **Extensions.** Box, tool selection, multi-label judgments, deadline reasoning, and offset-based extraction should be explicit optional capabilities. Do not force them into an ordinary Choice and lose their meaning.

## Newer models found beyond the supplied list

- [Perplexity V1.2 and Flash V1.2](sources/perplexity/docs/docs/decisions/quickstart.md): current direct models, jointly evaluated questions, new pricing and alias behavior.
- [Liquid d1-3B](sources/liquid/docs/lfm/models/d1-3b.md) and [d1-omni-600M](sources/liquid/docs/lfm/models/d1-omni-600m.md): smaller open-weight decision models, with different deployment contracts from hosted d1.
- [Respan Span-02](sources/respan/span-02-concept.md): System One body on `/api/v1/decisions`, text/images, additional number questions, and a deadline in milliseconds for reasoning. This is a separate successor model; it does not change Span-01's trace interface.
- [Kev family](sources/jaredpalmer/README.md) and [Basal current models](sources/basal/README.md): multiple sizes and local formats beyond the named 4B/ranking entries.

## Evidence gaps and conflicts

- OpenAI's guide requires inline image data URLs, while its API reference permits public image URLs. Both captures are retained; support was not probed.
- TypeSafe's models table lists text while Images/Box pages document experimental image features. The latter require opt-in headers and should be recorded separately from stable capabilities.
- Liquid shows an SDK root URL and a longer raw HTTP route. SDK interoperability was not exercised here.
- Upstage's captured model page establishes its model/schema but not the complete native transport contract. Do not synthesize a full endpoint from the route name alone.
- Twenty model listings establish published documentation, not current account access, capacity, measured latency, or successful inference. Usage counts do not establish quality.
- Vendor benchmark scores use different datasets, versions, judges, context sizes and measurement paths. No global winner can be inferred from this collection.

## Suggested evaluation scope

Assessment: start with a small common suite for Noul/Choice/Score, and add separate suites for media, ternary outcomes and task extensions. Measure labeled task accuracy, Brier/calibration, automation rate at a fixed error budget, missing-evidence behavior, option ordering, combined-question interactions, truncation and end-to-end latency/cost. Pin model/deployment and save raw request/response/usage. That will establish whether a candidate improves the actual application rather than only matching the JSON shape.
