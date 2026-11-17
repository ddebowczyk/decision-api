> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Choice decisions

> Pick one option from a set, or null when it's too close to call.

Give every option a description of when it applies. Put rules, precedence and exceptions in `content` or `instructions`. For exactly-one-of-N, use Choice rather than [Tags](https://docs.levanto.ai/decision-model/tags.md).

## Request

```json theme={"theme":"github-light"}
{
  "content": "MASTER SERVICES AGREEMENT\n\nThis Agreement is effective January 15, 2026, by and between Acme Corp (\"Customer\") and VendorCo LLC (\"Vendor\").\n\n[... Sections 1–7: scope, fees, confidentiality, warranties, and general terms omitted ...]\n\n8. Term; Renewal. The initial term is twelve (12) months. Unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term, this Agreement automatically renews for successive one-year periods.\n\n9. Limitation of Liability. [... omitted ...]",
  "question": {
    "id": "contract_disposition",
    "kind": "choice",
    "instructions": "How should legal handle this contract?",
    "options": [
      {"option": "approve", "description": "Standard terms, no red flags — proceed to signature"},
      {"option": "revise", "description": "Acceptable with specific clause changes before signing"},
      {"option": "reject", "description": "Terms are unacceptable — do not proceed"},
      {"option": "escalate", "description": "Unusual or high-risk terms — partner review required"}
    ]
  }
}
```

## Response

```json theme={"theme":"github-light"}
{
  "id": "contract_disposition",
  "kind": "choice",
  "result": {
    "chosen": "approve",
    "probability": 0.89,
    "probabilities": [
      {"option": "approve", "probability": 0.89},
      {"option": "revise", "probability": 0.09},
      {"option": "reject", "probability": 0.0},
      {"option": "escalate", "probability": 0.01}
    ]
  },
  "meta": { "model": "levanto-sage-2", "latency_ms": 88.3 }
}
```

| Field | Description |
| - | - |
| `chosen` | The winning option, or `null` when the top two are too close to call |
| `probability` | Calibrated P(`chosen` is correct); `null` with `chosen` |
| `probabilities` | Every option, in request order. They sum to 1 |

A close call returns `null`:

```json theme={"theme":"github-light"}
{
  "chosen": null,
  "probability": null,
  "probabilities": [
    {"option": "approve", "probability": 0.0},
    {"option": "revise", "probability": 0.18},
    {"option": "reject", "probability": 0.41},
    {"option": "escalate", "probability": 0.41}
  ]
}
```

Option limits: see [Limits and errors](https://docs.levanto.ai/decision-model/limits.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.