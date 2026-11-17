> ## Documentation Index
> Fetch the complete documentation index at: https://docs.perplexity.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Judge Citation Accuracy with Decisions API

> Ask the Agent API a question with web search, score every sentence against its sources with the Decisions API, and send low-scoring sentences back to the Agent API to search again. Your code keeps only the rewrites the sources support.

Use the Decisions API to give a confidence score to the `web_search` tool answers from the Agent API. Your application asks the Agent API a question, then sends each cited sentence and its source snippets from the Agent API response to the Decisions API. Your application gets back a probability that the sources support the sentence. Your code compares the probabilities to cutoffs and labels each sentence supported, weak, unsupported, contradicted, or uncited. Low-scoring sentences go back to the Agent API to search again, and your code scores the rewrite the same way.

A web-grounded answer puts a citation after most sentences. A citation marker points to a search result. It does not prove that the sentence is on that page. The Decisions API answers "does passage 2 state or imply this claim" with a probability. Your code compares the probabilities to cutoffs, keeps what the sources support, and renders the report.

Each probability is the model's estimate of how well the snippets you sent support the sentence. It is not proof that the sentence is true, and a supported rewrite can leave out part of the original answer.

<Frame caption="A live run of this recipe on the K2-18b question. The step captions and tool panels were added for the recording, and request IDs are shortened. The script prints the terminal lines and writes out/report.html and out/run.json.">
  <video autoPlay muted loop playsInline controls className="w-full aspect-video" src="https://mintcdn.com/perplexity/8rNAdYblHgrF0oWN/docs/assets/images/cookbook/examples/decisions-api-answer-gate-demo.mp4?fit=max&auto=format&n=8rNAdYblHgrF0oWN&q=85&s=967a5edd6be16bd6be88d9234e00ae03" data-path="docs/assets/images/cookbook/examples/decisions-api-answer-gate-demo.mp4" />
</Frame>

## Why the Decisions API

* **Several probabilities choose an action.** Checkable, support, and contradiction together tell your code which sentences to keep and which need another search. The same policy then scores the rewrites.
* **Probabilities, not prose.** Each yes/no (`noul`) question in this tutorial returns a probability from 0 to 1. Your cutoffs are plain comparisons, with no prose response to parse.
* **Many questions, one request.** One request per sentence asks support and contradiction for each passage, plus whether the sentence is checkable. Two passages return five probabilities.
* **Graded results.** A 0.682 and a 0.986 lead to different actions. Your code keeps the 0.986 and leaves the 0.682 unconfirmed.
* **Works without a source.** A sentence with no citation still gets the checkable question, so your code can tell an uncited claim from a transition.
* **Cheap enough to run on every sentence.** The scoring step costs a small fraction of the Agent API calls around it. See the [pricing page](/docs/getting-started/pricing).
* **Text and images.** This tutorial is text only, but the same endpoint scores screenshots. See [Drive a Browser with the Decisions API](/docs/cookbook/examples/decisions-api-browser-agent/README).

## What you will build

A command-line tool. You give it a question. It gets a live answer from the Agent API, checks every sentence, investigates the weak ones, and writes a report.

The project is five files in one folder:

```text theme={null}
decisions-api-answer-gate/
├── requirements.txt       # packages
├── agent_client.py        # asks and re-asks the Agent API
├── decisions_client.py    # asks the Decisions API
├── answer_gate.py         # labels sentences, runs the review, writes the report
└── test_answer_gate.py    # offline tests
```

Every run takes seven steps:

1. `agent_client.py` asks the Agent API your question with `web_search` enabled. The answer has a marker like `[3]` after each factual sentence, plus numbered search results with snippets.
2. `answer_gate.py` splits the answer into sentences and reads each sentence's markers.
3. `decisions_client.py` sends each sentence and its cited snippets to the Decisions API with three kinds of yes/no question: does each snippet support it, does each snippet contradict it, and is it checkable.
4. `answer_gate.py` compares the probabilities to cutoffs and labels the sentence.
5. For the first four weak, unsupported, contradicted, or uncited sentences, `agent_client.py` asks the Agent API to search again and rewrite the sentence. Any beyond four are marked "not reviewed".
6. `answer_gate.py` scores the rewrite the same way. Supported rewrite sentences replace the original; the rest are dropped. If nothing in the rewrite is supported, the original stays, marked "not confirmed".
7. `answer_gate.py` writes `out/report.html` and `out/run.json`.

The Agent API searches and writes. The Decisions API returns probabilities. Only `answer_gate.py` labels sentences and chooses what to keep.

One run makes one Agent API call, up to four more for investigations, and one Decisions API request for every original and rewrite sentence. Retries can add attempts.

## What you need

