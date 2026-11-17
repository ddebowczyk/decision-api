# Together AI / Tev1 4B Experimental

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Tev1 is a Jev-inspired model and training recipe, but the documented native inference path is constrained chat generation rather than a direct Jev probability endpoint. The Together ID is `together/Tev1-4B-experimental`; the requested OpenRouter ID is `togethercomputer/tev1-4b-experimental`.

The native task contains `state`, one `question`, and 2–24 letter-labeled options. It returns one option letter for application code to map to a semantic key. The model card shows `temperature: 0`, `max_tokens: 8`, and thinking disabled. The repository exposes token logprobs in its example and explicitly says these are model preferences, not calibrated confidence.

The public repository contains the dataset-building and fine-tuning recipe, with a reported starting training cost, rather than evidence that its outputs have Jev's calibrated distribution semantics. The code is MIT; the model card says the fine-tuned weight release license is being finalized. The Apache-2.0 base license alone does not resolve that statement.

Assessment: useful for low-cost local specialization and training research, but not a native drop-in replacement. An OpenRouter normalized route does not prove the underlying model makes no generated tokens or returns a measured calibrated distribution. Preserve generated-label and logprob provenance.

## Sources and local captures

- [Model card and native API](https://huggingface.co/togethercomputer/Tev1-4B-experimental) · [local capture](../sources/together/model-card.md)
- [Project](https://github.com/togethercomputer/tev1) · [local capture](../sources/together/README.md)
- [Training recipe](https://github.com/togethercomputer/tev1/blob/main/docs/TRAINING.md) · [local capture](../sources/together/docs/TRAINING.md)
- [Requested router model](https://openrouter.ai/togethercomputer/tev1-4b-experimental) · [local capture](../sources/openrouter/togethercomputer--tev1-4b-experimental.md)
