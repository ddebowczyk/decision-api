# Cloudflare / Clef family

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Clef (27B), Clef-flash (9B), and Clef-omni are documented decision models on Workers AI, with public model cards. Cloudflare describes Jev-compatible typed questions and Apache-2.0 open weights. The hosted route is `POST /client/v4/accounts/{account_id}/ai/run/@cf/cloudflare/{model}`; Workers bindings use `env.AI.run`. Account routing, authentication, and any platform response envelope still need adaptation.

Clef and Flash handle text/JSON/images; Omni adds audio and video. The current Flash page lists a 24,576-token hosted window and $0.038/M input tokens. This differs from older launch descriptions; retain the specific host and date when recording capacity or price. Current model pages and pricing take precedence over older tutorial tables.

Important input behavior: model pages explicitly document truncation of long text state to fit the remaining context after media/questions. A client cannot assume every supplied document token was evaluated. The hosted pages also specify media-count, byte, pixel, and request-size constraints. These differ from local-runtime and router contracts.

Assessment: relevant for open-weight multimodal decisions and Workers deployment. Cloudflare's claims of better speed/quality than Jev are vendor benchmarks; use a representative workload before selecting a model or reusing thresholds.

## Sources and local captures

- [Launch](https://blog.cloudflare.com/clef-decision-models/) · [local capture](../sources/cloudflare/launch.md)
- [Clef](https://developers.cloudflare.com/ai/models/@cf/cloudflare/clef/) · [local capture](../sources/cloudflare/clef.md)
- [Flash](https://developers.cloudflare.com/ai/models/@cf/cloudflare/clef-flash/) · [local capture](../sources/cloudflare/clef-flash.md)
- [Omni](https://developers.cloudflare.com/ai/models/@cf/cloudflare/clef-omni/) · [local capture](../sources/cloudflare/clef-omni.md)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [local capture](../sources/cloudflare/pricing.md)
