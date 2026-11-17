> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Yes/No decisions

> Yes, no, or null when Sage isn't sure.

## Request

```json theme={"theme":"github-light"}
{
  "content": "Marketing email draft promotes \"guaranteed 40% returns\" and describes the product as \"risk-free\" for accredited investors.",
  "question": {
    "id": "needs_compliance_review",
    "kind": "yesno",
    "instructions": "Does this copy require compliance review before send?"
  }
}
```

## Response

```json theme={"theme":"github-light"}
{
  "id": "needs_compliance_review",
  "kind": "yesno",
  "result": {
    "answer": "yes",
    "probability": 1.0
  },
  "meta": { "model": "levanto-sage-2", "latency_ms": 110.6 }
}
```

| Field | Description |
| - | - |
| `answer` | `"yes"`, `"no"`, or `null` |
| `probability` | Calibrated P(yes), 0–1. Returned even when `answer` is `null` |

A near-tie returns `null`:

```json theme={"theme":"github-light"}
{ "answer": null, "probability": 0.47 }
```

## Handle "not sure"

```python theme={"theme":"github-light"}
result = response["result"]
if result["answer"] is None:
    escalate_to_human(response)   # Sage isn't sure
elif result["answer"] == "yes":
    send_to_compliance()
else:
    send_email()
```

For a stricter bar, check `probability` yourself, for example auto-approve only at ≥ 0.98.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.