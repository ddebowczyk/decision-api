[Skip to content](https://openrouter.ai/togethercomputer/tev1-4b-experimental#skip)

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

![Favicon for togethercomputer](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.together.ai/&size=256)

# Together: Tev1 4B Experimental

[togethercomputer](https://openrouter.ai/togethercomputer)/tev1-4b-experimental

[Model weights](https://huggingface.co/togethercomputer/Tev1-4B-experimental)

[Compare](https://openrouter.ai/compare/togethercomputer/tev1-4b-experimental)API

Tev1 4B Experimental is an experimental decision model from Together AI, a supervised fine-tune of Qwen3.5-4B trained to choose one option from a structured state, question, and list of 2-24 labeled options. It keeps Qwen's standard next-token head, so it is served through the regular chat completions API rather than a dedicated decisions runtime.

Send a system instruction followed by a JSON decision containing `state`, `question`, and `options`. The model returns a single option letter, which application code maps back to the option key. Recommended settings are `temperature: 0`, `max_tokens: 8`, and thinking disabled. It is intended for routing, classification, and policy checks, not generic chat. Together publishes the full data recipe and training code so teams can fine-tune their own variant.

Modalities

In / Out Price

$0.042 / $0per 1M

Context

33K

Released

Sep 30, 2026

![Favicon for togethercomputer](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.together.ai/&size=256)

Together: Tev1 4B Experimental

[Compare](https://openrouter.ai/compare/togethercomputer/tev1-4b-experimental)API

[Playground](https://openrouter.ai/togethercomputer/tev1-4b-experimental#playground)[Providers](https://openrouter.ai/togethercomputer/tev1-4b-experimental#providers)[Pricing](https://openrouter.ai/togethercomputer/tev1-4b-experimental#pricing)[Performance](https://openrouter.ai/togethercomputer/tev1-4b-experimental#performance)[Uptime](https://openrouter.ai/togethercomputer/tev1-4b-experimental#uptime)[Apps](https://openrouter.ai/togethercomputer/tev1-4b-experimental#apps)[Activity](https://openrouter.ai/togethercomputer/tev1-4b-experimental#activity)[FAQ](https://openrouter.ai/togethercomputer/tev1-4b-experimental#faq)[Explore](https://openrouter.ai/togethercomputer/tev1-4b-experimental#explore)

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
| Favicon for Together Together | $0.042 | Free | 0.14s | 89.94% |

Latency

0.14s

P50, best provider

All locations

1 week

Uptime (3d)The model was reachable. Request routed to a provider.

100.00%

Availability (3d)The model returned inference from any provider. Errors and empty responses count against it.

96.47%

### Availability over the last 3 days

Last 72 hours

Availability 96.47%

3 Days Ago2 Days AgoYesterdayNow

### Availability over the last 24 hours

OpenRouter Availability

99.91%

When an error occurs in an upstream provider, we can recover by routing to another healthy provider, if your request filters allow it. You can access per-provider uptime data programmatically through the [Endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints). Learn more about our [load balancing and provider routing options](https://openrouter.ai/docs/provider-routing).

1.

![Favicon for https://medquality-optimization.local/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://medquality-optimization.local/&size=256)

[medquality-decision-eval](https://openrouter.ai/apps/url/https%3A%2F%2Fmedquality-optimization.local%2F) 

new

66.5Mtokens

2.

![Favicon for https://github.com/eljanmahammadli](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.com/eljanmahammadli&size=256)

[turkic-decide](https://openrouter.ai/apps/url/https%3A%2F%2Fgithub.com%2Feljanmahammadli) 

new

35.8Mtokens

3.

![Favicon for https://github.com/Beast-Industries/vyro-data-pipelines-python](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.com/Beast-Industries/vyro-data-pipelines-python&size=256)

[clip-compliance-engine](https://openrouter.ai/apps/url/https%3A%2F%2Fgithub.com%2FBeast-Industries%2Fvyro-data-pipelines-python) 

new

10.1Mtokens

4.

![Favicon for https://uschati.nof1experiment.com/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uschati.nof1experiment.com/&size=256)

[Personal Voice Assistant](https://openrouter.ai/apps/url/https%3A%2F%2Fuschati.nof1experiment.com%2F) 

new

9.3Mtokens

5.

![Favicon for https://decisionapi.net/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://decisionapi.net/&size=256)

[DecisionsApi](https://openrouter.ai/apps/url/https%3A%2F%2Fdecisionapi.net%2F) 

new

8.9Mtokens

## Frequently asked questions

### What is Tev1 4B Experimental?

Tev1 4B Experimental is an experimental decision model from Together AI, a supervised fine-tune of Qwen3.5-4B trained to choose one option from a structured state, question, and list of 2-24 labeled options. It keeps Qwen's standard next-token head, so it is served through the regular chat completions API rather than a dedicated decisions runtime.

### How much does Tev1 4B Experimental cost?

Tev1 4B Experimental costs $0.042/M input tokens and $0.00/M output tokens.

### What is the context length of Tev1 4B Experimental?

Tev1 4B Experimental has a 32,768 token context window. It supports up to 8 completion tokens.

### What inputs and outputs does Tev1 4B Experimental support?

Tev1 4B Experimental accepts text as input and returns structured decisions.

### When was Tev1 4B Experimental released?

Tev1 4B Experimental was released on September 30, 2026.

## More models from [Together](https://openrouter.ai/togethercomputer)

[StripedHyena Nous 7B

This is the chat model variant of the StripedHyena series developed by Together in collaboration with Nous Research.

StripedHyena uses a new architecture that competes with traditional Transformers, particularly in long-context data processing. It combines attention mechanisms with gated convolutions for improved speed, efficiency, and scaling. This model marks a significant advancement in AI architecture for sequence modeling tasks.

Text33K context](https://openrouter.ai/togethercomputer/stripedhyena-nous-7b)

[StripedHyena Hessian 7B

This is the base model variant of the StripedHyena series, developed by Together.

StripedHyena uses a new architecture that competes with traditional Transformers, particularly in long-context data processing. It combines attention mechanisms with gated convolutions for improved speed, efficiency, and scaling. This model marks an advancement in AI architecture for sequence modeling tasks.

Text33K context](https://openrouter.ai/togethercomputer/stripedhyena-hessian-7b)

Previous slideNext slide
