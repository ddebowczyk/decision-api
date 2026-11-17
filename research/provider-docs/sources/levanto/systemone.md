> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# SystemOne API

> Call Sage with the Jev-compatible SystemOne format.

Sage also serves the SystemOne API, the request format Jev uses. If your code already calls Jev, change the base URL, the key and the model name.

## Endpoint and key

Base URL: `https://sage.levanto.ai`

| Method | Path | Purpose |
| - | - | - |
| POST | `/v1/systemone` | Answer named questions about one `state` |
| GET | `/v1/models` | List the model names you can send |

Both endpoints need your Levanto key: `Authorization: Bearer lv_live_...`. Set `model` to `levanto-sage-2` or `sage-latest`. Other names, such as `jev-latest`, return 422.

## Request

```bash theme={"theme":"github-light"}
curl -s https://sage.levanto.ai/v1/systemone \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "sage-latest",
  "state": { "subject": "Duplicate charge", "message": "I was charged twice. Please help." },
  "questions": {
    "billing": { "type": "noul", "instructions": "Is this message about billing?" },
    "tone": { "type": "choice", "criteria": { "angry": "Upset or hostile", "calm": "Neutral or polite" } },
    "urgency": { "type": "score", "criteria": ["Can wait", "This week", "Today"] }
  }
}'
```

## Response

```json theme={"theme":"github-light"}
{
  "model": "levanto-sage-2",
  "answers": {
    "billing": { "type": "noul", "noul": 1.0 },
    "tone": { "type": "choice", "choice": "calm", "confidence": 0.82,
              "probabilities": { "angry": 0.18, "calm": 0.82 } },
    "urgency": { "type": "score", "score": 1.62, "confidence": 0.66,
                 "legend": { "0": "Can wait", "1": "This week", "2": "Today" },
                 "probabilities": { "0": 0.05, "1": 0.29, "2": 0.66 } }
  },
  "usage": { "input_tokens": 240, "output_tokens": 0 }
}
```

`noul` is the probability of yes. Each `probabilities` map sums to 1, and `confidence` is its highest value.

## What maps

| SystemOne `type` | Sage kind | Limits |
| - | - | - |
| `noul` | [Yes/No](https://docs.levanto.ai/decision-model/yesno.md) | `criteria.true` and `criteria.false` are optional |
| `choice` | [Choice](https://docs.levanto.ai/decision-model/choice.md) | 2 to 256 options |
| `score` | [Scale](https://docs.levanto.ai/decision-model/scale.md) | 2 to 26 levels, scored from 0 |

`state` can be text, a JSON object or a JSON array.

## Differences

* Every question gets an answer, never `null`. Set your own threshold, or use [`/decide`](https://docs.levanto.ai/decision-model/quickstart) to get `null` when Sage isn't sure.
* Sort, Tags, Images and Grounding are on `/decide` and `/decide/batch` only.
* [Reasoning](https://docs.levanto.ai/decision-model/reasoning.md) is off by default. Add `"reasoning": "auto"` or `"on"` to the request body to turn it on.
* Close choices can depend on option order: keep your `criteria` keys in a fixed order.

## Pricing

Same key and per-token rates as `/decide`. `usage` shows what each call uses. See [Pricing](https://docs.levanto.ai/pricing.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.