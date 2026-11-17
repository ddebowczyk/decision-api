> ## Documentation Index
> Fetch the complete documentation index at: https://docs.scaledown.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Decisions API

> POST /v1/scaledown - Jev-compatible request and response. Send a state and a set of typed questions, get one answer per question.

## Overview

The `/v1/scaledown` endpoint mirrors [TypeSafe's Jev Decisions API](https://openrouter.ai/docs/guides/community/jev) request/response shape. You send a `state` object plus a `questions` map, and get back one typed `answer` per question. `choice`, `noul`, and `score` questions are all answered using the same calibrated scoring [`/classify`](/api-reference/classify) uses.

## Request

<ParamField body="model" type="string" default="classify-1">
  Optional. `"classify"` (always the latest version) or `"classify-1"` (pinned to version 1). Defaults to `"classify-1"` when omitted. Any other value is rejected with `422`.
</ParamField>

<ParamField body="state" type="object | string" required>
  The item being decided on. Pass a plain string as shorthand for `{ "text": "..." }`, matching TypeSafe's API, or an object to use the fields below.

  <Expandable title="State fields">
    <ParamField body="text" type="string">
      The text to evaluate every question against. Provide `text`, `document`, or both.
    </ParamField>

    <ParamField body="document" type="string">
      A base64-encoded file to evaluate. Supported formats: JPEG, PNG, TIFF, single-page PDF, multi-page PDF. Non-standard extension - not part of the Jev API.
    </ParamField>

    <ParamField body="document_mime_type" type="string">
      MIME type of `document` (e.g. `"image/jpeg"`, `"application/pdf"`). Required when `document` is provided.
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="questions" type="object" required>
  A map of question name → question definition. Must contain at least one entry. Every question is answered against the same `state`, concurrently.

  <Expandable title="choice question">
    <ParamField body="type" type="string" required>
      `"choice"` - pick exactly one option from `criteria`.
    </ParamField>

    <ParamField body="instructions" type="string">
      Optional guidance for how to choose (e.g. "Which single category best describes the post?").
    </ParamField>

    <ParamField body="criteria" type="object" required>
      Map of option key → description, e.g. `{ "billing": "About a charge, invoice, or refund." }`. At least one entry required.
    </ParamField>
  </Expandable>

  <Expandable title="noul question">
    <ParamField body="type" type="string" required>
      `"noul"` - an independent yes/no question, answered as a probability.
    </ParamField>

    <ParamField body="instructions" type="string">
      The yes/no question to evaluate, e.g. `"Is the sentiment positive?"`.
    </ParamField>
  </Expandable>

  <Expandable title="score question">
    <ParamField body="type" type="string" required>
      `"score"` - an ordered-scale question, answered as a position on the scale.
    </ParamField>

    <ParamField body="instructions" type="string">
      Optional guidance for how to score (e.g. "How severe is the reported issue?").
    </ParamField>

    <ParamField body="criteria" type="array" required>
      An **ordered** list of 2 to 10 level descriptions, from lowest to highest, e.g. `["Cosmetic; no impact to functionality", "Broken or degraded feature, but workaround exists", "Blocking issue; no workaround exists"]`. Levels are indexed by array position starting at `0` - unlike `choice`'s `criteria`, this is an array, not a map, because the order is meaningful.
    </ParamField>
  </Expandable>
</ParamField>

## Response

<ResponseField name="model" type="string">
  Echoes the `model` you sent (`"classify"` or `"classify-1"`; `"classify-1"` if omitted).
</ResponseField>

<ResponseField name="answers" type="object">
  Map of question name → typed answer, matching the `questions` keys from the request.

  <Expandable title="choice answer">
    <ResponseField name="type" type="string">
      `"choice"`
    </ResponseField>

    <ResponseField name="choice" type="string">
      The chosen option key.
    </ResponseField>

    <ResponseField name="probabilities" type="object">
      Map of option key → probability. Sums to `1.0`.
    </ResponseField>

    <ResponseField name="confidence" type="number">
      The chosen option's probability (same value as `probabilities[choice]`).
    </ResponseField>
  </Expandable>

  <Expandable title="noul answer">
    <ResponseField name="type" type="string">
      `"noul"`
    </ResponseField>

    <ResponseField name="noul" type="number">
      P(yes) - independent probability, 0 to 1.
    </ResponseField>
  </Expandable>

  <Expandable title="score answer">
    <ResponseField name="type" type="string">
      `"score"`
    </ResponseField>

    <ResponseField name="score" type="number">
      Probability-weighted expected value across the levels: `Σ (level_index × P(level))`. A continuous position on the scale, e.g. `1.43` for a 3-level (`0`, `1`, `2`) scale - not necessarily a whole level.
    </ResponseField>

    <ResponseField name="confidence" type="number">
      The most likely level's probability mass (same value as `max(probabilities.values())`).
    </ResponseField>

    <ResponseField name="legend" type="object">
      Map of level index (as a string, e.g. `"0"`) → its description, echoing `criteria` back for display.
    </ResponseField>

    <ResponseField name="probabilities" type="object">
      Map of level index (as a string) → probability. Sums to `1.0`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="usage" type="object">
  Token usage and cost, summed across every internal call the request fanned out to (one per question, regardless of type).

  <Expandable title="Usage fields">
    <ResponseField name="input_tokens" type="integer">
      Sum of input tokens across every question answered.
    </ResponseField>

    <ResponseField name="output_tokens" type="integer">
      Sum of output tokens across every question answered.
    </ResponseField>

    <ResponseField name="cost" type="number">
      Total cost in USD for the request.
    </ResponseField>
  </Expandable>
</ResponseField>

## How `score` is calculated

A `score` question is answered with the same constrained, calibrated decode `choice` uses - one model call scores every level in `criteria`, producing a probability distribution over them (`probabilities`). That distribution is then reduced to a single continuous `score` value: the probability-weighted expected value across level indices.

For example, given `criteria` with 3 levels (indices `0`, `1`, `2`) and `probabilities: {"0": 0.0, "1": 0.57, "2": 0.43}`:

```
score = 0×0.0 + 1×0.57 + 2×0.43 = 1.43
```

`score` is therefore a continuous position on the scale, not necessarily a whole level - a value near `1.43` says the model leans toward level 2 but isn't fully decided between levels 1 and 2. Use `probabilities` (or `confidence`, the top level's own probability) if you need the calibration behind that number instead of just the point estimate.

