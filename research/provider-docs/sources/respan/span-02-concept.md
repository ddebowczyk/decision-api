> For clean Markdown of any page, append .md to the page URL.
> For a complete documentation index, see https://respan.ai/docs/llms.txt.
> For AI client integration (Claude Code, Cursor, etc.), connect to the MCP server at https://respan.ai/docs/_mcp/server.

# span-02

> span-02 is Respan's decision model. Send a state and typed questions (choice, yes/no, score, number); set a thinking deadline in milliseconds, and span-02 answers by then with its best decision so far.

span-02 is Respan's decision model. Send a state (text or any JSON value, plus up to 4 images) and a set of typed questions. For each question, span-02 returns the answer with its full probability distribution, not generated text you have to parse.

Call it at `POST https://api.respan.ai/api/v1/decisions` with your Respan API key. The body is the System One format, so a System One client works by changing the URL. The [API reference](/docs/apis/gateway/run-span-02) lists every field.

## Question types

One request can mix all four types.

| Type     | `criteria`                                | Answer fields                                                                     |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `choice` | An object of option keys and descriptions | `choice`, `probabilities`, `confidence`                                           |
| `noul`   | Optional `true` and `false` descriptions  | `noul`, the probability of yes                                                    |
| `score`  | A list of levels, from low to high        | `score` (the probability-weighted level), `legend`, `probabilities`, `confidence` |
| `number` | None                                      | `number`, `text`, `confidence`                                                    |

`number` answers with the number itself, so you don't list candidate values as options. [Question types](/docs/documentation/span-02/question-types) shows a request and response for each type.

## Anytime reasoning

Reasoning models let you pick an effort level. span-02 takes a deadline instead: it thinks until the deadline, then answers with its best decision so far. Set it per request in `reasoning`:

| Field       | Values                                                                                           | Default |
| ----------- | ------------------------------------------------------------------------------------------------ | ------- |
| `mode`      | `auto` thinks only when span-02 is unsure; `on` thinks for every question; `off` never thinks    | `auto`  |
| `budget_ms` | The thinking time for the request, in milliseconds, from `0` to `600000`. `0` means no deadline. | `0`     |

```json
"reasoning": { "mode": "on", "budget_ms": 300 }
```

A per-question cap on thought length applies whatever `budget_ms` says. The thought itself is never returned, and its tokens aren't billed.

## Images

Send up to 4 images in `images`, as data URIs or base64. span-02 sees them before the text, so questions can ask about photos, documents or screenshots.

## Billing and limits

* **Credits:** span-02 runs on Respan credits only and is priced per input and output token. Without credits, a call returns `402`.
* **Rate limit:** span-02 has its own per-organization limit, separate from chat completions. Over it, a call returns `429`.
* **No streaming:** `stream: true` returns `400`.
* **Model name:** use `span-02` or `respan/span-02`, or omit `model`. Any other name returns `400`.
* **Timeouts:** if span-02 doesn't answer in time, the call returns `504`. Retry, or send fewer questions or a shorter state.

## Open weights

span-02's weights and inference engine are on [Hugging Face](https://huggingface.co/respanai/span-02), with instructions for hosting it on your own GPU.
