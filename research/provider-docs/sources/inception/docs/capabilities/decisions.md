> ## Documentation Index
> Fetch the complete documentation index at: https://docs.inceptionlabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Decisions

> Use Mercury Decide to classify, score, and make structured decisions over shared context.

Mercury Decide evaluates named questions against a shared `state` and returns typed answers with probabilities. Use it for routing, classification, and scoring with `POST /v1/decisions` and the model `mercury-decide`.

## Send a decision request

Set `INCEPTION_API_KEY` to your [API key](https://platform.inceptionlabs.ai/dashboard/api-keys). Each request includes a model, a state, and a non-empty map of questions. The names you choose for questions are preserved in the response.

<CodeGroup>
  ```bash cURL theme={null}
  curl https://api.inceptionlabs.ai/v1/decisions \
    -H "Authorization: Bearer $INCEPTION_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "mercury-decide",
      "state": {"message": "Please refund the duplicate charge on my account."},
      "questions": {
        "billing": {
          "type": "noul",
          "instructions": "Is this request about billing?"
        },
        "team": {
          "type": "choice",
          "criteria": {
            "billing": "Payments, charges, and refunds",
            "support": "Technical support and other requests"
          }
        },
        "urgency": {
          "type": "score",
          "instructions": "How urgent is this request?",
          "criteria": ["Can wait", "Needs attention soon", "Needs immediate attention"]
        }
      }
    }'
  ```

  ```python Python theme={null}
  import json
  import os
  import urllib.request

  payload = {
      "model": "mercury-decide",
      "state": {"message": "Please refund the duplicate charge on my account."},
      "questions": {
          "billing": {"type": "noul", "instructions": "Is this request about billing?"},
          "team": {
              "type": "choice",
              "criteria": {
                  "billing": "Payments, charges, and refunds",
                  "support": "Technical support and other requests",
              },
          },
          "urgency": {
              "type": "score",
              "instructions": "How urgent is this request?",
              "criteria": ["Can wait", "Needs attention soon", "Needs immediate attention"],
          },
      },
  }
  request = urllib.request.Request(
      "https://api.inceptionlabs.ai/v1/decisions",
      data=json.dumps(payload).encode(),
      headers={
          "Authorization": f"Bearer {os.environ['INCEPTION_API_KEY']}",
          "Content-Type": "application/json",
      },
      method="POST",
  )
  with urllib.request.urlopen(request, timeout=60) as response:
      decision = json.load(response)
  print(decision["answers"])
  ```

  ```typescript TypeScript theme={null}
  const response = await fetch('https://api.inceptionlabs.ai/v1/decisions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.INCEPTION_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mercury-decide',
      state: { message: 'Please refund the duplicate charge on my account.' },
      questions: {
        billing: { type: 'noul', instructions: 'Is this request about billing?' },
        team: {
          type: 'choice',
          criteria: {
            billing: 'Payments, charges, and refunds',
            support: 'Technical support and other requests',
          },
        },
        urgency: {
          type: 'score',
          instructions: 'How urgent is this request?',
          criteria: ['Can wait', 'Needs attention soon', 'Needs immediate attention'],
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Decision request failed (${response.status}): ${await response.text()}`);
  }
  const decision = await response.json();
  console.log(decision.answers);
  ```
</CodeGroup>

## Question types

| Type | Criteria | Answer |
| - | - | - |
| `noul` | Optional `true` and `false` descriptions | `noul`: the probability of a positive answer, from 0 to 1 |
| `choice` | A map of 1–255 option names to descriptions; descriptions may be `null` | `choice`: the highest-probability option, plus `probabilities` for every option and `confidence` |
| `score` | An ordered array of 1–10 level descriptions, starting at level 0 | `score`: the probability-weighted average of the level indices, plus `legend`, `probabilities`, and `confidence` |

The state, instructions, and criterion descriptions can be strings, JSON objects, or arrays. Instructions may be omitted or `null`. Questions are evaluated independently against the shared state. A score can be fractional; it is not restricted to a single level.

## Send images

Mercury Decide can look at images. Add an image part anywhere in `state` or in a question's `instructions`:

```json theme={null}
{
  "model": "mercury-decide",
  "state": [
    {"type": "text", "text": "Screenshot of the checkout page after the user clicked Pay."},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgo..."}}
  ],
  "questions": {
    "error_shown": {"type": "noul", "instructions": "Does the page show a payment error?"},
    "next_step": {
      "type": "choice",
      "criteria": {
        "retry": "Retry the payment",
        "contact_support": "Ask the user to contact support",
        "done": "The order went through"
      }
    }
  }
}
```

* Images must be base64 data URLs in PNG, JPEG, WebP, or GIF format. Remote URLs are not supported.
* Each image can be up to 10 MiB, and a request can include up to 16 images.
* The complete JSON request, including base64-encoded images and all other fields, must fit within the gateway's 20 MiB default body limit. Base64 encoding increases image size by roughly one third, so multiple images can exceed this limit even when each image is below 10 MiB.
* Images are not supported in `criteria`.
* The image part must use exactly the shape above. A data URL passed as a plain string is treated as text, and the model does not see an image.

Requests that exceed the total body limit return a `413` error before image validation. Invalid images in requests within that limit return a `422` error.

## Read the response

The response contains the model name, an `answers` map keyed by your question names, and `usage`. For example, a request with a single `noul` question named `billing` could return:

```json theme={null}
{
  "model": "mercury-decide",
  "answers": {
    "billing": {"type": "noul", "noul": 0.97}
  },
  "usage": {
    "input_tokens": 48,
    "output_tokens": 1
  }
}
```

The values above are illustrative. For `choice`, `probabilities` uses your option names. For `score`, it uses string indices such as `"0"` and `"1"`, and `legend` maps those indices back to your criteria. Both include a `confidence` value between 0 and 1.

## Pricing and limits

Mercury Decide costs **\$0.02 per million input tokens** (50% off the regular \$0.04 price). Only input tokens are billed; output tokens are reported in `usage.output_tokens` but are not charged. See [Models & Pricing](/get-started/models).

* Send requests to `/v1/decisions`. Mercury Decide does not support `/v1/chat/completions`, streaming, or tool calling.
* Use [Error Codes](/resources/error-codes) for authentication, rate-limit, and service errors.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
