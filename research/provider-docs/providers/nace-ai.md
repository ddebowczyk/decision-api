# Nace.AI / Drex

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Drex v1.5 and v2.0 are documented open-weight decision models with Jev-like state and typed questions. The repository and model cards describe self-hosting at `POST /v1/systemone` using Python, or dedicated llama.cpp/Ollama forks. They are also listed on OpenRouter. Do not assume an unmodified mainstream runtime serves the custom decision head.

Drex v2.0 is built on Qwen3.6-35B-A3B, with approximately 3B active parameters and a Kev pointer head. Its card describes a default 16,384-token request limit, configurable up to 131,072. Reported memory is approximately 70 GB for bf16 weights or 37 GB for Q8_0. The card says each question is scored in a forward pass against the state; the exact sharing/parallelism depends on the runtime.

The card reports gains over Jev 1.13 on the public Decision Index, an eight-game arena, and an email task. Those are Nace-reported results, not measurements performed here, and not universal evidence of superiority. The weights use Nace.AI Open RAIL-M, not Apache-2.0; retain the actual license when considering deployment.

Assessment: a direct model alternative with local serving options and explicit runtime requirements. Treat v1.5 and v2.0 as separate checkpoints.

## Sources and local captures

- [Drex v1.5](https://huggingface.co/nace-ai/drex-v1.5) · [local capture](../sources/nace-ai/drex-v1.5.md)
- [Drex v2.0](https://huggingface.co/nace-ai/drex-v2.0) · [local capture](../sources/nace-ai/drex-v2.0.md)
- [Repository](https://github.com/nace-ai/drex-decision-models) · [local capture](../sources/nace-ai/README.md)
- [Wire format](https://github.com/nace-ai/drex-decision-models/blob/main/docs/request-format.md) · [local capture](../sources/nace-ai/docs/request-format.md)
- [License](https://github.com/nace-ai/drex-decision-models/blob/main/LICENSE) · [local capture](../sources/nace-ai/LICENSE)
