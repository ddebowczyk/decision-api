# Decision-model provider documentation

Researched on **2026-10-17**. This collection covers all four supplied URLs, all twenty supplied model entries, and newer related models discovered in current provider docs. It contains public documentation snapshots and research notes; **no authenticated inference, SDK interoperability test, or independent model benchmark was run**.

Start with [the comparison](comparison.md), then the individual provider notes below. [Ranking verification](ranking-check.md) distinguishes independently observed usage figures from the supplied figures. [models.json](models.json) maps all twenty requested entries to their model listing and provider note.

## Providers

Added 2026-11-03: [Levanto Sage SystemOne sources and integration verification](sources/levanto/README.md).
This later addition includes authenticated inference checks, unlike the original research capture above.

| Provider | Captured scope | Research note |
| --- | --- | --- |
| TypeSafe | Jev 1.13/1.14 baseline; all Markdown pages in the current documentation index, SDK references, cookbooks, experimental Images/Box | [TypeSafe](providers/typesafe.md) |
| Basal | 2.1 engine, 2.0 text models, omni models, API, serving, calibration, tasks, formats and hardware | [Basal](providers/basal.md) |
| classifier.dev | TypeSafe-compatible endpoint, classification API, OpenAPI, pricing, auth, MCP and benchmark | [classifier.dev](providers/classifier-dev.md) |
| Perplexity | Requested V1.1 card; current V1.2/Flash API, alias behavior and cookbooks | [Decider](providers/perplexity.md) |
| Nace.AI | Drex v1.5/v2.0 cards, repository, wire format, context and license | [Drex](providers/nace-ai.md) |
| OpenAI | GPT-6 Luna Decisions guide and API reference | [OpenAI](providers/openai.md) |
| Microsoft | Decision-1 launch, Foundry deployment/calling guide and Labs page | [Microsoft](providers/microsoft.md) |
| Inception | Mercury Decide guide, API reference, model/pricing and limits | [Mercury Decide](providers/inception.md) |
| Cloudflare | Clef, Flash and Omni hosted docs, model cards, launch and pricing | [Clef](providers/cloudflare.md) |
| Liquid AI | d1/d1-ultra API, guides and launches; open-weight d1-3B and d1-omni-600M docs | [Liquid](providers/liquid.md) |
| Jared Palmer | Kev repository/API and linked model cards/releases | [Kev](providers/jaredpalmer.md) |
| Upstage | Solar Decide beta model documentation | [Solar Decide](providers/upstage.md) |
| Respan | Span-01/Lite concept, quickstart, HTTP reference; Span-02 follow-up docs | [Respan](providers/respan.md) |
| ScaleDown | Classify-1 Jev-shaped Decisions API and classification docs | [ScaleDown](providers/scaledown.md) |
| Together AI | Tev1 model card, native API, training and dataset recipe | [Tev1](providers/together.md) |

The supplied [Flavio Copes Jev tutorial](https://flaviocopes.com/jev/) is captured as a [secondary tutorial](sources/references/flavio-jev.md). It is context for learning Jev, not another provider or the authority for current model limits.

## Evidence and capture policy

- [Source index](source-index.md): links to every captured document and its original URL.
- [manifest.json](manifest.json): retrieval timestamps, original/final URLs, response types, sizes, SHA-256 hashes, and failed attempts. It describes the current saved files, not every historical download.
- [sources/](sources/): native Markdown/MDX, JSON and text where available; otherwise HTML converted to Markdown. Native documentation may contain JSX, Mermaid or site-relative links. Resolve original relative links against the original source URL in the manifest. HTML conversions may retain navigation or duplicated streamed sections; they are not pixel-exact archives.
- Failed probes are preserved in the manifest, including wrong paths and Markdown content negotiation failures recovered through HTML. A failed probe does not itself mean a provider/model is unavailable.
- All twenty OpenRouter model pages were captured. The generic `/api/v1/models` snapshot does not enumerate these decision models in this capture, so it was not used as negative evidence of model existence.
- The public captured ranking exposes ten rows. Counts and positions 11–20 remain user-supplied, even though their model documentation was independently captured. OpenRouter ranking data is attributed to OpenRouter under CC BY 4.0.
- Provider benchmark, latency, calibration, privacy and licensing statements are attributed documentation claims. “Compatible” below means documented payload compatibility, not verified interchangeability or equal statistical behavior. Original source content remains attributable to its publishers.

## Practical assessment

For a Jev-like common core, study TypeSafe, Kev, Drex, and the core APIs of Basal, Liquid, Mercury, Perplexity, Solar Decide, Clef and ScaleDown. Keep provider extensions and deployment transport explicit. classifier.dev is a managed orchestration option over existing models. OpenAI needs native schema translation; Span-01 needs lossless ternary behavior results; Tev1's native generated-label interface needs a different adapter and confidence provenance.

The strongest documented interface extensions in this capture are Basal's task/evidence features, Cloudflare's media support, Respan's explicit unknown outcome and Span-02 deadline reasoning, and managed batching/long-document workflows at classifier.dev. These are candidates for evaluation, not claims that any provider universally beats Jev.
