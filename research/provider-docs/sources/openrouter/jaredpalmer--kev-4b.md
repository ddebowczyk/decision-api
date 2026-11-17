[Skip to content](https://openrouter.ai/jaredpalmer/kev-4b#skip)

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

![Favicon for jaredpalmer](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://jaredpalmer.com/&size=256)

# Jared Palmer: Kev 4B

[jaredpalmer](https://openrouter.ai/jaredpalmer)/kev-4b

[Model weights](https://huggingface.co/jaredpalmer/kev-4b)

[Compare](https://openrouter.ai/compare/jaredpalmer/kev-4b)API

Kev 4B is a small open-weight decision model from Jared Palmer, built as a LoRA adapter and pointer head on Qwen3.5-4B-Base and served over the same /v1/systemone contract as TypeSafe's Jev. Send a state and typed questions (yes/no, multiple choice, or score) and it returns a calibrated probability per question in one forward pass, with no generated text. It is the recommended checkpoint in the Kev family (0.8B, 4B, 9B) and is suited for routing, classification, and policy checks that want a compact, Apache-2.0 alternative to Jev.

Code, model cards, and eval suites: [https://github.com/jaredpalmer/kevOpens in new tab](https://github.com/jaredpalmer/kev)

Modalities

In / Out Price

$0.042 / $0per 1M

Context

8K

Released

Sep 25, 2026

![Favicon for jaredpalmer](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://jaredpalmer.com/&size=256)

Jared Palmer: Kev 4B

[Compare](https://openrouter.ai/compare/jaredpalmer/kev-4b)API

[Playground](https://openrouter.ai/jaredpalmer/kev-4b#playground)[Providers](https://openrouter.ai/jaredpalmer/kev-4b#providers)[Pricing](https://openrouter.ai/jaredpalmer/kev-4b#pricing)[Performance](https://openrouter.ai/jaredpalmer/kev-4b#performance)[Uptime](https://openrouter.ai/jaredpalmer/kev-4b#uptime)[Apps](https://openrouter.ai/jaredpalmer/kev-4b#apps)[Activity](https://openrouter.ai/jaredpalmer/kev-4b#activity)[FAQ](https://openrouter.ai/jaredpalmer/kev-4b#faq)[Explore](https://openrouter.ai/jaredpalmer/kev-4b#explore)

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

## Explore more models

[Decision Model RankingsRanking](https://openrouter.ai/rankings/decisions)

Standard

LatencyP50

| Provider | Input /M | Output /M | Latency | Uptime |
| --- | --- | --- | --- | --- |
| Favicon for Phala Phala | $0.042 | Free | 0.21s | 98.09% |
| Favicon for SiliconFlow SiliconFlow | $0.042 | Free | 0.55s | 98.96% |

Latency

0.21s

P50, best provider

All locations

Latency / throughputP501 week

Uptime (3d)The model was reachable. Request routed to a provider.

100.00%

Availability (3d)The model returned inference from any provider. Errors and empty responses count against it.

99.82%

### Availability over the last 3 days

Last 72 hours

Availability 99.82%

3 Days Ago2 Days AgoYesterdayNow

### Availability over the last 24 hours

OpenRouter Availability

99.66%

Without Routing

99.61%

When an error occurs in an upstream provider, we can recover by routing to another healthy provider, if your request filters allow it. You can access per-provider uptime data programmatically through the [Endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints). Learn more about our [load balancing and provider routing options](https://openrouter.ai/docs/provider-routing).

1.

![Favicon for https://stylome.io/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://stylome.io/&size=256)

[Stylome](https://openrouter.ai/apps/url/https%3A%2F%2Fstylome.io%2F) 

new

81.9Mtokens

2.

![Favicon for https://hermes.local/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hermes.local/&size=256)

[Hermes Agent](https://openrouter.ai/apps/url/https%3A%2F%2Fhermes.local%2F) 

new

54.3Mtokens

3.

![Favicon for https://github.com/eljanmahammadli](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.com/eljanmahammadli&size=256)

[turkic-decide](https://openrouter.ai/apps/url/https%3A%2F%2Fgithub.com%2Feljanmahammadli) 

new

50.4Mtokens

4.

![Favicon for https://fitbodyscience.com/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://fitbodyscience.com/&size=256)

[fitbodyscience](https://openrouter.ai/apps/url/https%3A%2F%2Ffitbodyscience.com%2F) 

new

34.5Mtokens

5.

![Favicon for https://orbio.so/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://orbio.so/&size=256)

[Orbio](https://openrouter.ai/apps/url/https%3A%2F%2Forbio.so%2F) 

new

25.6Mtokens

## Frequently asked questions

### What is Kev 4B?

Kev 4B is a small open-weight decision model from Jared Palmer, built as a LoRA adapter and pointer head on Qwen3.5-4B-Base and served over the same /v1/systemone contract as TypeSafe's Jev. Send a state and typed questions (yes/no, multiple choice, or score) and it returns a calibrated probability per question in one forward pass, with no generated text.

### How much does Kev 4B cost?

Kev 4B costs $0.042/M input tokens and $0.00/M output tokens.

### What is the context length of Kev 4B?

Kev 4B has a 8,192 token context window. It supports up to 8,192 completion tokens.

### What inputs and outputs does Kev 4B support?

Kev 4B accepts text as input and returns structured decisions.

### Which providers serve Kev 4B?

Kev 4B is served by 2 providers on OpenRouter: Phala and SiliconFlow. Requests are routed to the best available provider, with automatic failover to the others, and you can pin or exclude providers with [provider routing](https://openrouter.ai/docs/features/provider-routing).

### When was Kev 4B released?

Kev 4B was released on September 25, 2026.

Filter quantization
