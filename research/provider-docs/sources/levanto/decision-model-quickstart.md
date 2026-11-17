> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Your first decision, extraction and stream.

## Get a key

Create a key (`lv_live_...`) in the dashboard under **Decision model → API keys**. Send it on every call:

```text theme={"theme":"github-light"}
Authorization: Bearer lv_live_...
```

> [!WARNING]
>
> Never hardcode, log or commit your key. Read it from an environment variable such as `SAGE_API_KEY`.

## Make a decision

```bash theme={"theme":"github-light"}
endpoint="https://sage.levanto.ai"

curl -s \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  "$endpoint/decide" -d '{
  "content": "Marketing email draft promotes '\''guaranteed 40% returns'\'' and describes the product as '\''risk-free'\'' for accredited investors.",
  "question": {
    "id": "needs_compliance_review",
    "kind": "yesno",
    "instructions": "Does this copy require compliance review before send?"
  }
}'
```

Response, abridged:

```json theme={"theme":"github-light"}
{
  "id": "needs_compliance_review",
  "kind": "yesno",
  "result": {
    "answer": "yes",
    "probability": 0.9996838679429355
  },
  "meta": {
    "model": "levanto-sage-2",
    "latency_ms": 110.5,
    "usage": { "input_tokens": 82, "output_tokens": 0 },
    "reasoning": { "ran": false, "finished": null, "tokens": null }
  }
}
```

`content` is what Sage evaluates (text, a list, or an [image](https://docs.levanto.ai/decision-model/images.md)). `question.kind` picks the decision kind: `yesno`, `choice`, `scale`, `sort` or `tags`.

## Handle "not sure"

Act on yes or no; route `null` to a human. `probability` is there if a workflow needs a stricter bar.

```bash theme={"theme":"github-light"}
# request.json holds the request body from the step above
curl -s -H "Authorization: Bearer $SAGE_API_KEY" -H 'Content-Type: application/json' \
  "$endpoint/decide" -d @request.json | jq -r '.result
  | if .answer == null then "escalate"
    elif .answer == "yes" then "send_to_compliance"
    else "send" end'
```

## Extract data

Say what to find; get typed values back.

```bash theme={"theme":"github-light"}
curl -s \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  "$endpoint/v1/extract" -d '{
  "content": "Two oat lattes and a croissant, pickup at 8:15 for Dana.",
  "extract": {
    "customer": "the name of the customer",
    "pickup_time": {"type": "time"},
    "items": ["an item ordered"]
  }
}' | jq .values
```

```json theme={"theme":"github-light"}
{
  "customer": "Dana",
  "pickup_time": "08:15",
  "items": ["Two oat lattes", "a croissant"]
}
```

More in [Extraction](https://docs.levanto.ai/extract.md).

## Stream decisions

Ask once, append text as it arrives, and get a new answer whenever one changes. See [Streaming decisions](https://docs.levanto.ai/stream.md).

## Endpoints

Base URL: `https://sage.levanto.ai`

| Method | Path | Key | Purpose |
| - | - | - | - |
| GET | `/ready` | No | 200 when ready, 503 while loading |
| POST | `/decide` | Yes | One decision |
| POST | `/decide/batch` | Yes | Many decisions |
| POST | `/v1/extract` | Yes | Typed values from a document |
| POST | `/v1/extract/batch` | Yes | The same fields from many documents |
| GET | `/v1/stream` | Yes | Decisions over growing text (WebSocket) |
| POST | `/usage/estimate` | Yes | Token count before you send a decision |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.