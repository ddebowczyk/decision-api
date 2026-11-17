> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming decisions

> Decisions that keep up: the answer updates as the text arrives.

Open a WebSocket, send your questions once, then append text as it arrives: a call transcript, a chat, a document being written. Sage decides on everything said so far and sends a frame whenever an answer changes.

## A live call

```javascript theme={"theme":"github-light"}
const ws = new WebSocket("wss://sage.levanto.ai/v1/stream");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "start",
    api_key: SAGE_API_KEY, // browsers can't set headers
    questions: [
      { id: "agreed", kind: "yesno", instructions: "Has the customer agreed to go ahead?" },
      {
        id: "loan_term",
        kind: "choice",
        instructions: "Which loan term does the customer want?",
        options: [
          { option: "36 months" }, { option: "48 months" },
          { option: "60 months" }, { option: "72 months" }
        ]
      }
    ]
  }));
};

ws.onmessage = (event) => {
  const frame = JSON.parse(event.data);
  if (frame.type === "decision") {
    for (const id of frame.changed) console.log(id, frame.answers[id].result);
  }
};

// Call this for each new line of the transcript.
function append(text) {
  ws.send(JSON.stringify({ type: "append", text }));
}
```

Each line moves the answers:

| Appended line | `agreed` | `loan_term` |
| - | - | - |
| Agent: We can finance it over 72 months. | no | 72 months |
| Customer: Hmm. 72 months feels long. | no | 60 months |
| Agent: A shorter term also gets you a better rate. | no | `null` (too close to call) |
| Customer: OK, 48 months then. Send me the quote. | **yes** (0.98) | 48 months (0.9996) |

The answers are what [`/decide/batch`](https://docs.levanto.ai/decision-model/batch) returns for the same questions. Any decision kind works.

> [!WARNING]
>
> A key sent from a browser can be read by anyone using that page. Use this pattern for your own tools; for public apps, open the stream from your server.

## From a server

Send the key as a header. Append lines as they come, without waiting for a reply: with the default `emit: "changes"`, no frame comes back when nothing changed.

```python theme={"theme":"github-light"}
import asyncio, json, os
from websockets.asyncio.client import connect

QUESTIONS = [{"id": "escalate", "kind": "yesno",
              "instructions": "Does the customer ask for a human agent?"}]

async def feed(ws, lines):
    for line in lines:  # in production: each line as it arrives
        await ws.send(json.dumps({"type": "append", "text": line}))
        await asyncio.sleep(1)
    await ws.send(json.dumps({"type": "close"}))

async def main(lines):
    async with connect("wss://sage.levanto.ai/v1/stream", additional_headers={
        "Authorization": f"Bearer {os.environ['SAGE_API_KEY']}"}) as ws:
        await ws.send(json.dumps({"type": "start", "questions": QUESTIONS}))
        feeder = asyncio.create_task(feed(ws, lines))
        async for raw in ws:
            frame = json.loads(raw)
            if frame["type"] == "decision":
                for qid in frame["changed"]:
                    print(frame["chars"], qid, frame["answers"][qid]["result"])
        await feeder

asyncio.run(main([
    "Agent: How can I help?\n",
    "Customer: I was charged twice for my order.\n",
    "Customer: Your bot is useless, get me a person.\n",
]))
```

```text theme={"theme":"github-light"}
23 escalate {'answer': 'no', 'probability': 0.20487673647223545}
115 escalate {'answer': 'yes', 'probability': 0.997747033957554}
```

Needs `pip install websockets`.

## Frames you send

| Frame | What it does |
| - | - |
| `{"type": "start", "questions": [...]}` | First frame. 1 to 32 questions, each with an `id`. Optional: `content` (the text so far), `reasoning` (`off`, `auto`, `on`), `emit` (`changes` or `all`), `api_key`. |
| `{"type": "append", "text": "...", "seq": 7}` | Adds text to the end. `seq` is optional; the decision that covers it echoes it. |
| `{"type": "questions", "questions": [...]}` | Replaces the questions. The next decision is sent in full. |
| `{"type": "evaluate"}` | Decides now, without new text. |
| `{"type": "ping"}` | Answered with `{"type": "pong"}`. |
| `{"type": "close"}` | Ends the session. |

Text can only be appended. To change earlier text, open a new session. Appends that arrive while Sage is deciding are folded into the next decision.

## Frames you receive

| Frame | Meaning |
| - | - |
| `ready` | The session is open. `limits` lists the session's limits. |
| `decision` | `answers` holds every question's answer; `changed` lists the ones that changed; `chars` is the length of text it covers; `usage` is what this update costs. |
| `error` | `detail` says what went wrong. With `fatal: true` the session closes. |
| `ping` | Sent every 25 seconds to keep the connection open. Ignore it. |
| `sig` | A signature of the previous frame. Ignore it unless you verify the stream. |

A `decision` frame, abridged:

```json theme={"theme":"github-light"}
{
  "type": "decision",
  "seq": null,
  "chars": 115,
  "latency_ms": 117.9,
  "answers": {
    "escalate": {
      "id": "escalate",
      "kind": "yesno",
      "result": {"answer": "yes", "probability": 0.997747033957554},
      "meta": { ... }
    }
  },
  "changed": ["escalate"],
  "usage": {"update": 3, "input_tokens": 68, "document_tokens": 12, "question_tokens": 56, "output_tokens": 155}
}
```

## Reconnecting

When the server restarts, it finishes the decision in progress, sends `{"type": "error", "code": "draining", "fatal": true}` and closes with code 1012. Reconnect and send `start` with the full text in `content`. Nothing is lost.

| Close code | Meaning |
| - | - |
| 1000 | Normal close |
| 1008 | The first frame isn't a valid `start`, or the key is invalid |
| 1009 | The `start` text is over the limit |
| 1012 | The server is restarting: reconnect |

## Usage

Each update is charged for the text that's new since the last one (the whole text on the first), plus the questions. Output is the decision frame as sent. An update with no frame sent (`emit: "changes"` and nothing changed) has no output. `ready`, `ping`, `pong`, `error` and `sig` frames are free.

Questions count on every update, so keep them short. Leave `emit` on `changes`.

## Limits

* Text plus questions: up to 16,384 tokens. An `append` past it is refused with `code: "prompt_too_long"`, and the session stays open.
* 600,000 characters and 32 questions per session.
* A session with no frame from you for 300 seconds closes. Send `ping` to keep it open.

## Verifying a stream

Every server frame is followed by a `sig` frame: an ECDSA P-256 signature chained over all frames so far, so a dropped, reordered or changed frame breaks the chain. The signing key is in `GET /v1/attestation/report`, and the exact scheme is in the [OpenAPI spec](https://sage.levanto.ai/openapi.json) under `/v1/stream`.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.