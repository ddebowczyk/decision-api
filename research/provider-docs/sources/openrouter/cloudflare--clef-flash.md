[Skip to content](https://openrouter.ai/cloudflare/clef-flash#skip)

[![OpenRouter](/brand/v2/nav-lockup-sprite.png)](https://openrouter.ai/)

Alpha

Search`⌘``K`

[Dashboard](https://openrouter.ai/workspaces/default)

[Models](https://openrouter.ai/models)[Benchmarks](https://openrouter.ai/benchmarks)[Chat](https://openrouter.ai/chat)[Chat](https://openrouter.ai/chat)[Rankings](https://openrouter.ai/rankings)[Apps](https://openrouter.ai/apps)[Ori](https://openrouter.ai/ori)[Pricing](https://openrouter.ai/pricing)[Docs](https://openrouter.ai/docs/quickstart)

* [Models](https://openrouter.ai/models)
* [Rankings](https://openrouter.ai/rankings)
* [Ori](https://openrouter.ai/ori)
[Benchmarks](https://openrouter.ai/benchmarks)[Chat](https://openrouter.ai/chat)[Chat](https://openrouter.ai/chat)[Pricing](https://openrouter.ai/pricing)[Docs](https://openrouter.ai/docs/quickstart)

Sign Up

Sign Up

ElevenLabs launch offer: every ElevenLabs model is 50% off through October 19, 2026. [See ElevenLabs models](https://openrouter.ai/elevenlabs)

Dismiss

## Footer

[![OpenRouter](/brand/v2/openrouter-dark.svg)![OpenRouter](/brand/v2/openrouter-light.svg)](https://openrouter.ai/)

© 2026 OpenRouter, Inc

### Product

* [Chat](https://openrouter.ai/chat)
* [Rankings](https://openrouter.ai/rankings)
* [Benchmarks](https://openrouter.ai/benchmarks)
* [Apps](https://openrouter.ai/apps)
* [Discover](https://openrouter.ai/discover)
* [Models](https://openrouter.ai/models)
* [Ori](https://openrouter.ai/ori)
* [Collections](https://openrouter.ai/collections)
* [Providers](https://openrouter.ai/providers)
* [Tools](https://openrouter.ai/tools)
* [Pricing](https://openrouter.ai/pricing)
* [Business](https://openrouter.ai/business)
* [EU routing](https://openrouter.ai/business/eu)
* [Enterprise](https://openrouter.ai/enterprise)
* [Labs](https://openrouter.ai/labs)

### Company

* [About](https://openrouter.ai/about)
* [Blog](https://openrouter.ai/blog)
* [Careers

  Hiring](https://openrouter.ai/careers)
* [Privacy](https://openrouter.ai/privacy)
* [Terms of Service](https://openrouter.ai/terms)
* [Trust Center](https://trust.openrouter.ai/)
* [Support](https://openrouter.ai/support)
* [Works With OR](https://openrouter.ai/works-with-openrouter)
* [Data](https://openrouter.ai/data)
* [Brand](https://openrouter.ai/brand)

### Developer

* [Documentation](https://openrouter.ai/docs)
* [API Reference](https://openrouter.ai/docs/api_reference/overview)
* [Developer Platform](https://openrouter.ai/developers)
* [Status](https://status.openrouter.ai)
* [AI Site Map](https://openrouter.ai/for-ai)

### Connect

* [Discord](https://discord.gg/fVyRaUDgxW)
* [GitHub](https://github.com/OpenRouterTeam)
* [LinkedIn](https://www.linkedin.com/company/104068329)
* [X](https://twitter.com/openrouter)
* [YouTube](https://www.youtube.com/@OpenRouterAI)

Sign Up

Sign Up

![Favicon for cloudflare](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.cloudflare.com/&size=256)

# Cloudflare: Clef Flash

[cloudflare](https://openrouter.ai/cloudflare)/clef-flash

[Model weights](https://huggingface.co/Cloudflare/clef-flash)

[Compare](https://openrouter.ai/compare/cloudflare/clef-flash)API

Clef-flash is the fast 9B member of Cloudflare's open-source Clef decision model family, a fine-tune of Qwen3.5-9B served on Workers AI. It turns a state (text or structured JSON) plus a schema of typed questions into decisions, returning a calibrated probability for every allowed option of every question in a single forward pass instead of generating tokens. Use it for low-latency classification, routing, scoring, and guardrails through the Decisions API. Note: Workers AI currently truncates long text state to roughly the first 2K tokens, so content beyond that is not read; images are counted separately.

Modalities

In / Out Price

$0.021 / $0per 1M

Context

25K

Released

Oct 1, 2026

![Favicon for cloudflare](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.cloudflare.com/&size=256)

Cloudflare: Clef Flash

[Compare](https://openrouter.ai/compare/cloudflare/clef-flash)API

[Playground](https://openrouter.ai/cloudflare/clef-flash#playground)[Providers](https://openrouter.ai/cloudflare/clef-flash#providers)[Pricing](https://openrouter.ai/cloudflare/clef-flash#pricing)[Performance](https://openrouter.ai/cloudflare/clef-flash#performance)[Uptime](https://openrouter.ai/cloudflare/clef-flash#uptime)[Apps](https://openrouter.ai/cloudflare/clef-flash#apps)[Activity](https://openrouter.ai/cloudflare/clef-flash#activity)[Documentation](https://openrouter.ai/cloudflare/clef-flash#documentation)[FAQ](https://openrouter.ai/cloudflare/clef-flash#faq)[Explore](https://openrouter.ai/cloudflare/clef-flash#explore)

Playground

## Playground

## Providers

Different companies host the same model. OpenRouter routes your request to one of them based on the routing mode you pick — Balanced (price + speed), Nitro (fastest), or Floor (cheapest).

## Pricing

The average price customers actually pay for this model, next to the prices providers post. Caching and discounts mean the price actually paid is often well below the listed one.

## Performance

Throughput is how fast the model writes (tokens per second — higher is better). Latency is total round-trip time (lower is better). TTFT is time-to-first-token — how long before you see anything appear (lower is better).

## Uptime

Uptime is the percentage of the past 3 days that at least one provider was responding to requests. Availability is the percentage of time that inference was successfully served. OpenRouter continuously monitors and uses the next-best provider when one returns an error.

## Apps

Public apps that send the most traffic to this model. Good signal for what real production workloads look like — and a hint at which use cases this model is best suited for.

## Activity

Token volume and request traffic to this model over time.

## API

Drop-in code to call this model. It runs on the OpenRouter Decisions API rather than the OpenAI-compatible chat endpoint, so the request and response shapes below are specific to structured decisions — chat completions SDKs will not work with it.

Not currently available through EU in-region routing. [In-region routing docs](https://openrouter.ai/docs/guides/features/in-region-routing)

## Documentation

Guides, cookbooks, blog posts, and tools for building with Cloudflare: Clef Flash on OpenRouter.

* [Multimodal DecisionsGuide](https://openrouter.ai/docs/guides/community/multimodal-decisions)

## Explore more models

[AI Models with Vision: Multimodal LLMs for Image UnderstandingCollection](https://openrouter.ai/collections/vision-models)[Decision Model RankingsRanking](https://openrouter.ai/rankings/decisions)

Standard

LatencyP50

| Provider | Input /M | Output /M | Latency | Uptime |
| --- | --- | --- | --- | --- |
| Favicon for PrimeIntellect Prime Intellect | $0.021 | Free | 0.24s | 100.00% |
| Favicon for DeepInfra DeepInfra | $0.038 | Free | 0.25s | 100.00% |
| Favicon for Cloudflare Cloudflare | $0.038 | Free | 0.49s | 100.00% |

Latency

0.24s

P50, best provider

All locations

Latency / throughputP501 week

Uptime (3d)The model was reachable. Request routed to a provider.

100.00%

Availability (3d)The model returned inference from any provider. Errors and empty responses count against it.

99.99%

### Availability over the last 3 days

Last 72 hours

Availability 99.99%

3 Days Ago2 Days AgoYesterdayNow

### Availability over the last 24 hours

OpenRouter Availability

99.99%

Without Routing

98.97%

When an error occurs in an upstream provider, we can recover by routing to another healthy provider, if your request filters allow it. You can access per-provider uptime data programmatically through the [Endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints). Learn more about our [load balancing and provider routing options](https://openrouter.ai/docs/provider-routing).

1.

![Favicon for https://fliki.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://fliki.ai/&size=256)

[Fliki](https://openrouter.ai/apps/url/https%3A%2F%2Ffliki.ai%2F) 

new

27.2Btokens

2.

![Favicon for https://pixfy.ru/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pixfy.ru/&size=256)

[PixFy search query translation](https://openrouter.ai/apps/url/https%3A%2F%2Fpixfy.ru%2F) 

new

423Mtokens

3.

![Favicon for https://pelayar.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pelayar.ai/&size=256)

[Pelayar Agent](https://openrouter.ai/apps/url/https%3A%2F%2Fpelayar.ai%2F) 

new

168Mtokens

4.

![Favicon for https://portkey.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://portkey.ai/&size=256)

[Portkey AI](https://openrouter.ai/apps/portkey-ai) 

Control panel for AI apps

136Mtokens

5.

![Favicon for https://springprompt.com/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://springprompt.com/&size=256)

[Spring Prompt benchmarks](https://openrouter.ai/apps/url/https%3A%2F%2Fspringprompt.com%2F) 

new

117Mtokens

## Frequently asked questions

### What is Clef Flash?

Clef-flash is the fast 9B member of Cloudflare's open-source Clef decision model family, a fine-tune of Qwen3.5-9B served on Workers AI. It turns a state (text or structured JSON) plus a schema of typed questions into decisions, returning a calibrated probability for every allowed option of every question in a single forward pass instead of generating tokens.

### Where is the Clef Flash documentation?

The Clef Flash documentation on OpenRouter includes the [Multimodal Decisions](https://openrouter.ai/docs/guides/community/multimodal-decisions) guide. The [quickstart](https://openrouter.ai/docs/quickstart) covers API keys and your first request, and the [API reference](https://openrouter.ai/docs/api-reference/overview) lists every parameter.

### How much does Clef Flash cost?

Clef Flash costs $0.021/M input tokens and $0.00/M output tokens.

### What is the context length of Clef Flash?

Clef Flash has a 24,576 token context window.

### What inputs and outputs does Clef Flash support?

Clef Flash accepts text and images as input and returns structured decisions.

### Which providers serve Clef Flash?

Clef Flash is served by 3 providers on OpenRouter: Prime Intellect, DeepInfra, and Cloudflare. Requests are routed to the best available provider, with automatic failover to the others, and you can pin or exclude providers with [provider routing](https://openrouter.ai/docs/features/provider-routing).

### When was Clef Flash released?

Clef Flash was released on October 1, 2026.

## More models from [Cloudflare](https://openrouter.ai/cloudflare)

[Clef Omni

Clef Omni is the mixture-of-experts member of Cloudflare's open-source Clef decision model family, a fine-tune of Qwen3-Omni-30B-A3B (30B total, 3B active parameters) served on Workers AI. It turns a state plus a schema of typed questions into decisions, returning a calibrated probability for every allowed option of every question in a single forward pass instead of generating tokens. Use it for classification, routing, scoring, and guardrails over text, JSON, images, audio, and video through the Decisions API.

Decisions$0.15 / $0](https://openrouter.ai/cloudflare/clef-omni)

[Clef

Clef is Cloudflare's open-source 27B multimodal decision model, a fine-tune of Qwen3.8-27B served on Workers AI. It turns a state (text or structured JSON) plus a schema of typed questions into decisions, returning a calibrated probability for every allowed option of every question in a single forward pass instead of generating tokens. Use it for classification, routing, scoring, guardrails, and agentic control flow through the Decisions API. Note: Workers AI currently truncates long text state to roughly the first 2K tokens, so content beyond that is not read; images are counted separately.

Decisions$0.042 / $0](https://openrouter.ai/cloudflare/clef)

Previous slideNext slide

Filter quantization
