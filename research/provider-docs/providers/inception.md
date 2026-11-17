# Inception / Mercury Decide

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Mercury Decide uses `POST https://api.inceptionlabs.ai/v1/decisions`, model `mercury-decide`, Bearer authentication, and the Jev-like `state` plus named Noul/Choice/Score questions. Its native route differs from TypeSafe's `/v1/systemone`; the payload and answer map are familiar. It is not a chat-completions model, does not stream, and does not perform tool calling.

Current docs allow 1–255 Choice options and 1–10 Score levels. They also document image inputs; older descriptions calling it text-only should not override those current pages. Image validation and the whole-request body limit apply separately. The current price is $0.02/M input tokens, described as a 50% discount from $0.04; output is free.

The paid and free OpenRouter listings are access tiers for the same model family, not evidence of separate weights. Free access has router-specific limits and availability. The company makes diffusion language models, but that alone does not establish Mercury Decide's architecture; do not infer its internals from the Mercury brand.

Assessment: a close hosted API alternative with a route adaptation, current multimodal docs, and an explicit promotional price. No local inference or measured quality comparison was performed.

## Sources and local captures

- [Decisions guide](https://docs.inceptionlabs.ai/capabilities/decisions.md) · [local capture](../sources/inception/docs/capabilities/decisions.md)
- [API reference](https://docs.inceptionlabs.ai/api-reference/decisions/create-a-decision.md) · [local capture](../sources/inception/docs/api-reference/decisions/create-a-decision.md)
- [Paid router route](https://openrouter.ai/inception/mercury-decide) · [local capture](../sources/openrouter/inception--mercury-decide.md)
- [Free router route](https://openrouter.ai/inception/mercury-decide:free) · [local capture](../sources/openrouter/inception--mercury-decide--free.md)
