> For clean Markdown of any page, append .md to the page URL.
> For a complete documentation index, see https://respan.ai/docs/llms.txt.
> For AI client integration (Claude Code, Cursor, etc.), connect to the MCP server at https://respan.ai/docs/_mcp/server.

# Quickstart

#### Get an API key

Create a key under [API keys](https://platform.respan.ai/platform/gateway/api-keys), then export it:

```bash
export RESPAN_API_KEY="YOUR_RESPAN_API_KEY"
```

#### Send a request

**`cURL`**

```bash cURL
curl https://api.respan.ai/api/v1/scores \
  -H "Authorization: Bearer $RESPAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "span-01-free",
    "span": {
      "input": [
        { "role": "user", "content": "Please connect me to a person." }
      ],
      "output": {
        "role": "assistant",
        "content": "I will connect you to our support team."
      }
    },
    "behaviors": [
      {
        "id": "escalation",
        "definition": "the user wants a human/agent/representative, or the assistant says a human handoff is needed (not mere frustration or wanting a better answer)."
      }
    ]
  }'
```

**`Python`**

```python Python
import os
import requests

response = requests.post(
    "https://api.respan.ai/api/v1/scores",
    headers={"Authorization": f"Bearer {os.environ['RESPAN_API_KEY']}"},
    json={
        "model": "span-01-free",
        "span": {
            "input": [
                {"role": "user", "content": "Please connect me to a person."}
            ],
            "output": {
                "role": "assistant",
                "content": "I will connect you to our support team.",
            },
        },
        "behaviors": [
            {
                "id": "escalation",
                "definition": "the user wants a human/agent/representative, or the assistant says a human handoff is needed (not mere frustration or wanting a better answer).",
            }
        ],
    },
)
response.raise_for_status()
print(response.json())
```

**`TypeScript`**

```typescript TypeScript
const response = await fetch("https://api.respan.ai/api/v1/scores", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RESPAN_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "span-01-free",
    span: {
      input: [{ role: "user", content: "Please connect me to a person." }],
      output: {
        role: "assistant",
        content: "I will connect you to our support team.",
      },
    },
    behaviors: [
      {
        id: "escalation",
        definition:
          "the user wants a human/agent/representative, or the assistant says a human handoff is needed (not mere frustration or wanting a better answer).",
      },
    ],
  }),
});

console.log(await response.json());
```

`span.input` holds the prior messages. `span.output` is the turn being scored.

#### Read the response

```json
{
  "model": "span-01-free",
  "results": [
    {
      "id": "escalation",
      "p_present": 0.729968,
      "p_absent": 0.25372452,
      "p_not_observable": 0.016307479
    }
  ],
  "usage": {
    "input_tokens": 51
  }
}
```

`p_present` is 0.73, so escalation is likely. `p_absent` is the probability it didn't happen, and `p_not_observable` is the probability the span lacks the evidence to decide. The three sum to about 1.

#### Score your own data

* Replace `span.input` and `span.output` with your conversation.
* Add entries to `behaviors`. Each one needs an `id` and a `definition`, and all of them are scored in one pass.
* Set `model` to `span-01-pro` for span-01. The default, `span-01-free`, is span-01 Lite.

For every request and response field, see the [API reference](/docs/apis/gateway/run-span-01).
