> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Images (beta)

> Send an image as content for Yes/No, Choice, Scale and Tags.

Works on `/decide` and on each [batch](https://docs.levanto.ai/decision-model/batch.md) group.

## Request

```json theme={"theme":"github-light"}
{
  "content": {
    "kind": "image",
    "media": "data:image/png;base64,iVBORw0KGgo...",
    "text": "Ticket: the checkout button is missing on mobile."
  },
  "question": {
    "id": "shows_bug",
    "kind": "yesno",
    "instructions": "Does the screenshot show the reported problem?"
  }
}
```

| Field | Description |
| - | - |
| `kind` | `"image"` |
| `media` | Base64 `data:` URI: PNG, JPEG or WebP |
| `text` | Optional context, such as the ticket for a screenshot |

## Response

Same shape as text. `meta.usage` adds `image_tokens`.

```json theme={"theme":"github-light"}
{
  "id": "shows_bug",
  "kind": "yesno",
  "result": { "answer": "yes", "probability": 0.98 },
  "meta": {
    "model": "levanto-sage-2",
    "latency_ms": 251.6,
    "usage": { "input_tokens": 81, "output_tokens": 0, "image_tokens": 313 }
  }
}
```

On images, Tags always return `true` or `false`.

Size and option limits: see [Limits and errors](https://docs.levanto.ai/decision-model/limits.md#images). Image tokens are charged as input tokens; see [Pricing](https://docs.levanto.ai/pricing.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.