* Python 3.10 or newer on macOS or Linux. Check with `python3 --version`; on macOS the system `python3` can be older.
* A Perplexity API key from the [API Console](https://www.perplexity.ai/account/api). One key works for both APIs.

## Set up

`requirements.txt` pins the two packages to the tested versions. `httpx` sends the requests. `pytest` runs the tests.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  pytest==9.1.1
  ```
</Accordion>

Run these commands. Save `requirements.txt` in the new folder when the comment says to.

<Accordion title="Install and set your key">
  ```bash theme={null}
  mkdir decisions-api-answer-gate && cd decisions-api-answer-gate
  # save requirements.txt here, then continue
  python3 -m venv .venv
  source .venv/bin/activate
  python -m pip install -r requirements.txt
  export PERPLEXITY_API_KEY="your-api-key-here"
  ```
</Accordion>

In a new terminal, run the `source` and `export` lines again.

## The Agent API client: agent\_client.py

`agent_client.py` makes two kinds of Agent API call: the first answer, and the follow-up search for one sentence.

### Settings and types

<Accordion title="Settings and types">
  ```python agent_client.py (part 1 of 3) theme={null}
  """Ask the Agent API questions with web search, and keep the text plus the search results it cited."""

  from __future__ import annotations

  import os
  from dataclasses import dataclass
  from typing import Any

  import httpx

  AGENT_URL = "https://api.perplexity.ai/v1/agent"
  PRESET = "fast"
  INSTRUCTIONS = (
      "Answer in plain prose paragraphs with no bullet points, headings, or bold text. "
      "Put a citation marker like [3] at the end of every sentence that states a fact, "
      "citing the search result that supports it. Write every sentence so it makes sense on its own: "
      "name the subject instead of starting with it, its, or they."
  )


  @dataclass(frozen=True)
  class Source:
      id: int
      url: str
      title: str
      snippet: str


  @dataclass(frozen=True)
  class Answer:
      text: str
      sources: dict[int, Source]
  ```
</Accordion>

`INSTRUCTIONS` asks for plain prose, a marker after every factual sentence, and sentences that name their subject instead of starting with "it". Each sentence is scored on its own, so "It reaches end of life in 2029" is hard to check without the sentence before it. The model does not always follow this; you will still see some "Its" sentences.

### Asking and investigating

<Accordion title="Asking and investigating">
  ```python agent_client.py (part 2 of 3) theme={null}
  def ask(question: str) -> Answer:
      """Answer a question with web search."""
      return _post(question)


  def investigate(question: str, answer: str, sentence: str) -> Answer:
      """Search again for one sentence the sources did not back, and get a replacement for it."""
      prompt = (
          f'Question: "{question}"\n\nAnswer:\n{answer}\n\n'
          f'The sources did not clearly support this sentence from the answer:\n\n"{sentence}"\n\n'
          "Search for evidence about this sentence. Write the fewest sentences (one to three) that could replace it, "
          "stating only what the sources you find support and correcting anything that is wrong. "
          "Do not repeat facts the rest of the answer already states. Leave out any part you cannot support."
      )
      return _post(prompt)


  def _post(prompt: str) -> Answer:
      body = {
          "input": prompt,
          "preset": PRESET,
          "instructions": INSTRUCTIONS,
          "tools": [{"type": "web_search"}],
      }
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      response = httpx.post(AGENT_URL, headers=headers, json=body, timeout=120.0)
      response.raise_for_status()
      return parse(response.json())
  ```
</Accordion>

`ask` sends your question. `investigate` sends the question, the full first answer for context, and the one sentence that scored low. It asks for the fewest replacement sentences, one to three, that state only what the sources support and do not repeat the rest of the answer. Both calls enable `web_search`. The prompt asks for a fresh search, and `parse` requires search results in the response.

### Reading the response

<Accordion title="Reading the response">
  ```python agent_client.py (part 3 of 3) theme={null}
  def parse(raw: dict[str, Any]) -> Answer:
      """Pull the answer text and the numbered search results out of a response."""
      text = ""
      sources: dict[int, Source] = {}
      for item in raw["output"]:
          if item["type"] == "message":
              text = "\n\n".join(part["text"] for part in item["content"] if part["type"] == "output_text")
          elif item["type"] == "search_results":
              for result in item["results"]:
                  sources[int(result["id"])] = Source(
                      id=int(result["id"]),
                      url=result["url"],
                      title=result.get("title", ""),
                      snippet=result.get("snippet", ""),
                  )
      if not text:
          raise ValueError("The Agent API response has no message text.")
      if not sources:
          raise ValueError("The Agent API response has no search results; the model answered without searching.")
      return Answer(text=text, sources=sources)
  ```
</Accordion>

The response has a `message` with the text and `search_results` with numbered sources. The marker `[3]` means result `id` 3. `parse` keeps each result's `url`, `title`, and `snippet`. The snippet is the passage the Decisions API scores against. If the model answered without searching, `parse` raises an error.

## The Decisions API client: decisions\_client.py

`decisions_client.py` scores one sentence at a time.

### Settings and the result type

<Accordion title="Settings and the result type">
  ```python decisions_client.py (part 1 of 3) theme={null}
  """Ask the Decisions API how well a set of passages supports one claim."""

  from __future__ import annotations

  import os
  import time
  from dataclasses import dataclass
  from typing import Any

  import httpx

  DECISIONS_URL = "https://api.perplexity.ai/v1/decisions"
  MODEL = "pplx-decider-latest"
  RETRIES = 2
  RETRY_STATUSES = {429, 500, 502, 503}


  @dataclass(frozen=True)
  class Verdict:
      """Probabilities from one request. Nothing here is a decision yet."""

      checkable: float
      supports: dict[int, float]  # passage number -> P(passage supports the claim)
      contradicts: dict[int, float]  # passage number -> P(passage contradicts the claim)
      input_tokens: int
      output_tokens: int
      seconds: float
      request_id: str
  ```
</Accordion>

`Verdict` holds the probabilities and usage the API returned. It holds no labels.

### The request

<Accordion title="The request">
  ```python decisions_client.py (part 2 of 3) theme={null}
  def build_request(claim: str, passages: dict[int, str]) -> dict[str, Any]:
      """One claim, numbered passages, and 2N + 1 yes/no questions about them."""
      state = {
          "claim": claim,
          "passages": {str(n): text for n, text in passages.items()},
      }
      questions: dict[str, Any] = {
          "checkable": {
              "type": "noul",
              "instructions": (
                  "Is the claim a factual statement that could be verified against a source? "
                  "Opinions, transitions, and questions are not checkable."
              ),
          }
      }
      for n in passages:
          questions[f"supports_{n}"] = {
              "type": "noul",
              "instructions": (
                  f"Does passage {n} state or directly imply the claim? "
                  "Being about the same topic is not support; the passage has to back the specific claim."
              ),
          }
          questions[f"contradicts_{n}"] = {
              "type": "noul",
              "instructions": f"Does passage {n} state something that cannot be true if the claim is true?",
          }
      return {"model": MODEL, "state": state, "questions": questions}
  ```
</Accordion>

The state is a JSON object with the claim and numbered passages. Every question is a `noul`, which returns the probability that the answer is yes.

* `checkable`: is the sentence a factual statement? Questions and opinions are not.
* `supports_N`: does passage N state or directly imply the claim? Being on the same topic does not count.
* `contradicts_N`: does passage N say something that cannot be true if the claim is true?

A sentence with no citation gets only `checkable`. Separate support and contradiction questions, instead of one `choice`, let your code see a sentence that one source supports and another contradicts.

### Sending it

<Accordion title="Sending it">
  ```python decisions_client.py (part 3 of 3) theme={null}
  def score(claim: str, passages: dict[int, str], client: httpx.Client | None = None) -> Verdict:
      """Send the request, retrying briefly on 429, 500, 502, and 503, and return the probabilities."""
      if client is None:
          with httpx.Client(timeout=90.0) as new_client:
              return score(claim, passages, new_client)
      body = build_request(claim, passages)
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      started = time.perf_counter()
      for attempt in range(RETRIES + 1):
          response = client.post(DECISIONS_URL, headers=headers, json=body)
          if response.status_code in RETRY_STATUSES and attempt < RETRIES:
              time.sleep(float(response.headers.get("Retry-After", "1")))
              continue
          response.raise_for_status()
          break
      data = response.json()
      answers = data["answers"]
      return Verdict(
          checkable=answers["checkable"]["noul"],
          supports={n: answers[f"supports_{n}"]["noul"] for n in passages},
          contradicts={n: answers[f"contradicts_{n}"]["noul"] for n in passages},
          input_tokens=data["usage"]["input_tokens"],
          output_tokens=data["usage"]["output_tokens"],
          seconds=round(time.perf_counter() - started, 3),
          request_id=response.headers.get("x-request-id", ""),
      )
  ```
</Accordion>

`score` sends the request and retries twice on `429`, `500`, `502`, or `503`, waiting `Retry-After` seconds when given. It keeps the `x-request-id` header for support requests. The tests use the `client` argument to pass a fake transport.

## The gate: answer\_gate.py

`answer_gate.py` turns probabilities into labels and runs the review. It is shown in six parts.

### Cutoffs and the sentence record

<Accordion title="Cutoffs and the sentence record">
  ```python answer_gate.py (part 1 of 6) theme={null}
  """Check every sentence of a web-grounded answer, and send the weak ones back for another search.

  The Agent API writes and rewrites. The Decisions API returns probabilities.
  Only this file compares probabilities to cutoffs and chooses what to do with each sentence.
  """

  from __future__ import annotations

  import argparse
  import html
  import json
  import os
  import re
  import sys
  import time
  from dataclasses import asdict, dataclass, field
  from pathlib import Path

  import agent_client
  import decisions_client
  from agent_client import Answer

  # Cutoffs. Starting points, not validated production values.
  CHECKABLE_CUTOFF = 0.5
  CONTRADICTED_CUTOFF = 0.6
  SUPPORTED_CUTOFF = 0.7
  WEAK_CUTOFF = 0.4

  NEEDS_REVIEW = {"weak", "unsupported", "contradicted", "uncited"}
  MAX_INVESTIGATIONS = 4  # caps the extra Agent API calls per answer

  COLORS = {
      "supported": "#d4edda",
      "weak": "#fff3cd",
      "unsupported": "#f8d7da",
      "contradicted": "#f1948a",
      "uncited": "#e9ecef",
      "not_checkable": "transparent",
  }


  @dataclass
  class Sentence:
      index: int
      paragraph: int
      text: str  # claim without citation markers
      source_ids: list[int]
      missing_ids: list[int] = field(default_factory=list)  # cited, but not in the search results
      passages: dict[int, str] = field(default_factory=dict)  # the snippets sent to the Decisions API
      urls: dict[int, str] = field(default_factory=dict)
      label: str = ""
      rule: str = ""
      checkable: float = 0.0
      supports: dict[int, float] = field(default_factory=dict)
      contradicts: dict[int, float] = field(default_factory=dict)
      input_tokens: int = 0
      request_id: str = ""  # include this when you contact support
      outcome: str = ""  # "replaced", "not confirmed", or "not reviewed" (over the limit)
      revision: list[Sentence] = field(default_factory=list)
  ```
</Accordion>

The four cutoffs are starting points, not tested production values. Tune them on labeled examples of your own answers. `NEEDS_REVIEW` lists the labels that trigger a second search, and `MAX_INVESTIGATIONS` caps how many follow-up Agent API calls one answer can make. `Sentence` records the claim, the passages it was scored against, every probability, the request ID, and its rewrite.

### Sentences

<Accordion title="Sentences">
  ```python answer_gate.py (part 2 of 6) theme={null}
  # ---- Sentences --------------------------------------------------------------

  # Move markers that sit before the final punctuation ("fact [1].") to after it ("fact. [1]").
  MARKERS_BEFORE_END = re.compile(r"((?:\s*\[\d+\])+)\s*([.!?])")
  # A sentence ends at . ! or ? plus any closing quotes, unless the period follows an initial ("John J.")
  # or "e.g." / "i.e.". Trailing [n] markers belong to it. Text with no final punctuation is one sentence.
  SENTENCE = re.compile(
      r"(.+?(?:(?<!\s[A-Z])(?<!e\.g)(?<!i\.e)[.!?][\"'”’)]*|$))((?:\s*\[\d+\])*)(?:\s+|$)",
      re.DOTALL,
  )
  MARKER = re.compile(r"\[(\d+)\]")


  def split_sentences(text: str) -> list[Sentence]:
      """Cut the answer at sentence ends and attach each trailing [n] marker to its sentence."""
      sentences: list[Sentence] = []
      paragraphs = [p.strip() for p in text.replace("**", "").split("\n\n") if p.strip()]
      for number, paragraph in enumerate(paragraphs, start=1):
          paragraph = MARKERS_BEFORE_END.sub(r"\2\1", paragraph)
          matched = 0
          for match in SENTENCE.finditer(paragraph):
              body, markers = match.group(1), match.group(2)
              claim = MARKER.sub("", body).strip()
              ids = [int(m) for m in MARKER.findall(body + markers)]
              if claim:
                  sentences.append(Sentence(len(sentences) + 1, number, claim, ids))
              matched += len(match.group(0))
          if matched != len(paragraph):
              raise ValueError(f"Could not split paragraph {number}: {paragraph[matched:][:80]!r}")
      return sentences
  ```
</Accordion>

The splitter cuts at `.`, `!`, or `?` plus any closing quote, and collects the `[n]` markers after it. It also moves markers written before the period (`fact [1].`) to after it, keeps "John J. Hopfield", "e.g.", and "i.e." whole, and treats text with no final punctuation as one sentence. If any text is left over, it raises an error instead of dropping it. It is built for the plain prose the instructions ask for; abbreviations like "Dr." can still split a sentence.

### The policy

<Accordion title="The policy">
  ```python answer_gate.py (part 3 of 6) theme={null}
  # ---- Policy -----------------------------------------------------------------


  def label(sentence: Sentence, verdict: decisions_client.Verdict) -> None:
      """Compare probabilities to cutoffs. First matching rule wins."""
      sentence.checkable, sentence.supports, sentence.contradicts = (
          verdict.checkable,
          verdict.supports,
          verdict.contradicts,
      )
      sentence.input_tokens, sentence.request_id = verdict.input_tokens, verdict.request_id
      best_support = max(verdict.supports.values(), default=0.0)
      worst_contradiction = max(verdict.contradicts.values(), default=0.0)
      if verdict.checkable < CHECKABLE_CUTOFF:
          sentence.label, sentence.rule = "not_checkable", f"checkable {verdict.checkable:.3f}"
      elif worst_contradiction >= CONTRADICTED_CUTOFF:
          sentence.label, sentence.rule = "contradicted", f"contradicts {worst_contradiction:.3f}"
      elif not verdict.supports:
          sentence.label, sentence.rule = "uncited", f"checkable {verdict.checkable:.3f}, no citation"
      elif best_support >= SUPPORTED_CUTOFF:
          sentence.label, sentence.rule = "supported", f"supports {best_support:.3f}"
      elif best_support >= WEAK_CUTOFF:
          sentence.label, sentence.rule = "weak", f"supports {best_support:.3f}"
      else:
          sentence.label, sentence.rule = "unsupported", f"supports {best_support:.3f}"
      if sentence.missing_ids:
          sentence.rule += f"; cited {sentence.missing_ids} but no such search result"
  ```
</Accordion>

First matching rule wins:

| Order | Rule | Label |
| - | - | - |
| 1 | `checkable` below 0.5 | `not_checkable` |
| 2 | any `contradicts` at or above 0.6 | `contradicted` |
| 3 | no usable citation | `uncited` |
| 4 | best `supports` at or above 0.7 | `supported` |
| 5 | best `supports` from 0.4 to 0.7 | `weak` |
| 6 | otherwise | `unsupported` |

Contradiction comes before support, so a sentence that one passage supports and another contradicts is `contradicted`. A marker that points to a search result that does not exist is noted in the rule. Probabilities print with three decimals, so a 0.696 near the 0.7 cutoff does not show as 0.70. The comparison uses the full value, which `run.json` keeps: a 0.6999 prints as 0.700 and is still `weak`.

### The loop

<Accordion title="The loop">
  ```python answer_gate.py (part 4 of 6) theme={null}
  # ---- The loop ---------------------------------------------------------------


  def score_answer(answer: Answer, indent: str = "  ") -> list[Sentence]:
      """One Decisions API request per sentence. Uncited sentences still get the checkable question."""
      sentences = split_sentences(answer.text)
      for sentence in sentences:
          found = [n for n in sentence.source_ids if n in answer.sources]
          sentence.missing_ids = [n for n in sentence.source_ids if n not in answer.sources]
          sentence.passages = {n: answer.sources[n].snippet for n in found}
          sentence.urls = {n: answer.sources[n].url for n in found}
          label(sentence, decisions_client.score(sentence.text, sentence.passages))
          print(f"{indent}{sentence.index:>2}  {sentence.label:<13} {sentence.rule:<28} {sentence.text[:60]}")
      return sentences


  def review(question: str, answer: Answer, sentences: list[Sentence]) -> None:
      """Send low-scoring sentences back to the Agent API, then score what it returns."""
      flagged = [s for s in sentences if s.label in NEEDS_REVIEW]
      for sentence in flagged[MAX_INVESTIGATIONS:]:
          sentence.outcome = "not reviewed"
      for sentence in flagged[:MAX_INVESTIGATIONS]:
          print(f"\nInvestigating sentence {sentence.index} ({sentence.label}). Scoring the rewrite:")
          rewrite = agent_client.investigate(question, answer.text, sentence.text)
          sentence.revision = score_answer(rewrite, indent="    -> ")
          confirmed = any(r.label == "supported" for r in sentence.revision)
          sentence.outcome = "replaced" if confirmed else "not confirmed"
          print(f"    {sentence.outcome}")


  def final_sentences(sentences: list[Sentence]) -> list[Sentence]:
      """The answer after review: a replaced sentence becomes the supported sentences of its rewrite."""
      return [r for s in sentences for r in (kept(s.revision) if s.outcome == "replaced" else [s])]


  def kept(revision: list[Sentence]) -> list[Sentence]:
      return [r for r in revision if r.label == "supported"]
  ```
</Accordion>

`score_answer` sends one Decisions API request per sentence and prints each label as it arrives. `review` sends the first four low-scoring sentences to `investigate`, scores each rewrite with the same `score_answer`, and keeps the rewrite if any of its sentences are supported. Low-scoring sentences past the limit are marked "not reviewed". `final_sentences` builds the answer you keep: supported sentences stay, replaced sentences become the supported part of their rewrite, and "not confirmed" sentences stay with their low label.

### Output

<Accordion title="Output">
  ```python answer_gate.py (part 5 of 6) theme={null}
  # ---- Output -----------------------------------------------------------------


  def evidence_rows(s: Sentence, note: str = "") -> str:
      """One table row per sentence, with every passage it was scored against."""
      passages = "".join(
          f"<details><summary>supports {s.supports[n]:.3f}, contradicts {s.contradicts[n]:.3f} "
          f'<a href="{html.escape(s.urls[n])}">source</a></summary><blockquote>{html.escape(text)}</blockquote></details>'
          for n, text in s.passages.items()
      )
      return (
          f'<tr><td style="background:{COLORS[s.label]}">{s.label}</td>'
          f"<td>{note}{plain(s.text)}<br><small>{html.escape(s.rule)}; request {s.request_id}</small>{passages}</td></tr>"
      )


  def plain(text: str) -> str:
      """Answer text for display: escaped, without Markdown backticks. Passages stay exactly as sent."""
      return html.escape(text.replace("`", ""))


  def write_report(question: str, sentences: list[Sentence], path: Path) -> None:
      """The final answer colored by label, then a table of the evidence behind every score."""
      paragraphs: dict[int, list[str]] = {}
      numbers: dict[str, int] = {}  # rewrites come from separate searches, so number citations by URL
      for s in sentences:
          replaced = s.outcome == "replaced"
          for r in kept(s.revision) if replaced else [s]:
              cites = "".join(
                  f' <a href="{html.escape(url)}">[{numbers.setdefault(url, len(numbers) + 1)}]</a>'
                  for url in r.urls.values()
              )
              underline = "border-bottom:2px solid #555" if replaced else ""
              badge = f" <small>({s.outcome})</small>" if s.outcome and not replaced else ""
              paragraphs.setdefault(s.paragraph, []).append(
                  f'<span style="background:{COLORS[r.label]};{underline}">{plain(r.text)}{cites}{badge}</span>'
              )
      answer = "".join(f"<p>{' '.join(spans)}</p>" for spans in paragraphs.values())
      rows = ""
      for s in sentences:
          rows += evidence_rows(s)
          for r in s.revision:
              used = "used" if s.outcome == "replaced" and r.label == "supported" else "not used"
              rows += evidence_rows(r, note=f"<b>Rewrite, {used}:</b> ")
      legend = " ".join(f'<span style="background:{c};padding:2px 6px">{k}</span>' for k, c in COLORS.items())
      path.write_text(
          "<!doctype html><meta charset='utf-8'><style>body{font:16px/1.6 sans-serif;max-width:48em;margin:3em auto}"
          "td{vertical-align:top;padding:6px;border-top:1px solid #ddd}blockquote{font-size:13px;color:#444}"
          f"a{{color:inherit}}</style><h2>{html.escape(question)}</h2><p>{legend} "
          f"<span style='border-bottom:2px solid #555'>replaced after review</span></p>{answer}"
          f"<h3>Evidence</h3><table>{rows}</table>"
      )


  def summarize(sentences: list[Sentence], seconds: float) -> dict[str, object]:
      everything = sentences + [r for s in sentences for r in s.revision]
      final = final_sentences(sentences)
      return {
          "sentences": len(sentences),
          "investigated": sum(1 for s in sentences if s.revision),
          "replaced": sum(1 for s in sentences if s.outcome == "replaced"),
          "decisions_requests": len(everything),
          "decisions_input_tokens": sum(s.input_tokens for s in everything),
          "seconds": round(seconds, 1),
          "before": {k: n for k in COLORS if (n := sum(1 for s in sentences if s.label == k))},
          "after": {k: n for k in COLORS if (n := sum(1 for s in final if s.label == k))},
      }
  ```
</Accordion>

`write_report` shows the final answer colored by label, with replaced sentences underlined and "not confirmed" or "not reviewed" next to originals that stayed. Rewrites come from separate searches, so citations are renumbered by URL. Below the answer, the evidence table lists every scored sentence, including dropped rewrite sentences, with each passage's probabilities, the request ID, and the passage exactly as sent. `summarize` counts sentences, investigations, Decisions API requests, input tokens, and labels before and after review.

### Command line

<Accordion title="Command line">
  ```python answer_gate.py (part 6 of 6) theme={null}
  # ---- Command line -----------------------------------------------------------


  def main() -> None:
      parser = argparse.ArgumentParser(description="Check every sentence of a web-grounded answer.")
      parser.add_argument("question", help="The question to ask the Agent API.")
      parser.add_argument("--out", default="out", help="Output directory.")
      args = parser.parse_args()
      if not os.environ.get("PERPLEXITY_API_KEY"):
          sys.exit("Set PERPLEXITY_API_KEY first: export PERPLEXITY_API_KEY=pplx-...")
      out = Path(args.out)
      out.mkdir(exist_ok=True)

      started = time.perf_counter()
      print("Asking the Agent API...")
      answer = agent_client.ask(args.question)
      print("Scoring each sentence with the Decisions API:")
      sentences = score_answer(answer)
      try:
          review(args.question, answer, sentences)
      finally:  # if a review request fails, save the first pass and the completed investigations
          summary = summarize(sentences, time.perf_counter() - started)
          print(f"\n{json.dumps(summary)}")
          write_report(args.question, sentences, out / "report.html")
          run = {"summary": summary, "sentences": [asdict(s) for s in sentences]}
          (out / "run.json").write_text(json.dumps(run, indent=1))
          print(f"Report: {out / 'report.html'}")


  if __name__ == "__main__":
      main()
  ```
</Accordion>

The script takes one question and an optional `--out` folder. It writes `report.html` and `run.json`, which holds every sentence, passage, probability, and request ID. If a review request fails, it still writes both files with the first-pass scores and every investigation that completed. The investigation that failed is not saved.

## Test it

Save all five files in your folder, then run the tests before your first live run. They need no API key or network. They cover sentence splitting, the label rules, the request body, retries, and the review step with fake API responses.

<Accordion title="test_answer_gate.py">
  ```python test_answer_gate.py theme={null}
  """Offline tests. No API key, no network. Run with: python -m pytest -q"""

  from __future__ import annotations

  from pathlib import Path

  import httpx
  import pytest

  import agent_client
  import answer_gate
  import decisions_client
  from agent_client import Answer, Source
  from decisions_client import Verdict


  def verdict(
      supports: dict[int, float], contradicts: dict[int, float] | None = None, checkable: float = 0.95
  ) -> Verdict:
      """Made-up probabilities in the shape the Decisions API returns."""
      contradicts = contradicts or {n: 0.0 for n in supports}
      return Verdict(checkable, supports, contradicts, input_tokens=100, output_tokens=0, seconds=0.1, request_id="t")


  def label_of(v: Verdict) -> str:
      sentence = answer_gate.Sentence(1, 1, "claim", [1])
      answer_gate.label(sentence, v)
      return sentence.label


  def test_split_keeps_every_sentence_and_its_markers() -> None:
      text = "John J. Hopfield won, e.g. for nets.[1] He said “it works.” [2][3] Known fact [4].\n\nNo end mark [5]"
      sentences = answer_gate.split_sentences(text)
      assert [s.source_ids for s in sentences] == [[1], [2, 3], [4], [5]]
      assert [s.paragraph for s in sentences] == [1, 1, 1, 2]
      assert sentences[2].text == "Known fact."


  def test_policy_order_and_bands() -> None:
      assert label_of(verdict({1: 0.9}, {1: 0.7})) == "contradicted"  # contradiction beats support
      assert label_of(verdict({1: 0.9})) == "supported"
      assert label_of(verdict({1: 0.5})) == "weak"
      assert label_of(verdict({1: 0.1})) == "unsupported"
      assert label_of(verdict({}, checkable=0.9)) == "uncited"
      assert label_of(verdict({1: 0.9}, checkable=0.2)) == "not_checkable"


  def test_request_has_one_question_per_passage_plus_checkable() -> None:
      body = decisions_client.build_request("claim", {4: "a", 7: "b"})
      assert set(body["questions"]) == {"checkable", "supports_4", "contradicts_4", "supports_7", "contradicts_7"}
      assert all(q["type"] == "noul" for q in body["questions"].values())


  def test_retry_on_429_honors_retry_after(monkeypatch: pytest.MonkeyPatch) -> None:
      monkeypatch.setenv("PERPLEXITY_API_KEY", "test")
      sleeps: list[float] = []
      monkeypatch.setattr("time.sleep", sleeps.append)
      ok = {
          "answers": {"checkable": {"noul": 0.9}, "supports_1": {"noul": 0.8}, "contradicts_1": {"noul": 0.1}},
          "usage": {"input_tokens": 50, "output_tokens": 0},
      }
      replies = iter([httpx.Response(429, headers={"Retry-After": "2"}), httpx.Response(200, json=ok)])
      client = httpx.Client(transport=httpx.MockTransport(lambda request: next(replies)))
      assert decisions_client.score("claim", {1: "passage"}, client=client).supports == {1: 0.8}
      assert sleeps == [2.0]


  def test_review_keeps_only_supported_rewrite_sentences(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      source = {1: Source(1, "https://example.com", "t", "snippet with `code`")}
      answer = Answer("Good claim. [1] Weak claim. [1] Bad claim. [1] Missing claim. [9]", source)
      rewrites = {"Weak claim.": "Better claim. [1] Extra guess. [1]", "Bad claim.": "Still bad. [1]"}
      probabilities = {
          "Good claim.": 0.9,
          "Weak claim.": 0.5,
          "Bad claim.": 0.1,
          "Better claim.": 0.95,
          "Still bad.": 0.2,
          "Extra guess.": 0.3,
      }
      monkeypatch.setattr(agent_client, "investigate", lambda q, a, s: Answer(rewrites.get(s, "Nothing. [1]"), source))
      monkeypatch.setattr(
          decisions_client, "score", lambda claim, p: verdict({n: probabilities.get(claim, 0.9) for n in p})
      )

      sentences = answer_gate.score_answer(answer)
      answer_gate.review("q", answer, sentences)

      assert [s.outcome for s in sentences] == ["", "replaced", "not confirmed", "replaced"]
      assert sentences[3].missing_ids == [9] and "no such search result" in sentences[3].rule
      final = [s.text for s in answer_gate.final_sentences(sentences)]
      assert final == ["Good claim.", "Better claim.", "Bad claim.", "Nothing."]
      answer_gate.write_report("q", sentences, tmp_path / "report.html")
      report = (tmp_path / "report.html").read_text()
      assert "(not confirmed)" in report and "snippet with `code`" in report
  ```
</Accordion>

<Accordion title="Run the tests">
  ```bash theme={null}
  python -m pytest -q
  ```

  ```text theme={null}
  .....                                                                    [100%]
  5 passed in 0.03s
  ```
</Accordion>

## Run it

Each run asks the Agent API live, so the answer, the sources, and the scores change from run to run. Use a separate `--out` folder for each question.

<Accordion title="Run the gate">
  ```bash theme={null}
  python answer_gate.py "What did the James Webb Space Telescope discover about exoplanet K2-18b?" --out out_k2
  open out_k2/report.html   # macOS; on Linux use xdg-open
  ```
</Accordion>

Recorded on 2026-10-07 at 21:11 UTC with `pplx-decider-v1.1-27b`. Your output will differ. The recorded run wrote to a different `--out` folder, so its last line shows that path instead of `out_k2`.

<Accordion title="Observed output">
  ```text theme={null}
  Asking the Agent API...
  Scoring each sentence with the Decisions API:
     1  uncited       checkable 0.999, no citation The James Webb Space Telescope detected methane and carbon d
     2  weak          supports 0.643               The relatively low amount of ammonia is consistent with—but 
     3  uncited       checkable 0.996, no citation Webb researchers also reported possible traces of dimethyl s
     4  supported     supports 0.962               That signal has been tentative and debated; it is not eviden

  Investigating sentence 1 (uncited). Scoring the rewrite:
      ->  1  supported     supports 0.856               Webb’s NIRISS and NIRSpec observations showed methane and ca
      replaced

  Investigating sentence 2 (weak). Scoring the rewrite:
      ->  1  supported     supports 0.986               The ammonia shortage was interpreted as consistent with a wa
      replaced

  Investigating sentence 3 (uncited). Scoring the rewrite:
      ->  1  weak          supports 0.682               A 2025 JWST study reported a tentative signal consistent wit
      not confirmed

  {"sentences": 4, "investigated": 3, "replaced": 2, "decisions_requests": 7, "decisions_input_tokens": 20625, "seconds": 14.3, "before": {"supported": 1, "weak": 1, "uncited": 2}, "after": {"supported": 3, "uncited": 1}}
  Report: scratch/live3/r4/report.html
  ```
</Accordion>

## Reading the output

**First pass.** One sentence scored supported. Sentence 2 scored weak at 0.643. Sentences 1 and 3 came back with no citation marker, so each got only the `checkable` question and was labeled `uncited`.

**Investigation.** All three went back to the Agent API.

* Sentence 1's rewrite scored 0.856 and replaced it. The rewrite also adds that later analyses questioned the carbon dioxide evidence.
* Sentence 2's rewrite scored 0.986 and replaced it. The original said low ammonia is consistent with a water ocean. The rewrite adds that a magma ocean could also explain it.
* Sentence 3's rewrite scored 0.682, just under the 0.7 cutoff. Your code left the original in place, marked "not confirmed".

**Cost and time.** The run made 4 Agent API calls and 7 Decisions API requests for 20,625 input tokens, in 14.3 seconds.

**Other live runs** on the same code:

| Question | Sentences | Investigated | Replaced | Seconds |
| - | - | - | - | - |
| Who won the 2024 Nobel Prize in Physics and for what work? | 2 | 0 | 0 | 2.9 |
| What were the release dates and headline features of Python 3.12 and Python 3.13, and when does each reach end of life? | 6 | 4 | 4 | 21.9 |
| What are the current rate limits and pricing for the Perplexity Agent API? | 9 | 1 | 1 | 12.5 |
| How tall is the Eiffel Tower today, and how much has its height changed since it opened? | 2 | 2 | 2 | 10.2 |

**What the scores mean.** Each probability is the model's estimate that one passage supports one sentence. It does not measure real-world truth or source quality, and the code uses the best single passage rather than combining them.

* Some derived claims scored low in our runs, even when a reader could infer them from the passages.
* A supported sentence can carry a source's extra precision. In one test run, a rewrite took an exact end-of-life day from a version tracker, while the official Python schedule gives only the month.
* Dropping unsupported rewrite sentences can remove true details. In one run, a sentence listing Python 3.13 features was replaced by a single supported sentence about colored tracebacks.
* Green means supported, not well edited. Rewrites can repeat facts from elsewhere in the answer.

## Adapt it

* **Raise the bar for specific claims.** Add a `score` question with levels like "general", "specific", and "contains a number or date", and require more support for specific sentences.
* **Change what happens to unconfirmed sentences.** Drop them, flag them in your UI, or send them to a human reviewer instead of keeping them.
* **Check that a rewrite still answers the question.** Add a `noul` question asking whether the replacement keeps the essential information of the original. Like the cutoffs, test it on your own answers first.
* **Run it before an answer reaches a user.** Call `score_answer` and `review` in your application, and alert when the share of unconfirmed sentences changes.

## Troubleshooting

* **`Set PERPLEXITY_API_KEY first`**: run the `export` line in this terminal.
* **`401` from either API**: the key is wrong or inactive.
* **`The Agent API response has no search results`**: the model answered without searching. Ask again or rephrase.
* **`Could not split paragraph`**: the answer has text the splitter does not recognize. The error shows the text; adjust `SENTENCE` for it.
* **Many sentences are `uncited`**: the model skipped citation markers. The review step investigates them, up to `MAX_INVESTIGATIONS`.
* **`429`**: you hit the rate limit. The client retries twice; wait and rerun if it still fails.

## The complete files

Each file in full, for copying.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  pytest==9.1.1
  ```
</Accordion>

<Accordion title="agent_client.py">
  ```python agent_client.py theme={null}
  """Ask the Agent API questions with web search, and keep the text plus the search results it cited."""

  from __future__ import annotations

  import os
  from dataclasses import dataclass
  from typing import Any

  import httpx

  AGENT_URL = "https://api.perplexity.ai/v1/agent"
  PRESET = "fast"
  INSTRUCTIONS = (
      "Answer in plain prose paragraphs with no bullet points, headings, or bold text. "
      "Put a citation marker like [3] at the end of every sentence that states a fact, "
      "citing the search result that supports it. Write every sentence so it makes sense on its own: "
      "name the subject instead of starting with it, its, or they."
  )


  @dataclass(frozen=True)
  class Source:
      id: int
      url: str
      title: str
      snippet: str


  @dataclass(frozen=True)
  class Answer:
      text: str
      sources: dict[int, Source]


  def ask(question: str) -> Answer:
      """Answer a question with web search."""
      return _post(question)


  def investigate(question: str, answer: str, sentence: str) -> Answer:
      """Search again for one sentence the sources did not back, and get a replacement for it."""
      prompt = (
          f'Question: "{question}"\n\nAnswer:\n{answer}\n\n'
          f'The sources did not clearly support this sentence from the answer:\n\n"{sentence}"\n\n'
          "Search for evidence about this sentence. Write the fewest sentences (one to three) that could replace it, "
          "stating only what the sources you find support and correcting anything that is wrong. "
          "Do not repeat facts the rest of the answer already states. Leave out any part you cannot support."
      )
      return _post(prompt)


  def _post(prompt: str) -> Answer:
      body = {
          "input": prompt,
          "preset": PRESET,
          "instructions": INSTRUCTIONS,
          "tools": [{"type": "web_search"}],
      }
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      response = httpx.post(AGENT_URL, headers=headers, json=body, timeout=120.0)
      response.raise_for_status()
      return parse(response.json())


  def parse(raw: dict[str, Any]) -> Answer:
      """Pull the answer text and the numbered search results out of a response."""
      text = ""
      sources: dict[int, Source] = {}
      for item in raw["output"]:
          if item["type"] == "message":
              text = "\n\n".join(part["text"] for part in item["content"] if part["type"] == "output_text")
          elif item["type"] == "search_results":
              for result in item["results"]:
                  sources[int(result["id"])] = Source(
                      id=int(result["id"]),
                      url=result["url"],
                      title=result.get("title", ""),
                      snippet=result.get("snippet", ""),
                  )
      if not text:
          raise ValueError("The Agent API response has no message text.")
      if not sources:
          raise ValueError("The Agent API response has no search results; the model answered without searching.")
      return Answer(text=text, sources=sources)
  ```
</Accordion>

<Accordion title="decisions_client.py">
  ```python decisions_client.py theme={null}
  """Ask the Decisions API how well a set of passages supports one claim."""

  from __future__ import annotations

  import os
  import time
  from dataclasses import dataclass
  from typing import Any

  import httpx

  DECISIONS_URL = "https://api.perplexity.ai/v1/decisions"
  MODEL = "pplx-decider-latest"
  RETRIES = 2
  RETRY_STATUSES = {429, 500, 502, 503}


  @dataclass(frozen=True)
  class Verdict:
      """Probabilities from one request. Nothing here is a decision yet."""

      checkable: float
      supports: dict[int, float]  # passage number -> P(passage supports the claim)
      contradicts: dict[int, float]  # passage number -> P(passage contradicts the claim)
      input_tokens: int
      output_tokens: int
      seconds: float
      request_id: str


  def build_request(claim: str, passages: dict[int, str]) -> dict[str, Any]:
      """One claim, numbered passages, and 2N + 1 yes/no questions about them."""
      state = {
          "claim": claim,
          "passages": {str(n): text for n, text in passages.items()},
      }
      questions: dict[str, Any] = {
          "checkable": {
              "type": "noul",
              "instructions": (
                  "Is the claim a factual statement that could be verified against a source? "
                  "Opinions, transitions, and questions are not checkable."
              ),
          }
      }
      for n in passages:
          questions[f"supports_{n}"] = {
              "type": "noul",
              "instructions": (
                  f"Does passage {n} state or directly imply the claim? "
                  "Being about the same topic is not support; the passage has to back the specific claim."
              ),
          }
          questions[f"contradicts_{n}"] = {
              "type": "noul",
              "instructions": f"Does passage {n} state something that cannot be true if the claim is true?",
          }
      return {"model": MODEL, "state": state, "questions": questions}


  def score(claim: str, passages: dict[int, str], client: httpx.Client | None = None) -> Verdict:
      """Send the request, retrying briefly on 429, 500, 502, and 503, and return the probabilities."""
      if client is None:
          with httpx.Client(timeout=90.0) as new_client:
              return score(claim, passages, new_client)
      body = build_request(claim, passages)
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      started = time.perf_counter()
      for attempt in range(RETRIES + 1):
          response = client.post(DECISIONS_URL, headers=headers, json=body)
          if response.status_code in RETRY_STATUSES and attempt < RETRIES:
              time.sleep(float(response.headers.get("Retry-After", "1")))
              continue
          response.raise_for_status()
          break
      data = response.json()
      answers = data["answers"]
      return Verdict(
          checkable=answers["checkable"]["noul"],
          supports={n: answers[f"supports_{n}"]["noul"] for n in passages},
          contradicts={n: answers[f"contradicts_{n}"]["noul"] for n in passages},
          input_tokens=data["usage"]["input_tokens"],
          output_tokens=data["usage"]["output_tokens"],
          seconds=round(time.perf_counter() - started, 3),
          request_id=response.headers.get("x-request-id", ""),
      )
  ```
</Accordion>

<Accordion title="answer_gate.py">
  ```python answer_gate.py theme={null}
  """Check every sentence of a web-grounded answer, and send the weak ones back for another search.

  The Agent API writes and rewrites. The Decisions API returns probabilities.
  Only this file compares probabilities to cutoffs and chooses what to do with each sentence.
  """

  from __future__ import annotations

  import argparse
  import html
  import json
  import os
  import re
  import sys
  import time
  from dataclasses import asdict, dataclass, field
  from pathlib import Path

  import agent_client
  import decisions_client
  from agent_client import Answer

  # Cutoffs. Starting points, not validated production values.
  CHECKABLE_CUTOFF = 0.5
  CONTRADICTED_CUTOFF = 0.6
  SUPPORTED_CUTOFF = 0.7
  WEAK_CUTOFF = 0.4

  NEEDS_REVIEW = {"weak", "unsupported", "contradicted", "uncited"}
  MAX_INVESTIGATIONS = 4  # caps the extra Agent API calls per answer

  COLORS = {
      "supported": "#d4edda",
      "weak": "#fff3cd",
      "unsupported": "#f8d7da",
      "contradicted": "#f1948a",
      "uncited": "#e9ecef",
      "not_checkable": "transparent",
  }


  @dataclass
  class Sentence:
      index: int
      paragraph: int
      text: str  # claim without citation markers
      source_ids: list[int]
      missing_ids: list[int] = field(default_factory=list)  # cited, but not in the search results
      passages: dict[int, str] = field(default_factory=dict)  # the snippets sent to the Decisions API
      urls: dict[int, str] = field(default_factory=dict)
      label: str = ""
      rule: str = ""
      checkable: float = 0.0
      supports: dict[int, float] = field(default_factory=dict)
      contradicts: dict[int, float] = field(default_factory=dict)
      input_tokens: int = 0
      request_id: str = ""  # include this when you contact support
      outcome: str = ""  # "replaced", "not confirmed", or "not reviewed" (over the limit)
      revision: list[Sentence] = field(default_factory=list)


  # ---- Sentences --------------------------------------------------------------

  # Move markers that sit before the final punctuation ("fact [1].") to after it ("fact. [1]").
  MARKERS_BEFORE_END = re.compile(r"((?:\s*\[\d+\])+)\s*([.!?])")
  # A sentence ends at . ! or ? plus any closing quotes, unless the period follows an initial ("John J.")
  # or "e.g." / "i.e.". Trailing [n] markers belong to it. Text with no final punctuation is one sentence.
  SENTENCE = re.compile(
      r"(.+?(?:(?<!\s[A-Z])(?<!e\.g)(?<!i\.e)[.!?][\"'”’)]*|$))((?:\s*\[\d+\])*)(?:\s+|$)",
      re.DOTALL,
  )
  MARKER = re.compile(r"\[(\d+)\]")


  def split_sentences(text: str) -> list[Sentence]:
      """Cut the answer at sentence ends and attach each trailing [n] marker to its sentence."""
      sentences: list[Sentence] = []
      paragraphs = [p.strip() for p in text.replace("**", "").split("\n\n") if p.strip()]
      for number, paragraph in enumerate(paragraphs, start=1):
          paragraph = MARKERS_BEFORE_END.sub(r"\2\1", paragraph)
          matched = 0
          for match in SENTENCE.finditer(paragraph):
              body, markers = match.group(1), match.group(2)
              claim = MARKER.sub("", body).strip()
              ids = [int(m) for m in MARKER.findall(body + markers)]
              if claim:
                  sentences.append(Sentence(len(sentences) + 1, number, claim, ids))
              matched += len(match.group(0))
          if matched != len(paragraph):
              raise ValueError(f"Could not split paragraph {number}: {paragraph[matched:][:80]!r}")
      return sentences


  # ---- Policy -----------------------------------------------------------------


  def label(sentence: Sentence, verdict: decisions_client.Verdict) -> None:
      """Compare probabilities to cutoffs. First matching rule wins."""
      sentence.checkable, sentence.supports, sentence.contradicts = (
          verdict.checkable,
          verdict.supports,
          verdict.contradicts,
      )
      sentence.input_tokens, sentence.request_id = verdict.input_tokens, verdict.request_id
      best_support = max(verdict.supports.values(), default=0.0)
      worst_contradiction = max(verdict.contradicts.values(), default=0.0)
      if verdict.checkable < CHECKABLE_CUTOFF:
          sentence.label, sentence.rule = "not_checkable", f"checkable {verdict.checkable:.3f}"
      elif worst_contradiction >= CONTRADICTED_CUTOFF:
          sentence.label, sentence.rule = "contradicted", f"contradicts {worst_contradiction:.3f}"
      elif not verdict.supports:
          sentence.label, sentence.rule = "uncited", f"checkable {verdict.checkable:.3f}, no citation"
      elif best_support >= SUPPORTED_CUTOFF:
          sentence.label, sentence.rule = "supported", f"supports {best_support:.3f}"
      elif best_support >= WEAK_CUTOFF:
          sentence.label, sentence.rule = "weak", f"supports {best_support:.3f}"
      else:
          sentence.label, sentence.rule = "unsupported", f"supports {best_support:.3f}"
      if sentence.missing_ids:
          sentence.rule += f"; cited {sentence.missing_ids} but no such search result"


  # ---- The loop ---------------------------------------------------------------


  def score_answer(answer: Answer, indent: str = "  ") -> list[Sentence]:
      """One Decisions API request per sentence. Uncited sentences still get the checkable question."""
      sentences = split_sentences(answer.text)
      for sentence in sentences:
          found = [n for n in sentence.source_ids if n in answer.sources]
          sentence.missing_ids = [n for n in sentence.source_ids if n not in answer.sources]
          sentence.passages = {n: answer.sources[n].snippet for n in found}
          sentence.urls = {n: answer.sources[n].url for n in found}
          label(sentence, decisions_client.score(sentence.text, sentence.passages))
          print(f"{indent}{sentence.index:>2}  {sentence.label:<13} {sentence.rule:<28} {sentence.text[:60]}")
      return sentences


  def review(question: str, answer: Answer, sentences: list[Sentence]) -> None:
      """Send low-scoring sentences back to the Agent API, then score what it returns."""
      flagged = [s for s in sentences if s.label in NEEDS_REVIEW]
      for sentence in flagged[MAX_INVESTIGATIONS:]:
          sentence.outcome = "not reviewed"
      for sentence in flagged[:MAX_INVESTIGATIONS]:
          print(f"\nInvestigating sentence {sentence.index} ({sentence.label}). Scoring the rewrite:")
          rewrite = agent_client.investigate(question, answer.text, sentence.text)
          sentence.revision = score_answer(rewrite, indent="    -> ")
          confirmed = any(r.label == "supported" for r in sentence.revision)
          sentence.outcome = "replaced" if confirmed else "not confirmed"
          print(f"    {sentence.outcome}")


  def final_sentences(sentences: list[Sentence]) -> list[Sentence]:
      """The answer after review: a replaced sentence becomes the supported sentences of its rewrite."""
      return [r for s in sentences for r in (kept(s.revision) if s.outcome == "replaced" else [s])]


  def kept(revision: list[Sentence]) -> list[Sentence]:
      return [r for r in revision if r.label == "supported"]


  # ---- Output -----------------------------------------------------------------


  def evidence_rows(s: Sentence, note: str = "") -> str:
      """One table row per sentence, with every passage it was scored against."""
      passages = "".join(
          f"<details><summary>supports {s.supports[n]:.3f}, contradicts {s.contradicts[n]:.3f} "
          f'<a href="{html.escape(s.urls[n])}">source</a></summary><blockquote>{html.escape(text)}</blockquote></details>'
          for n, text in s.passages.items()
      )
      return (
          f'<tr><td style="background:{COLORS[s.label]}">{s.label}</td>'
          f"<td>{note}{plain(s.text)}<br><small>{html.escape(s.rule)}; request {s.request_id}</small>{passages}</td></tr>"
      )


  def plain(text: str) -> str:
      """Answer text for display: escaped, without Markdown backticks. Passages stay exactly as sent."""
      return html.escape(text.replace("`", ""))


  def write_report(question: str, sentences: list[Sentence], path: Path) -> None:
      """The final answer colored by label, then a table of the evidence behind every score."""
      paragraphs: dict[int, list[str]] = {}
      numbers: dict[str, int] = {}  # rewrites come from separate searches, so number citations by URL
      for s in sentences:
          replaced = s.outcome == "replaced"
          for r in kept(s.revision) if replaced else [s]:
              cites = "".join(
                  f' <a href="{html.escape(url)}">[{numbers.setdefault(url, len(numbers) + 1)}]</a>'
                  for url in r.urls.values()
              )
              underline = "border-bottom:2px solid #555" if replaced else ""
              badge = f" <small>({s.outcome})</small>" if s.outcome and not replaced else ""
              paragraphs.setdefault(s.paragraph, []).append(
                  f'<span style="background:{COLORS[r.label]};{underline}">{plain(r.text)}{cites}{badge}</span>'
              )
      answer = "".join(f"<p>{' '.join(spans)}</p>" for spans in paragraphs.values())
      rows = ""
      for s in sentences:
          rows += evidence_rows(s)
          for r in s.revision:
              used = "used" if s.outcome == "replaced" and r.label == "supported" else "not used"
              rows += evidence_rows(r, note=f"<b>Rewrite, {used}:</b> ")
      legend = " ".join(f'<span style="background:{c};padding:2px 6px">{k}</span>' for k, c in COLORS.items())
      path.write_text(
          "<!doctype html><meta charset='utf-8'><style>body{font:16px/1.6 sans-serif;max-width:48em;margin:3em auto}"
          "td{vertical-align:top;padding:6px;border-top:1px solid #ddd}blockquote{font-size:13px;color:#444}"
          f"a{{color:inherit}}</style><h2>{html.escape(question)}</h2><p>{legend} "
          f"<span style='border-bottom:2px solid #555'>replaced after review</span></p>{answer}"
          f"<h3>Evidence</h3><table>{rows}</table>"
      )


  def summarize(sentences: list[Sentence], seconds: float) -> dict[str, object]:
      everything = sentences + [r for s in sentences for r in s.revision]
      final = final_sentences(sentences)
      return {
          "sentences": len(sentences),
          "investigated": sum(1 for s in sentences if s.revision),
          "replaced": sum(1 for s in sentences if s.outcome == "replaced"),
          "decisions_requests": len(everything),
          "decisions_input_tokens": sum(s.input_tokens for s in everything),
          "seconds": round(seconds, 1),
          "before": {k: n for k in COLORS if (n := sum(1 for s in sentences if s.label == k))},
          "after": {k: n for k in COLORS if (n := sum(1 for s in final if s.label == k))},
      }


  # ---- Command line -----------------------------------------------------------


  def main() -> None:
      parser = argparse.ArgumentParser(description="Check every sentence of a web-grounded answer.")
      parser.add_argument("question", help="The question to ask the Agent API.")
      parser.add_argument("--out", default="out", help="Output directory.")
      args = parser.parse_args()
      if not os.environ.get("PERPLEXITY_API_KEY"):
          sys.exit("Set PERPLEXITY_API_KEY first: export PERPLEXITY_API_KEY=pplx-...")
      out = Path(args.out)
      out.mkdir(exist_ok=True)

      started = time.perf_counter()
      print("Asking the Agent API...")
      answer = agent_client.ask(args.question)
      print("Scoring each sentence with the Decisions API:")
      sentences = score_answer(answer)
      try:
          review(args.question, answer, sentences)
      finally:  # if a review request fails, save the first pass and the completed investigations
          summary = summarize(sentences, time.perf_counter() - started)
          print(f"\n{json.dumps(summary)}")
          write_report(args.question, sentences, out / "report.html")
          run = {"summary": summary, "sentences": [asdict(s) for s in sentences]}
          (out / "run.json").write_text(json.dumps(run, indent=1))
          print(f"Report: {out / 'report.html'}")


  if __name__ == "__main__":
      main()
  ```
</Accordion>

<Accordion title="test_answer_gate.py">
  ```python test_answer_gate.py theme={null}
  """Offline tests. No API key, no network. Run with: python -m pytest -q"""

  from __future__ import annotations

  from pathlib import Path

  import httpx
  import pytest

  import agent_client
  import answer_gate
  import decisions_client
  from agent_client import Answer, Source
  from decisions_client import Verdict


  def verdict(
      supports: dict[int, float], contradicts: dict[int, float] | None = None, checkable: float = 0.95
  ) -> Verdict:
      """Made-up probabilities in the shape the Decisions API returns."""
      contradicts = contradicts or {n: 0.0 for n in supports}
      return Verdict(checkable, supports, contradicts, input_tokens=100, output_tokens=0, seconds=0.1, request_id="t")


  def label_of(v: Verdict) -> str:
      sentence = answer_gate.Sentence(1, 1, "claim", [1])
      answer_gate.label(sentence, v)
      return sentence.label


  def test_split_keeps_every_sentence_and_its_markers() -> None:
      text = "John J. Hopfield won, e.g. for nets.[1] He said “it works.” [2][3] Known fact [4].\n\nNo end mark [5]"
      sentences = answer_gate.split_sentences(text)
      assert [s.source_ids for s in sentences] == [[1], [2, 3], [4], [5]]
      assert [s.paragraph for s in sentences] == [1, 1, 1, 2]
      assert sentences[2].text == "Known fact."


  def test_policy_order_and_bands() -> None:
      assert label_of(verdict({1: 0.9}, {1: 0.7})) == "contradicted"  # contradiction beats support
      assert label_of(verdict({1: 0.9})) == "supported"
      assert label_of(verdict({1: 0.5})) == "weak"
      assert label_of(verdict({1: 0.1})) == "unsupported"
      assert label_of(verdict({}, checkable=0.9)) == "uncited"
      assert label_of(verdict({1: 0.9}, checkable=0.2)) == "not_checkable"


  def test_request_has_one_question_per_passage_plus_checkable() -> None:
      body = decisions_client.build_request("claim", {4: "a", 7: "b"})
      assert set(body["questions"]) == {"checkable", "supports_4", "contradicts_4", "supports_7", "contradicts_7"}
      assert all(q["type"] == "noul" for q in body["questions"].values())


  def test_retry_on_429_honors_retry_after(monkeypatch: pytest.MonkeyPatch) -> None:
      monkeypatch.setenv("PERPLEXITY_API_KEY", "test")
      sleeps: list[float] = []
      monkeypatch.setattr("time.sleep", sleeps.append)
      ok = {
          "answers": {"checkable": {"noul": 0.9}, "supports_1": {"noul": 0.8}, "contradicts_1": {"noul": 0.1}},
          "usage": {"input_tokens": 50, "output_tokens": 0},
      }
      replies = iter([httpx.Response(429, headers={"Retry-After": "2"}), httpx.Response(200, json=ok)])
      client = httpx.Client(transport=httpx.MockTransport(lambda request: next(replies)))
      assert decisions_client.score("claim", {1: "passage"}, client=client).supports == {1: 0.8}
      assert sleeps == [2.0]


  def test_review_keeps_only_supported_rewrite_sentences(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      source = {1: Source(1, "https://example.com", "t", "snippet with `code`")}
      answer = Answer("Good claim. [1] Weak claim. [1] Bad claim. [1] Missing claim. [9]", source)
      rewrites = {"Weak claim.": "Better claim. [1] Extra guess. [1]", "Bad claim.": "Still bad. [1]"}
      probabilities = {
          "Good claim.": 0.9,
          "Weak claim.": 0.5,
          "Bad claim.": 0.1,
          "Better claim.": 0.95,
          "Still bad.": 0.2,
          "Extra guess.": 0.3,
      }
      monkeypatch.setattr(agent_client, "investigate", lambda q, a, s: Answer(rewrites.get(s, "Nothing. [1]"), source))
      monkeypatch.setattr(
          decisions_client, "score", lambda claim, p: verdict({n: probabilities.get(claim, 0.9) for n in p})
      )

      sentences = answer_gate.score_answer(answer)
      answer_gate.review("q", answer, sentences)

      assert [s.outcome for s in sentences] == ["", "replaced", "not confirmed", "replaced"]
      assert sentences[3].missing_ids == [9] and "no such search result" in sentences[3].rule
      final = [s.text for s in answer_gate.final_sentences(sentences)]
      assert final == ["Good claim.", "Better claim.", "Bad claim.", "Nothing."]
      answer_gate.write_report("q", sentences, tmp_path / "report.html")
      report = (tmp_path / "report.html").read_text()
      assert "(not confirmed)" in report and "snippet with `code`" in report
  ```
</Accordion>
