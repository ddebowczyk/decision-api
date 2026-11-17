> For clean Markdown of any page, append .md to the page URL.
> For a complete documentation index, see https://respan.ai/docs/llms.txt.
> For AI client integration (Claude Code, Cursor, etc.), connect to the MCP server at https://respan.ai/docs/_mcp/server.

# Quickstart

#### Get an API key

Create a key under [API keys](https://platform.respan.ai/platform/gateway/api-keys), then export it:

```bash
export RESPAN_API_KEY="YOUR_RESPAN_API_KEY"
```

span-02 runs on Respan credits. Add credits under [Credits](https://platform.respan.ai/platform/gateway/credits) before your first call.

#### Send a request

**`cURL`**

```bash cURL
curl https://api.respan.ai/api/v1/decisions \
  -H "Authorization: Bearer $RESPAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "span-02",
    "state": {
      "customer_message": "My package arrived damaged and nobody answers my emails. I want a refund now.",
      "order": { "id": 123, "days_late": 4 }
    },
    "questions": {
      "department": {
        "type": "choice",
        "instructions": "Which team should handle this ticket?",
        "criteria": {
          "returns": "Exchanges, wrong or damaged items",
          "shipping": "Delivery status, delays, lost packages",
          "billing": "Charges, invoices, payment problems"
        }
      },
      "wants_refund": { "type": "noul", "instructions": "Does the customer ask for a refund?" },
      "frustration": {
        "type": "score",
        "instructions": "How frustrated is the customer?",
        "criteria": ["Calm or positive", "Mildly annoyed", "Angry or threatening to leave"]
      },
      "days_late": { "type": "number", "instructions": "How many days late is the order?" }
    }
  }'
```

**`Python`**

```python Python
import os
import requests

response = requests.post(
    "https://api.respan.ai/api/v1/decisions",
    headers={"Authorization": f"Bearer {os.environ['RESPAN_API_KEY']}"},
    json={
        "model": "span-02",
        "state": {
            "customer_message": "My package arrived damaged and nobody answers my emails. I want a refund now.",
            "order": {"id": 123, "days_late": 4},
        },
        "questions": {
            "department": {
                "type": "choice",
                "instructions": "Which team should handle this ticket?",
                "criteria": {
                    "returns": "Exchanges, wrong or damaged items",
                    "shipping": "Delivery status, delays, lost packages",
                    "billing": "Charges, invoices, payment problems",
                },
            },
            "wants_refund": {"type": "noul", "instructions": "Does the customer ask for a refund?"},
            "frustration": {
                "type": "score",
                "instructions": "How frustrated is the customer?",
                "criteria": ["Calm or positive", "Mildly annoyed", "Angry or threatening to leave"],
            },
            "days_late": {"type": "number", "instructions": "How many days late is the order?"},
        },
    },
)
response.raise_for_status()
print(response.json())
```

**`TypeScript`**

```typescript TypeScript
const response = await fetch("https://api.respan.ai/api/v1/decisions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RESPAN_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "span-02",
    state: {
      customer_message:
        "My package arrived damaged and nobody answers my emails. I want a refund now.",
      order: { id: 123, days_late: 4 },
    },
    questions: {
      department: {
        type: "choice",
        instructions: "Which team should handle this ticket?",
        criteria: {
          returns: "Exchanges, wrong or damaged items",
          shipping: "Delivery status, delays, lost packages",
          billing: "Charges, invoices, payment problems",
        },
      },
      wants_refund: { type: "noul", instructions: "Does the customer ask for a refund?" },
      frustration: {
        type: "score",
        instructions: "How frustrated is the customer?",
        criteria: ["Calm or positive", "Mildly annoyed", "Angry or threatening to leave"],
      },
      days_late: { type: "number", instructions: "How many days late is the order?" },
    },
  }),
});

console.log(await response.json());
```

`state` is what the questions are about: text or any JSON value. `questions` is keyed by your own ids, and the answers come back under the same ids.

#### Read the response

```json
{
  "model": "span-02",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 0.969893,
      "probabilities": { "returns": 0.9799287, "shipping": 0.012929817, "billing": 0.00714149 }
    },
    "wants_refund": { "type": "noul", "noul": 0.99997675 },
    "frustration": {
      "type": "score",
      "score": 1.9921819,
      "legend": { "0": "Calm or positive", "1": "Mildly annoyed", "2": "Angry or threatening to leave" },
      "probabilities": { "0": 0.00009271287, "1": 0.0076327343, "2": 0.9922746 },
      "confidence": 0.9882728
    },
    "days_late": { "type": "number", "number": 4.0, "text": "4", "confidence": 0.9999089 }
  },
  "usage": { "input_tokens": 580, "output_tokens": 1 }
}
```

| Type     | Answer                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| `choice` | `choice` is the most likely option; `probabilities` has every option.                                      |
| `noul`   | `noul` is the probability of yes, from 0 to 1.                                                             |
| `score`  | `score` is the probability-weighted level, so it can be fractional; `legend` maps levels to your criteria. |
| `number` | `number` is the answer and `text` how the model wrote it.                                                  |

[Question types](/docs/documentation/span-02/question-types) has a full request and response for each type.

Every call is logged in Respan. The response's `X-Respan-Log-Id` header is the ID of its log.

#### Set a thinking deadline

Add `reasoning` to choose how span-02 thinks. With `"mode": "on"` and `budget_ms`, it thinks for up to that many milliseconds, then answers with its best decision so far:

```json
"reasoning": { "mode": "on", "budget_ms": 300 }
```

Use `"mode": "off"` to answer without thinking. Without `reasoning`, span-02 thinks only when it's unsure. See [span-02](/docs/documentation/span-02/concept#anytime-reasoning) for every option.