## Error responses

| Status | Meaning |
| - | - |
| `422 Unprocessable Entity` | Malformed request body, empty `questions` map, empty `criteria` on a `choice` question, `criteria` outside the 2-10 range on a `score` question, neither `state.text` nor `state.document` provided, an unsupported `model` value, or the document could not be read. |
| `402 Payment Required` | Insufficient credits. |
| `502 Bad Gateway` | Model service unavailable or returned an error. |
| `504 Gateway Timeout` | Request timed out. |

## Authentication

Include your API key in every request using the `x-api-key` header.

```bash theme={null}
-H "x-api-key: <your-api-key>"
```

## Examples

### Single choice question

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://api.scaledown.xyz/v1/scaledown \
    -H "Content-Type: application/json" \
    -H "x-api-key: <your-api-key>" \
    -d '{
      "model": "classify-1",
      "state": "I was charged twice for my subscription this month.",
      "questions": {
        "category": {
          "type": "choice",
          "instructions": "Which single category best describes the post?",
          "criteria": {
            "billing": "About a charge, invoice, refund, or payment problem.",
            "technical": "About a bug or something not working.",
            "account": "About login, access, or account settings."
          }
        }
      }
    }'
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      "https://api.scaledown.xyz/v1/scaledown",
      headers={"x-api-key": "<your-api-key>"},
      json={
          "model": "classify-1",
          "state": {"text": "I was charged twice for my subscription this month."},
          "questions": {
              "category": {
                  "type": "choice",
                  "instructions": "Which single category best describes the post?",
                  "criteria": {
                      "billing": "About a charge, invoice, refund, or payment problem.",
                      "technical": "About a bug or something not working.",
                      "account": "About login, access, or account settings.",
                  },
              }
          },
      },
  )
  print(response.json())
  ```

  ```typescript TypeScript theme={null}
  const response = await fetch("https://api.scaledown.xyz/v1/scaledown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "<your-api-key>",
    },
    body: JSON.stringify({
      model: "classify-1",
      state: { text: "I was charged twice for my subscription this month." },
      questions: {
        category: {
          type: "choice",
          instructions: "Which single category best describes the post?",
          criteria: {
            billing: "About a charge, invoice, refund, or payment problem.",
            technical: "About a bug or something not working.",
            account: "About login, access, or account settings.",
          },
        },
      },
    }),
  });
  const data = await response.json();
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "model": "classify-1",
  "answers": {
    "category": {
      "type": "choice",
      "choice": "billing",
      "probabilities": { "billing": 0.93, "technical": 0.04, "account": 0.03 },
      "confidence": 0.93
    }
  },
  "usage": { "input_tokens": 62, "output_tokens": 1, "cost": 0.0000026 }
}
```

***

### Mixed choice + noul questions

`choice` and `noul` questions can be combined in one request. Both are answered concurrently against the same `state`.

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://api.scaledown.xyz/v1/scaledown \
    -H "Content-Type: application/json" \
    -H "x-api-key: <your-api-key>" \
    -d '{
      "state": { "text": "The invoice is overdue and the customer is threatening to cancel." },
      "questions": {
        "category": {
          "type": "choice",
          "criteria": {
            "billing": "About a charge, invoice, or payment matter.",
            "legal": "About a legal or contractual dispute."
          }
        },
        "is_churn_risk": {
          "type": "noul",
          "instructions": "Does this text signal the customer may cancel or leave?"
        }
      }
    }'
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      "https://api.scaledown.xyz/v1/scaledown",
      headers={"x-api-key": "<your-api-key>"},
      json={
          "state": {"text": "The invoice is overdue and the customer is threatening to cancel."},
          "questions": {
              "category": {
                  "type": "choice",
                  "criteria": {
                      "billing": "About a charge, invoice, or payment matter.",
                      "legal": "About a legal or contractual dispute.",
                  },
              },
              "is_churn_risk": {
                  "type": "noul",
                  "instructions": "Does this text signal the customer may cancel or leave?",
              },
          },
      },
  )
  print(response.json())
  ```

  ```typescript TypeScript theme={null}
  const response = await fetch("https://api.scaledown.xyz/v1/scaledown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "<your-api-key>",
    },
    body: JSON.stringify({
      state: { text: "The invoice is overdue and the customer is threatening to cancel." },
      questions: {
        category: {
          type: "choice",
          criteria: {
            billing: "About a charge, invoice, or payment matter.",
            legal: "About a legal or contractual dispute.",
          },
        },
        is_churn_risk: {
          type: "noul",
          instructions: "Does this text signal the customer may cancel or leave?",
        },
      },
    }),
  });
  const data = await response.json();
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "model": "classify-1",
  "answers": {
    "category": {
      "type": "choice",
      "choice": "billing",
      "probabilities": { "billing": 0.88, "legal": 0.12 },
      "confidence": 0.88
    },
    "is_churn_risk": { "type": "noul", "noul": 0.79 }
  },
  "usage": { "input_tokens": 94, "output_tokens": 2, "cost": 0.0000039 }
}
```

