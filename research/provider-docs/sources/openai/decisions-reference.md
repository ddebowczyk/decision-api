[API Reference](https://developers.openai.com/api/reference/python)

[Decisions](https://developers.openai.com/api/reference/python/resources/decisions)

Copy Markdown

# Create a decision

decisions.create(DecisionCreateParams\*\*kwargs)  -> [Decision](https://developers.openai.com/api/reference/python/resources/decisions#(resource)%20decisions%20%3E%20(model)%20decision%20%3E%20(schema))

POST

/decisions

Use this endpoint to quickly answer classification or scoring questions about some input. You can ask multiple questions in one request.

##### ParametersExpand Collapse

input: Union[str, Iterable[[DecisionInputMessageParam](https://developers.openai.com/api/reference/python/resources/decisions#(resource)%20decisions%20%3E%20(model)%20decision_input_message%20%3E%20(schema))]]

The text or images to evaluate for every question. Provide a text string or user messages containing text and images. Images can be base64 data URLs or publicly accessible HTTP(S) URLs; at most 128 images are allowed across all messages in one request. Files, audio, tools, and item references are not supported.

model: str

The model to use. Only `gpt-6-luna` is supported.

minLength0

maxLength1048576

questions: Iterable[Question]

Ask 1–200 questions about the input. Each question can be a predicate, choice, or score. Answers come back in the same order.

prompt\_cache\_key: Optional[str]

Partition prompt cache reuse by caller-provided key.

minLength0

maxLength64

prompt\_cache\_options: Optional[[PromptCacheOptions](https://developers.openai.com/api/reference/python/resources/decisions/methods/create#(resource)%20decisions%20%3E%20(method)%20create%20%3E%20(params)%20default%20%3E%20(param)%20prompt_cache_options%20%3E%20(schema))]

Options for prompt caching. Supported for `gpt-5.6` and later models. By default, OpenAI automatically chooses one implicit cache breakpoint. You can add explicit breakpoints to content blocks with `prompt_cache_breakpoint`. Each request can write up to four breakpoints. For cache matching, OpenAI considers up to the latest 80 breakpoints in the conversation, without a content-block lookback limit. Set `mode` to `explicit` to disable the implicit breakpoint. The `ttl` defaults to `30m`, which is currently the only supported value. See the [prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) for current details.

safety\_identifier: Optional[str]

Opaque caller-provided end-user identifier, scoped by the verified org. Match Responses’ limit; this is never the authenticated user identity.

minLength0

maxLength128

##### ReturnsExpand Collapse

class Decision: …

answers: List[Answer]

Answers in question order. Any question can return a refusal instead of an answer; other questions can still receive answers. A refusal has `type: "refusal"` and the question’s `name`, or `null` if it was unnamed.

model: str

The model used.

minLength0

usage: Usage

Token usage for the request.

### Create a decision

SDK languagePython

```
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  # This is the default and can be omitted
)
decision = client.decisions.create(
    input="string",
    model="model",
    questions=[{
        "instructions": "instructions",
        "type": "predicate",
    }],
)
print(decision.answers)
```

```
{
  "model": "gpt-6-luna",
  "answers": [
    {"type": "predicate", "name": "damaged", "probability": 0.95}
  ],
  "usage": {
    "input_tokens": 42,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 0,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 42
  }
}
```

##### Returns Examples

```
{
  "model": "gpt-6-luna",
  "answers": [
    {"type": "predicate", "name": "damaged", "probability": 0.95}
  ],
  "usage": {
    "input_tokens": 42,
    "input_tokens_details": {"cached_tokens": 0, "cache_write_tokens": 0},
    "output_tokens": 0,
    "output_tokens_details": {"reasoning_tokens": 0},
    "total_tokens": 42
  }
}
```
