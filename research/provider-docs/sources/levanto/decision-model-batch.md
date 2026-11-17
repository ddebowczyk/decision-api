> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Batch requests

> Many decisions in one call.

Each item in `requests` is a group: one `content` and the `questions` about it. Add groups for different content. Top-level [`reasoning`](https://docs.levanto.ai/decision-model/reasoning) applies to every question; [`grounding`](https://docs.levanto.ai/decision-model/grounding) goes on each question.

Batching saves round trips, not tokens: each question reads its content.

## Request

```json theme={"theme":"github-light"}
{
  "reasoning": "auto",
  "requests": [
    {
      "content": "User post: 'Selling verified Instagram accounts, DM for bulk pricing.'",
      "questions": [
        {"id": "policy_violation", "kind": "yesno", "instructions": "Does this post violate marketplace policy?"},
        {
          "id": "harm_level",
          "kind": "scale",
          "instructions": "How harmful is this content to the platform?",
          "levels": [
            {"level": 0, "description": "No meaningful harm — safe to leave published"},
            {"level": 1, "description": "Low harm — minor policy edge case"},
            {"level": 2, "description": "Moderate harm — misleading or low-grade abuse"},
            {"level": 3, "description": "High harm — fraud, spam, or user safety risk"},
            {"level": 4, "description": "Severe harm — active scam or imminent user damage"}
          ]
        }
      ]
    }
  ]
}
```

```json theme={"theme":"github-light"}
{
  "requests": [
    {"content": "doc A", "questions": [{"id": "a1", "kind": "yesno", "instructions": "urgent?"}]},
    {"content": "doc B", "questions": [{"id": "b1", "kind": "yesno", "instructions": "urgent?"}]}
  ]
}
```

## Response

`results` matches `requests`; each `answers` list matches that group's `questions`. Check `ok` on each answer: `result` holds the decision, `error` the message. `meta.usage` and `meta.latency_ms` cover the whole call.

```json theme={"theme":"github-light"}
{
  "results": [
    {
      "answers": [
        {
          "ok": true,
          "result": {
            "id": "policy_violation",
            "kind": "yesno",
            "result": {
              "answer": "yes",
              "probability": 0.99
            },
            "meta": {
              "model": "levanto-sage-2",
              "reasoning": { "ran": false, "finished": null, "tokens": null }
            }
          }
        },
        {
          "ok": true,
          "result": {
            "id": "harm_level",
            "kind": "scale",
            "result": {
              "expectation": 3.32,
              "confidence": 0.55,
              "probabilities": [
                {"level": 0, "probability": 0.0},
                {"level": 1, "probability": 0.0},
                {"level": 2, "probability": 0.01},
                {"level": 3, "probability": 0.65},
                {"level": 4, "probability": 0.34}
              ]
            },
            "meta": { "model": "levanto-sage-2" }
          }
        }
      ]
    }
  ],
  "meta": {
    "model": "levanto-sage-2",
    "request_count": 1,
    "question_count": 2,
    "usage": { "input_tokens": 203, "output_tokens": 0 },
    "latency_ms": 94.3
  }
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.