> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Grounding

> Search the web before deciding.

Add `grounding` to a Yes/No, Choice, Scale or Tags question for recent or fact-heavy questions. Not with images or Sort.

## Request

```json theme={"theme":"github-light"}
{
  "content": "Has there been a major Cloudflare incident this month?",
  "question": {"id": "incident", "kind": "yesno", "instructions": "Is this likely true?"},
  "grounding": {"trigger": "low_confidence", "confidence_floor": 0.8}
}
```

| Field | Description |
| - | - |
| `trigger` | `never`, `low_confidence` (default) or `always` |
| `confidence_floor` | How sure Sage must be to skip the search. Default `0.8`: for Yes/No, roughly p ≤ 0.10 or ≥ 0.90 |

For Tags, one unsure tag triggers a search, then every tag is decided again. A search can turn a `null` into a decision.

On [`/decide/batch`](https://docs.levanto.ai/decision-model/batch), set `grounding` on each question, not the group.

## Response

`grounding_meta` reports `triggered`, `queries`, `sources` and timing.

## Pricing

A search that runs is charged at your plan's search rate; the evidence counts as input tokens. See [Pricing](https://docs.levanto.ai/pricing.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.