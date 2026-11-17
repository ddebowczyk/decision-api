> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Sort decisions

> Rank a list of items by a criterion.

`content` is a list of 2–120 items. The question takes only `id`, `kind` and `instructions`; any other field returns 400.

## Request

```json theme={"theme":"github-light"}
{
  "content": {
    "kind": "list",
    "value": [
      {"id": "typo", "content": "Spelling mistake on the FAQ page."},
      {"id": "db_down", "content": "Primary production database is unreachable."},
      {"id": "pricing", "content": "Prospect asking about Enterprise pricing."}
    ]
  },
  "question": {
    "id": "triage",
    "kind": "sort",
    "instructions": "Sort by operational urgency, most urgent first."
  }
}
```

## Response

```json theme={"theme":"github-light"}
{
  "id": "triage",
  "kind": "sort",
  "result": { "sorted": ["db_down", "pricing", "typo"], "confidence": 0.76 },
  "meta": { "model": "levanto-sage-2", "latency_ms": 192.3 }
}
```

`confidence` (0–1, or `null`) is how far to trust the whole order.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.