# Perplexity / Decider

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

The supplied Decider V1.1 27B model is documented on OpenRouter and has a public Perplexity model card. The current direct API uses `POST https://api.perplexity.ai/v1/decisions` and the Jev-like `state`/named `questions` body with Noul, Choice, and Score.

Version drift matters: the current quickstart documents `pplx-decider-v1.2` (27B, $0.02/M input) and `pplx-decider-flash-v1.2` (4B, $0.01/M), with free output. It explicitly says old direct-API names `pplx-decider-v1.1-27b` and `pplx-decider-v1-27b` select V1.2. The historical V1.1 weights and a hosted call using that name are therefore different provenance records. Do not silently replace the requested historical checkpoint in comparisons.

The current contract allows 1–128 questions, 1–255 Choice options, 1–10 Score levels, text/images, and under 256K total input tokens. V1.2 questions see the shared state and one another. State is read/billed once per group; oversized requests may be grouped, repeating state cost. This differs materially from Jev's independent-question semantics. The V1.1 public model card has its own inference code and Apache-2.0 license.

Assessment: strong hosted and open-weight research candidate, with a migration/alias trap and a question-interaction behavior that a common API must expose.

## Sources and local captures

- [Current quickstart](https://docs.perplexity.ai/docs/decisions/quickstart.md) · [local capture](../sources/perplexity/docs/docs/decisions/quickstart.md)
- [HTTP reference](https://docs.perplexity.ai/api-reference/decisions-post.md) · [local capture](../sources/perplexity/docs/api-reference/decisions-post.md)
- [V1.1 weights/card](https://huggingface.co/perplexity-ai/pplx-decider-v1.1-27b) · [local capture](../sources/perplexity/model-v1.1.md)
- [Requested OpenRouter listing](https://openrouter.ai/perplexity/pplx-decider-v1.1-27b) · [local capture](../sources/openrouter/perplexity--pplx-decider-v1.1-27b.md)
