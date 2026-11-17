Copy Markdown

[Models](https://console.upstage.ai/docs/models)

Solar Decide

Beta

Return typed decisions with calibrated probabilities

IntelligenceHigher

SpeedFast

Price

$0.1/1M tokensInput Token

Price

FreeOutput Token

Price

$0.1/1M tokensCached Token

Solar Decide is Upstage's structured decision model, served as a System One endpoint on Solar Mini 4. Send a state along with typed questions, and it returns a choice, a score, or a yes/no answer, each with a calibrated probability taken directly from the model rather than written out as text. Because it generates no prose, each decision takes a single forward pass and output tokens are free. With a 512K context window, an entire document can serve as the state. Solar Decide uses the same /v1/systemone schema as Jev, bringing Solar Mini 4's strong Korean understanding to routing, classification, and policy checks.

512K context length

One forward pass per decision

Calibrated probabilities, not text

Available Platforms

Upstage Console

Versions

solar-decide

Beta

Released on 2026-09-22

Upstage's structured decision model, served as a System One endpoint on Solar Mini 4. Returns a choice, a score, or a yes/no answer with a calibrated probability, without generating prose. 

* Available platforms: Upstage Console

API privacy

Data not collectedUpstage does not collect any data from this API

1. API input data is not used for model training.
2. API input data is not stored, unless required for service delivery and explicitly stated.
