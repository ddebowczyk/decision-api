# TypeSafe / Jev baseline

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Jev accepts shared `state` and a map of named, typed questions at `POST https://api.typesafe.ai/v1/systemone`. Choice returns a selected key and distribution; Noul returns probability of yes; Score returns an expected level, distribution, and confidence. Questions are evaluated independently. This is the baseline for compatibility comparisons.

The current models page lists `jev-1.13.0` and `jev-1.14.0` at $0.042 per million input tokens, with free output. Defaults are 64k tokens per request and 32k per question. The opt-in `TypeSafe-Danger-Zone-Long-Context: true` raises both to 262k, with documented latency and accuracy costs. `jev-latest` still selects 1.13; `jev-preview` selects 1.14. Do not resolve those names from version order alone.

The models table says text, while the Images and Box pages document experimental image support enabled with `TypeSafe-Danger-Zone-Images: true`. Box requires Jev 1.14 and returns normalized box edges. Preserve that maturity distinction: image support is not a stable baseline capability.

Choice/Score confidence is derived from the distribution, not a universally comparable accuracy estimate. Box, media, confidence formulas, limits, and aliases need explicit capability records.

## Sources and local captures

- [API](https://docs.typesafe.ai/api.md) · [local capture](../sources/typesafe/api.md)
- [Models](https://docs.typesafe.ai/models.md) · [local capture](../sources/typesafe/models.md)
- [Images](https://docs.typesafe.ai/images.md) · [local capture](../sources/typesafe/images.md)
- [Box](https://docs.typesafe.ai/primitives/box.md) · [local capture](../sources/typesafe/primitives/box.md)
- [Confidence](https://docs.typesafe.ai/confidence.md) · [local capture](../sources/typesafe/confidence.md)