***

### A `score` question

Use `score` for an ordered-scale rating, like severity or quality. `criteria` is an ordered array, not a map - level `0` is the first item, level `1` the second, and so on.

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://api.scaledown.xyz/v1/scaledown \
    -H "Content-Type: application/json" \
    -H "x-api-key: <your-api-key>" \
    -d '{
      "state": { "text": "The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari." },
      "questions": {
        "bug_severity": {
          "type": "score",
          "instructions": "How severe is the reported issue?",
          "criteria": [
            "Cosmetic; no impact to functionality",
            "Broken or degraded feature, but workaround exists",
            "Blocking issue; no workaround exists"
          ]
        }
      }
    }'
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      "https://api.scaledown.xyz/v1/scaledown",
      headers={"x-api-key": "<your-api-key>"},
      json={
          "state": {
              "text": "The export button crashes the settings page in Safari. "
              "It works in Chrome, but a few of our customers only use Safari."
          },
          "questions": {
              "bug_severity": {
                  "type": "score",
                  "instructions": "How severe is the reported issue?",
                  "criteria": [
                      "Cosmetic; no impact to functionality",
                      "Broken or degraded feature, but workaround exists",
                      "Blocking issue; no workaround exists",
                  ],
              }
          },
      },
  )
  print(response.json())
  ```

  ```typescript TypeScript theme={null}
  const response = await fetch("https://api.scaledown.xyz/v1/scaledown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "<your-api-key>",
    },
    body: JSON.stringify({
      state: {
        text: "The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.",
      },
      questions: {
        bug_severity: {
          type: "score",
          instructions: "How severe is the reported issue?",
          criteria: [
            "Cosmetic; no impact to functionality",
            "Broken or degraded feature, but workaround exists",
            "Blocking issue; no workaround exists",
          ],
        },
      },
    }),
  });
  const data = await response.json();
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "model": "classify-1",
  "answers": {
    "bug_severity": {
      "type": "score",
      "score": 1.43,
      "confidence": 0.57,
      "legend": {
        "0": "Cosmetic; no impact to functionality",
        "1": "Broken or degraded feature, but workaround exists",
        "2": "Blocking issue; no workaround exists"
      },
      "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 }
    }
  },
  "usage": { "input_tokens": 68, "output_tokens": 1, "cost": 0.0000029 }
}
```

`score: 1.43` (0×0.0 + 1×0.57 + 2×0.43) says the model leans toward "blocking issue" (level 2) but isn't fully decided between that and "broken or degraded" (level 1).

***

### Mixing all three question types

`choice`, `noul`, and `score` questions can all appear in the same request. Every question is answered concurrently against the same `state`, and `usage` sums across all of them.

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://api.scaledown.xyz/v1/scaledown \
    -H "Content-Type: application/json" \
    -H "x-api-key: <your-api-key>" \
    -d '{
      "state": { "text": "Great product, but the onboarding was confusing." },
      "questions": {
        "sentiment": {
          "type": "choice",
          "criteria": { "positive": "Overall positive tone.", "negative": "Overall negative tone." }
        },
        "is_actionable": {
          "type": "noul",
          "instructions": "Does this feedback suggest a specific, actionable improvement?"
        },
        "quality_score": {
          "type": "score",
          "instructions": "Rate overall product quality.",
          "criteria": ["poor", "average", "excellent"]
        }
      }
    }'
  ```
