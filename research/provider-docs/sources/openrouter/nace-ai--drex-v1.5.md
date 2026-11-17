[Skip to content](https://openrouter.ai/nace-ai/drex-v1.5#skip)

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

![Favicon for nace-ai](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://nace.ai/&size=256)

# Nace.AI: Drex v1.5

[nace-ai](https://openrouter.ai/nace-ai)/drex-v1.5

[Model weights](https://huggingface.co/nace-ai/drex-v1.5)

[Compare](https://openrouter.ai/compare/nace-ai/drex-v1.5)API

Drex v1.5 is a 9B decision model from Nace.AI. Given a state (text or JSON) and typed questions (yes/no, multiple choice, or ordinal score), it returns a calibrated probability for every option in a single forward pass, with no text generation. It is TypeSafe System One compatible and suits routing, classification, and policy checks that need a scored answer instead of prose.

Open weights and runtime: [https://github.com/nace-ai/drex-decision-modelsOpens in new tab](https://github.com/nace-ai/drex-decision-models)

Modalities

In / Out Price

$0.04 / $0per 1M

Context

131K

Released

Oct 9, 2026

![Favicon for nace-ai](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://nace.ai/&size=256)

Nace.AI: Drex v1.5

[Compare](https://openrouter.ai/compare/nace-ai/drex-v1.5)API

[Playground](https://openrouter.ai/nace-ai/drex-v1.5#playground)[Providers](https://openrouter.ai/nace-ai/drex-v1.5#providers)[Pricing](https://openrouter.ai/nace-ai/drex-v1.5#pricing)[Performance](https://openrouter.ai/nace-ai/drex-v1.5#performance)[Uptime](https://openrouter.ai/nace-ai/drex-v1.5#uptime)[Apps](https://openrouter.ai/nace-ai/drex-v1.5#apps)[Activity](https://openrouter.ai/nace-ai/drex-v1.5#activity)[FAQ](https://openrouter.ai/nace-ai/drex-v1.5#faq)[Explore](https://openrouter.ai/nace-ai/drex-v1.5#explore)

Playground

## Playground

## Providers

This model is hosted by one provider. OpenRouter forwards every request to it directly — no routing decisions to make.

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

LatencyP50

| Provider | Input /M | Output /M | Latency | Uptime |
| --- | --- | --- | --- | --- |
| Favicon for DeepInfra DeepInfra | $0.04 | Free | 0.56s | 100.00% |

Latency

0.56s

P50, best provider

All locations

1 week

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

When an error occurs in an upstream provider, we can recover by routing to another healthy provider, if your request filters allow it. You can access per-provider uptime data programmatically through the [Endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints). Learn more about our [load balancing and provider routing options](https://openrouter.ai/docs/provider-routing).

1.

![Favicon for https://console.nace.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://console.nace.ai/&size=256)

[Drex](https://openrouter.ai/apps/url/https%3A%2F%2Fconsole.nace.ai%2F) 

new

3.91Btokens

2.

![Favicon for https://local.invalid/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://local.invalid/&size=256)

[PoShi-OpenClaw](https://openrouter.ai/apps/url/https%3A%2F%2Flocal.invalid%2F) 

new

23.3Mtokens

3.

![Favicon for https://github.com/KnowledgeDiscoveryAndWebMiningLab/CLIMBS-experimental](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.com/KnowledgeDiscoveryAndWebMiningLab/CLIMBS-experimental&size=256)

[CLIMBS-experimental](https://openrouter.ai/apps/url/https%3A%2F%2Fgithub.com%2FKnowledgeDiscoveryAndWebMiningLab%2FCLIMBS-experimental) 

new

19.9Mtokens

4.

![Favicon for https://github.com/CryptoCT01/jev-radar](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.com/CryptoCT01/jev-radar&size=256)

[jev-radar](https://openrouter.ai/apps/url/https%3A%2F%2Fgithub.com%2FCryptoCT01%2Fjev-radar) 

new

18.8Mtokens

5.

![Favicon for https://uschati.nof1experiment.com/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uschati.nof1experiment.com/&size=256)

[Personal Voice Assistant](https://openrouter.ai/apps/url/https%3A%2F%2Fuschati.nof1experiment.com%2F) 

new

8.2Mtokens

## Frequently asked questions

### What is Drex v1.5?

Drex v1.5 is a 9B decision model from Nace.AI. Given a state (text or JSON) and typed questions (yes/no, multiple choice, or ordinal score), it returns a calibrated probability for every option in a single forward pass, with no text generation. It is TypeSafe System One compatible and suits routing, classification, and policy checks that need a scored answer instead of prose.

### How much does Drex v1.5 cost?

Drex v1.5 costs $0.04/M input tokens and $0.00/M output tokens.

### What is the context length of Drex v1.5?

Drex v1.5 has a 131,072 token context window.

### What inputs and outputs does Drex v1.5 support?

Drex v1.5 accepts text as input and returns structured decisions.

### What other text models does Nace.AI have?

[Drex v2.0](https://openrouter.ai/nace-ai/drex-v2.0) is another text model from Nace.AI.

### When was Drex v1.5 released?

Drex v1.5 was released on October 9, 2026.

## More models from [Nace.AI](https://openrouter.ai/nace-ai)

[Drex v2.0

Drex v2.0 is a 35B mixture-of-experts decision model (3B active) from Nace.AI, the larger successor to Drex v1.5. Given a state (text or JSON) and typed questions (yes/no, multiple choice, or ordinal score), it returns a calibrated probability for every option in a single forward pass, with no text generation. It is TypeSafe System One compatible and suits routing, classification, and policy checks that need a scored answer instead of prose.

Decisions$0.06 / $0](https://openrouter.ai/nace-ai/drex-v2.0)
