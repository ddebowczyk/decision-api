# Liquid AI / d1 family

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Liquid serves `d1` and `d1-ultra` through `POST https://api.liquid.ai/decisions/v1/systemone`. Both use Jev-like state and named Noul/Choice/Score questions, with a top-level `images` extension. The docs show TypeSafe SDK use for text and raw HTTP for images. They show an SDK base URL of `https://api.liquid.ai` despite the longer raw route; this research did not verify SDK routing compatibility.

The main billing difference is explicit: every question is billed as its own prompt, including all supplied images. Sharing a JSON request is not proof of shared-state billing. The d1-ultra announcement quotes $0.042/M input and free output, and reports greater accuracy/calibration than Jev 1.14. Those are Liquid's benchmark claims, not an independent validation.

Additional current docs expose open-weight alternatives beyond the supplied list: `d1-3B` for text/images and `d1-omni-600M` for text with images or audio. Their licenses, hardware limits, and serving instructions must be read independently from the hosted d1/d1-ultra contract; a shared brand does not imply identical deployment capabilities.

Assessment: a relevant multimodal hosted candidate plus smaller local models. Compare cost using actual billed input across questions, not only the advertised per-token rate.

## Sources and local captures

- [Model overview](https://docs.liquid.ai/lfm/models/decision-models.md) · [local capture](../sources/liquid/docs/lfm/models/decision-models.md)
- [Hosted API](https://docs.liquid.ai/lfm/models/d1.md) · [local capture](../sources/liquid/docs/lfm/models/d1.md)
- [Ultra launch](https://www.liquid.ai/blog/d1-ultra) · [local capture](../sources/liquid/d1-ultra-launch.md)
- [d1-3B](https://docs.liquid.ai/lfm/models/d1-3b.md) · [local capture](../sources/liquid/docs/lfm/models/d1-3b.md)
- [Omni 600M](https://docs.liquid.ai/lfm/models/d1-omni-600m.md) · [local capture](../sources/liquid/docs/lfm/models/d1-omni-600m.md)
