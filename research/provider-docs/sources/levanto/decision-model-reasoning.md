> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Reasoning

> Let Sage think a hard question through before answering.

Set top-level `reasoning` on `/decide` or `/decide/batch`. On batch it applies to every question.

## Request

```json theme={"theme":"github-light"}
{
  "content": "Refund request: order #4411, $180, bought 41 days ago. Policy: refunds within 30 days; store credit up to 60 days for unopened items. Customer says the box is unopened.",
  "question": {
    "id": "refund_ok",
    "kind": "yesno",
    "instructions": "Under the policy, should we issue a cash refund?"
  },
  "reasoning": "on"
}
```

## Modes

| `reasoning` | What happens | Use for |
| - | - | - |
| `off` (default) | Answers right away | Most calls, tight latency |
| `auto` | Reasons only when the question needs it | Mixed workloads, long policies |
| `on` | Always reasons; up to a few seconds | Policy, eligibility, refunds |

## Response

Each answer's `meta.reasoning` reports what happened:

```json theme={"theme":"github-light"}
{
  "id": "refund_ok",
  "kind": "yesno",
  "result": { "answer": "no", "probability": 0.06 },
  "meta": {
    "model": "levanto-sage-2",
    "latency_ms": 391.0,
    "reasoning": {
      "ran": true,
      "finished": true,
      "tokens": 19
    }
  }
}
```

| Field | Meaning |
| - | - |
| `ran` | Sage reasoned before answering |
| `finished` | `false` if cut off; `null` if Sage didn't reason |
| `limited` | Why it was cut off: `cap` (length), `timeout` (6 s) or `budget` (no time to start) |
| `forced` | When cut off: `true` answered from partial reasoning, `false` gave the quick answer |
| `tokens` | Thinking tokens, counted as output |

## Time limit

Reasoning stops at 6 seconds or a length limit; the call still answers. With `auto` or `on`, set your client timeout above 10 seconds.

## Pricing

Reasoning adds input and output tokens at your plan's rates; `meta.usage` shows the totals. See [Pricing](https://docs.levanto.ai/pricing.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.