</CodeGroup>

**Response:**

```json theme={null}
{
  "model": "classify-1",
  "answers": {
    "sentiment": {
      "type": "choice",
      "choice": "positive",
      "probabilities": { "positive": 0.81, "negative": 0.19 },
      "confidence": 0.81
    },
    "is_actionable": { "type": "noul", "noul": 0.72 },
    "quality_score": {
      "type": "score",
      "score": 1.65,
      "confidence": 0.51,
      "legend": { "0": "poor", "1": "average", "2": "excellent" },
      "probabilities": { "0": 0.03, "1": 0.46, "2": 0.51 }
    }
  },
  "usage": { "input_tokens": 103, "output_tokens": 3, "cost": 0.0000044 }
}
```

## Notes

* `"classify"` and `"classify-1"` are the only supported `model` values. Omit it (defaults to `"classify-1"`) or pass either explicitly - any other value is rejected with `422`.
* Every question in a request - `choice`, `noul`, or `score` - is one separate calibrated model call, run concurrently. `usage` is the sum across all of them - a request with a `choice`, a `noul`, and a `score` question makes 3 calls and bills for all 3.
* `score`'s `criteria` is an **ordered array** (2-10 levels), unlike `choice`'s unordered `{key: description}` map - the array position is the level index.
* No `reasoning` field exists on this endpoint - it never generates a free-form explanation, unlike [`/classify`](/api-reference/classify), which returns one by default (the `reasoning` parameter).
* No batching - each request evaluates one `state`. To classify many items, use [`/classify`](/api-reference/classify)'s `chunks` array instead.
* See [Differences from Jev](/api-reference/decisions-overview#differences-from-jev) for the full compatibility matrix.


## OpenAPI

````yaml POST /v1/scaledown
openapi: 3.1.0
info:
  title: ScaleDown API
  version: 1.0.0
servers:
  - url: https://api.scaledown.xyz
security:
  - apiKey: []
paths:
  /v1/scaledown:
    post:
      summary: Decisions
      description: >-
        Jev (TypeSafe)-compatible endpoint: answer typed choice/noul/score
        questions about a shared state object.
      operationId: decisions
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - state
                - questions
              properties:
                model:
                  type: string
                  enum:
                    - classify-1
                  default: classify-1
                  description: >-
                    Optional. "classify-1" is the only supported value and also
                    the default when omitted. Any other value returns 422.
                state:
                  description: >-
                    The item being decided on. A plain string is shorthand for
                    {"text": "..."}.
                  oneOf:
                    - type: string
                    - type: object
                      description: >-
                        The item being decided on. Provide text, document, or
                        both.
                      properties:
                        text:
                          type: string
                          description: The text to evaluate every question against.
                        document:
                          type: string
                          description: >-
                            A base64-encoded file to evaluate (image or PDF).
                            Non-standard extension, not part of the Jev API.
                        document_mime_type:
                          type: string
                          description: >-
                            MIME type of document. Required when document is
                            provided.
                questions:
                  type: object
                  description: >-
                    Map of question name to question definition. Must contain at
                    least one entry.
                  additionalProperties:
                    type: object
                    required:
                      - type
                    properties:
                      type:
                        type: string
                        enum:
                          - choice
                          - noul
                          - score
                        description: >-
                          choice: pick one mutually-exclusive option from
                          criteria. noul: independent yes/no question. score: an
                          ordered-scale question, answered as a position on the
                          scale.
                      instructions:
                        type: string
                        description: Optional guidance for how to answer the question.
                      criteria:
                        description: >-
                          Required for choice questions: object mapping option
                          key to description (at least one entry). Required for
                          score questions: ORDERED array of 2-10 level
                          descriptions, lowest to highest (level index = array
                          position). Ignored for noul questions.
                        oneOf:
                          - type: object
                            additionalProperties:
                              type: string
                          - type: array
                            items:
                              type: string
                            minItems: 2
                            maxItems: 10
      responses:
        '200':
          description: Successful decision
          content:
            application/json:
              schema:
                type: object
                properties:
                  model:
                    type: string
                    description: Always "classify-1".
                  answers:
                    type: object
                    description: >-
                      Map of question name to typed answer, matching the
                      questions keys from the request.
                    additionalProperties:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - choice
                            - noul
                            - score
                        choice:
                          type: string
                          description: 'choice answers only: the chosen option key.'
                        probabilities:
                          type: object
                          description: >-
                            choice/score answers only: map of option key
                            (choice) or level index as a string (score) to
                            probability. Sums to 1.0.
                          additionalProperties:
                            type: number
                        confidence:
                          type: number
                          description: >-
                            choice/score answers only: the chosen option's, or
                            top level's, probability.
                        noul:
                          type: number
                          description: 'noul answers only: P(yes), 0 to 1.'
                        score:
                          type: number
                          description: >-
                            score answers only: probability-weighted expected
                            value across level indices (sum of level_index *
                            probability). A continuous position on the scale,
                            not necessarily a whole level.
                        legend:
                          type: object
                          description: >-
                            score answers only: map of level index (as a string)
                            to its criteria description, echoing the request's
                            criteria back for display.
                          additionalProperties:
                            type: string
                  usage:
                    type: object
                    description: >-
                      Token usage and cost, summed across every internal call
                      the request fanned out to.
                    properties:
                      input_tokens:
                        type: integer
                      output_tokens:
                        type: integer
                      cost:
                        type: number
        '402':
          description: Insufficient credits.
        '422':
          description: >-
            Malformed request body, empty questions map, empty criteria on a
            choice question, a score question's criteria outside the 2-10 item
            range, neither state.text nor state.document provided, an
            unsupported model value, or the document could not be read.
        '502':
          description: Model service unavailable or returned an error.
        '504':
          description: Request timed out.
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: x-api-key

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
