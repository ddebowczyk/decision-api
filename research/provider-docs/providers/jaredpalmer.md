# Jared Palmer / Kev

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Kev is a public, Apache-2.0 decision-model project supporting local inference and fine-tuning. The API matches TypeSafe's System One core at `POST /v1/systemone`, with `GET /v1/models` and additional permutation/separate-question diagnostic routes. Models span 0.8B, 4B, 9B, and 27B; the requested Kev 4B also has an OpenRouter listing.

The current README distinguishes accepted input from validated accuracy: the smaller models have an 8,192-token validated context, while the server can accept substantially longer states. The 27B model is validated to 65,536. Beyond-training-length behavior and calibration have their own measurements. CUDA and Apple Silicon/MLX support vary by model; some hardware claims are explicitly expectations rather than measurements.

Kev documents the distribution-derived confidence formulas and calibration temperature, making its semantics more inspectable than a generic generated-label model. The README also separates trained-source and transfer results and notes that published fp32 evaluation differs from bf16 GPU serving.

Assessment: an especially useful reference implementation for a local Jev-compatible core and provider testing. Do not assume a hosted Kev 4B listing provides all diagnostic routes, local limits, or the same numerical precision.

## Sources and local captures

- [Project and API](https://github.com/jaredpalmer/kev) · [local capture](../sources/jaredpalmer/README.md)
- [4B model card](https://github.com/jaredpalmer/kev/blob/main/docs/model-cards/kev-4b.md) · [local capture](../sources/jaredpalmer/docs/model-cards/kev-4b.md)
- [27B model card](https://github.com/jaredpalmer/kev/blob/main/docs/model-cards/kev-27b.md) · [local capture](../sources/jaredpalmer/docs/model-cards/kev-27b.md)
- [Requested router model](https://openrouter.ai/jaredpalmer/kev-4b) · [local capture](../sources/openrouter/jaredpalmer--kev-4b.md)
