# Basal / rkinas

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Basal is an independently trained, self-hostable Jev-inspired model family aimed at Polish and English. The current inference engine is 2.1; text checkpoints are basal-2.0 (1.5B, 4.5B, 11B), alongside experimental basal-omni checkpoints. It exposes `POST /v1/systemone`, its `/v1/basal` alias, and `GET /v1/models`. The API document says responses validate against TypeSafe schemas, but also explicitly says the official SDK was not tested.

It extends the three core primitives with independent multi-label decisions (`multi`), cost-based action selection (`act`), tool selection (`tool`), and experimental 2.1 tasks: `classify`, `verify`, `compress`, and `extract`. Extraction copies document values and returns character offsets; compression selects source units rather than generating prose. Hardware/format paths include native GPU, FP8, GGUF, and MLX, depending on the checkpoint. Models and code are documented as Apache-2.0.

Important semantic difference: Basal documents `confidence` as the probability of the selected answer, whereas Jev applies a distribution-based transformation. Copying a numeric Jev threshold would change behavior. Media support depends on model and serving backend; the new 31B omni ultra supports text/images but not audio.

Assessment: one of the most relevant candidates for extending a portable decision interface, especially for Polish and local inference. Extension availability and reported benchmark gains remain provider claims; no models were installed or benchmarked here.

## Sources and local captures

- [Project](https://github.com/rkinas/basal) · [local capture](../sources/basal/README.md)
- [API](https://github.com/rkinas/basal/blob/main/docs/API.md) · [local capture](../sources/basal/docs/API.md)
- [Question types](https://github.com/rkinas/basal/blob/main/docs/QUESTION_TYPES.md) · [local capture](../sources/basal/docs/QUESTION_TYPES.md)
- [Tasks](https://github.com/rkinas/basal/blob/main/docs/TASKS.md) · [local capture](../sources/basal/docs/TASKS.md)
- [Results](https://github.com/rkinas/basal/blob/main/docs/RESULTS.md) · [local capture](../sources/basal/docs/RESULTS.md)
