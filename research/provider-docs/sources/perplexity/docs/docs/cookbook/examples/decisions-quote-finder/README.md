> ## Documentation Index
> Fetch the complete documentation index at: https://docs.perplexity.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Rank Search Results to Answer Questions with the Best Quote Using Decisions API

> Use Decisions API probabilities to rank sentences from your Search API results, then return the quote that best answers the question, with its URL.

The Search API returns up to five pages for a question. Your user wants the one sentence that answers it, in the page's own words, with a link.

Put the Decisions API in between. Send it each result's sentences as numbered options, and it returns a probability for each one, plus the probability that any of them answers. Your code ranks by those probabilities and prints the top sentence with its URL, or says that no result answers.

<Frame caption="A live run of this recipe on two questions: one with an answer and one without. The step captions and API panels were added for the recording, and request IDs are shortened. The script prints the terminal lines and writes out/run.json.">
  <video autoPlay muted loop playsInline controls className="w-full aspect-video" src="https://mintcdn.com/perplexity/sSYFMrFqwcqra2_8/docs/assets/images/cookbook/examples/decisions-quote-finder-demo.mp4?fit=max&auto=format&n=sSYFMrFqwcqra2_8&q=85&s=676d4c983dd37bc6e50e5fc22a1add32" data-path="docs/assets/images/cookbook/examples/decisions-quote-finder-demo.mp4" />
</Frame>

## Why the Decisions API

* **Quickly evaluate options.** A `choice` question takes up to 255 options. Each sentence is an option, keyed by its number, so the answer is a sentence number your code looks up. There is no reply to parse and nothing to match back to the page.
* **A way to say "none of these".** A `choice` answer always has a top option, even when no option answers. The `noul` (yes/no) question in the same request gives the probability that any sentence answers, and your code compares it to a cutoff before it trusts the ranking.
* **One consistent scale across results.** `choice` probabilities sum to about 1 inside one request, so 0.9 in one result and 0.7 in another are not comparable. A second request puts the top sentence from each result side by side and asks the same yes/no question of each, so those probabilities are comparable.
* **One key, multiple APIs.** The Search API and the Decisions API use the same Perplexity API key.

## What you will build

A command-line tool. You give it a question. It prints one sentence from a live search result with the title, URL, and date of the page, or a line saying that no result answers.

The project is seven files in one folder:

```text theme={null}
decisions-quote-finder/
├── requirements.txt       # packages
├── pyproject.toml         # settings for pytest, ruff, and mypy
├── search_client.py       # asks the Search API
├── sentences.py           # splits a snippet into sentences
├── decisions_client.py    # asks the Decisions API
├── quote_finder.py        # builds the requests, applies the cutoffs, prints the quote
└── test_quote_finder.py   # offline tests
```

Every run takes five steps:

1. `search_client.py` sends your question to the Search API and gets up to five results. Each result has a title, URL, date, and a snippet: text extracted from the page.
2. `sentences.py` splits each snippet into sentences.
3. `quote_finder.py` sends one Decisions API request per result. The request numbers the result's sentences and asks two questions: which numbered sentence most directly answers the question (`choice`), and whether any of them answers it (`noul`). Your code keeps the top-probability sentence as that result's candidate.
4. Candidates from results whose "any of them answers" probability is at least 0.3 go into one more request, which asks the same yes/no question of each candidate: does it state the answer?
5. If the highest of those probabilities is at least 0.6, your code prints that sentence as the answer. Otherwise it prints that no result answers, followed by the closest candidate marked "below cutoff".

Only `quote_finder.py` chooses and prints a sentence. The Decisions API returns a probability for every sentence number it is shown and a probability that any of them answers. Every character of the quote came back from the Search API.

One run makes one Search API request and at most six Decisions API requests: one per result and one to compare. Retries can add attempts.

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

`pyproject.toml` holds settings for `pytest`, plus `ruff` and `mypy` if you use them. The script runs without it.

<Accordion title="pyproject.toml">
  ```toml pyproject.toml theme={null}
  [tool.ruff]
  line-length = 150
  target-version = "py310"

  [tool.ruff.lint]
  select = ["E", "F", "I", "B", "UP", "C4", "SIM"]

  [tool.mypy]
  strict = true
  ignore_missing_imports = true

  [tool.pytest.ini_options]
  addopts = "-q"
  ```
</Accordion>

Run these commands. Save `requirements.txt` and `pyproject.toml` in the new folder when the comment says to.

<Accordion title="Install and set your key">
  ```bash theme={null}
  mkdir decisions-quote-finder && cd decisions-quote-finder
  # save requirements.txt and pyproject.toml here, then continue
  python3 -m venv .venv
  source .venv/bin/activate
  python -m pip install -r requirements.txt
  export PERPLEXITY_API_KEY="your-api-key-here"
  ```
</Accordion>

In a new terminal, run the `source` and `export` lines again.

## The Search API client: search\_client.py

`search_client.py` sends one `POST` to `https://api.perplexity.ai/search` with your question, `max_results: 5`, and `max_tokens_per_page: 2048`. It keeps four fields from each result: `title`, `url`, `snippet`, and `date`. `date` can be missing or `null`, so it is optional. A `429` or `5xx` gets two retries, waiting for the `Retry-After` header when there is one.

The snippet is not the whole page. It is the part of the page the Search API extracted for your question, with sections separated by `...`. For the Mariana Trench question, snippets were 438 to 2,441 characters long, and raising `max_tokens_per_page` to 4096 returned the same text. The quote can only come from the snippet, because this recipe does not fetch pages.

<Accordion title="search_client.py">
  ```python search_client.py theme={null}
  """Ask the Search API for result pages and their extracted text."""

  from __future__ import annotations

  import os
  import time
  from dataclasses import dataclass
  from typing import Any

  import httpx

  SEARCH_URL = "https://api.perplexity.ai/search"
  MAX_RESULTS = 5
  MAX_TOKENS_PER_PAGE = 2048
  RETRIES = 2
  RETRY_STATUSES = {429, 500, 502, 503}


  @dataclass(frozen=True)
  class Result:
      """One search result. The snippet is the page text the quote must come from."""

      title: str
      url: str
      snippet: str
      date: str | None


  def search_request(question: str) -> dict[str, Any]:
      """The request body: the question, five results, and up to 2,048 tokens of text per page."""
      return {"query": question, "max_results": MAX_RESULTS, "max_tokens_per_page": MAX_TOKENS_PER_PAGE}


  def parse_results(data: dict[str, Any]) -> list[Result]:
      """Keep the four fields the recipe uses. `date` can be missing or null."""
      return [Result(title=item["title"], url=item["url"], snippet=item["snippet"], date=item.get("date")) for item in data["results"]]


  def search(question: str, client: httpx.Client | None = None) -> list[Result]:
      """Send one Search API request, retrying briefly on 429, 500, 502, and 503."""
      if client is None:
          with httpx.Client(timeout=30.0) as new_client:
              return search(question, new_client)
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      for attempt in range(RETRIES + 1):
          response = client.post(SEARCH_URL, headers=headers, json=search_request(question))
          if response.status_code in RETRY_STATUSES and attempt < RETRIES:
              time.sleep(float(response.headers.get("Retry-After", "1")))
              continue
          response.raise_for_status()
          break
      return parse_results(response.json())
  ```
</Accordion>

## Sentences: sentences.py

`split` turns a snippet into a list of sentences, in page order:

1. Replace each `...` section break with a new line, then split on new lines.
2. Remove Markdown line markers at the start of each line: `#` headings, `*` and `-` bullets, and `>` quotes. A marker counts only when a space follows it, so `**bold**` at the start of a line stays intact.
3. Split each line where `.`, `!`, or `?` is followed by a space and a capital letter, digit, quote mark, or opening parenthesis. A footnote marker such as `^[1]^` right after the punctuation stays with its sentence.
4. Drop pieces shorter than 25 characters (stray headings and labels) or longer than 400, and drop exact repeats.
5. Keep at most 255, the `choice` option limit.

The splitter only trims whitespace and line markers at the edges. Everything else, including Markdown emphasis and the source's own typos, stays exactly as the Search API returned it.

<Accordion title="sentences.py">
  ```python sentences.py theme={null}
  """Split a Search API snippet into sentences your code can number and quote."""

  from __future__ import annotations

  import re

  MIN_CHARS = 25
  MAX_CHARS = 400
  MAX_SENTENCES = 255  # the choice option limit

  # A sentence ends at . ! or ?, plus any footnote markers like ^[1]^, followed by whitespace
  # and a capital letter, digit, quote, or bracket. The group keeps the ending with its sentence.
  BOUNDARY = re.compile(r"([.!?](?:\^\[[^\]]+\]\^)*)\s+(?=[A-Z0-9\"“(])")
  # Markdown line markers: headings, bullets, and quotes. "**bold**" at the start of a line is kept.
  LINE_PREFIX = re.compile(r"^\s*(?:[#*>-]+\s+)*")


  def split(snippet: str) -> list[str]:
      """Return the snippet's sentences in page order, cleaned only at the edges."""
      sentences: list[str] = []
      seen: set[str] = set()
      for line in snippet.replace("...", "\n").split("\n"):
          line = LINE_PREFIX.sub("", line)
          parts = BOUNDARY.split(line)
          for piece in (text + end for text, end in zip(parts[0::2], [*parts[1::2], ""], strict=True)):
              piece = piece.strip()
              if not MIN_CHARS <= len(piece) <= MAX_CHARS or piece in seen:
                  continue
              seen.add(piece)
              sentences.append(piece)
      return sentences[:MAX_SENTENCES]
  ```
</Accordion>

## The Decisions API client: decisions\_client.py

`decisions_client.py` sends one request to `https://api.perplexity.ai/v1/decisions` with the model `pplx-decider-latest`, your `state`, and your questions. It returns the response's `answers` object untouched, so callers can read `choice`, `probabilities`, `confidence`, and `noul`. It also keeps the `x-request-id` header, the input token count, and the time the request took.

Like the Search client, it retries twice on `429`, `500`, `502`, and `503`, waiting for `Retry-After`. The timeout is 30 seconds, which covers any request under the input limit.

<Accordion title="decisions_client.py">
  ```python decisions_client.py theme={null}
  """Send one request to the Decisions API and return its answers untouched."""

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
  class Scored:
      """Probabilities from one request. Nothing here is a decision yet."""

      answers: dict[str, Any]  # the response "answers" object, untouched
      request_id: str  # x-request-id header, or ""
      input_tokens: int
      elapsed_s: float


  def score(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
      """Send the request, retrying briefly on 429, 500, 502, and 503, and return the answers."""
      if client is None:
          with httpx.Client(timeout=30.0) as new_client:
              return score(state, questions, new_client)
      body = {"model": MODEL, "state": state, "questions": questions}
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
      return Scored(
          answers=data["answers"],
          request_id=response.headers.get("x-request-id", ""),
          input_tokens=data["usage"]["input_tokens"],
          elapsed_s=round(time.perf_counter() - started, 3),
      )
  ```
</Accordion>

## The quote finder: quote\_finder.py

`quote_finder.py` is shown in four parts. Paste them into one file in order, with two blank lines between parts.

### Imports and cutoffs

The three cutoffs are starting points, not validated production values. Tune them on your own questions.

* `HAS_ANSWER_CUTOFF = 0.3`: a result whose "any of these answers" probability is below this sends no candidate to the compare step.
* `ANSWER_CUTOFF = 0.6`: the top candidate needs at least this "states the answer" probability to be printed as the answer.
* `MIN_SENTENCES = 1`: a result whose snippet has no usable sentence is skipped.

`Candidate` holds the top-probability sentence of one result and the numbers behind it. `answers` stays empty until the compare step fills it.

<Accordion title="Imports and cutoffs">
  ```python quote_finder.py (part 1 of 4) theme={null}
  """Answer a question with one sentence quoted from a live search result."""

  from __future__ import annotations

  import argparse
  import json
  import os
  import sys
  import time
  from dataclasses import dataclass
  from datetime import datetime, timezone
  from pathlib import Path
  from typing import Any

  import httpx

  import decisions_client
  import search_client
  import sentences
  from search_client import Result

  # Cutoffs. Starting points, not validated production values.
  HAS_ANSWER_CUTOFF = 0.3  # a result below this sends no candidate to stage 4
  ANSWER_CUTOFF = 0.6  # the best candidate needs at least this to be printed as the answer
  MIN_SENTENCES = 1  # a result whose snippet has no usable sentence is skipped


  @dataclass
  class Candidate:
      """The top-ranked sentence of one result, with the probabilities behind it."""

      result: Result
      sentence_id: int
      sentence: str
      choice_probability: float
      choice_confidence: float
      has_answer: float
      rank_request_id: str
      answers: float | None = None  # filled in stage 4
  ```
</Accordion>

### The requests

`rank_request` builds the request for one result. The `state` holds your question, the page title and URL, and the numbered sentences. It asks two questions:

* `best`, a `choice` whose options are the sentence numbers. Each option's description is the sentence itself.
* `has_answer`, a `noul` with `criteria` that spell out what counts as yes ("a reader could quote that sentence as the answer") and no ("the sentences discuss the topic but none states the answer").

The sentences appear twice on purpose: in `state`, so `has_answer` can read them, and as the `choice` descriptions, so each option carries its own text. In our tests the repeat added 7 to 36 percent to a request's input tokens, compared with `null` descriptions. One of these requests used 237 to 2,554 input tokens.

`compare_request` puts every candidate in one `state` and asks one `noul` per candidate, named `answers_1`, `answers_2`, and so on. Each one asks whether that candidate states the answer to the question.

Two requests, because a `choice` says which sentence in one result is most likely the answer relative to its neighbors, and its probabilities sum to 1 inside that request. Two results' top probabilities are not on the same scale until the compare request asks the same yes/no question of each candidate in one state.

<Accordion title="The requests">
  ```python quote_finder.py (part 2 of 4) theme={null}
  # ---- Requests ----------------------------------------------------------------


  def rank_request(question: str, result: Result, sents: list[str]) -> tuple[dict[str, Any], dict[str, Any]]:
      """Stage 3: number one result's sentences and ask which answers, and whether any does."""
      numbered = {str(n): text for n, text in enumerate(sents, start=1)}
      state = {"question": question, "source": {"title": result.title, "url": result.url}, "sentences": numbered}
      questions = {
          "best": {
              "type": "choice",
              "instructions": (
                  "Which numbered sentence most directly answers the question? "
                  "Prefer a sentence that states the answer itself over one that only mentions the topic."
              ),
              "criteria": numbered,
          },
          "has_answer": {
              "type": "noul",
              "instructions": "Does at least one of the numbered sentences answer the question?",
              "criteria": {
                  "true": "At least one sentence states the answer or directly implies it, so a reader could quote that sentence as the answer.",
                  "false": "The sentences discuss the topic but none states the answer, or answering would need outside knowledge.",
              },
          },
      }
      return state, questions


  def compare_request(question: str, candidates: list[Candidate]) -> tuple[dict[str, Any], dict[str, Any]]:
      """Stage 4: put every candidate in one state and ask the same yes/no of each."""
      state = {"question": question, "candidates": {str(n): c.sentence for n, c in enumerate(candidates, start=1)}}
      questions = {
          f"answers_{n}": {
              "type": "noul",
              "instructions": f"Does candidate {n} state the answer to the question?",
              "criteria": {
                  "true": "The sentence contains the answer itself and can be quoted as the answer without adding anything.",
                  "false": "The sentence is about the topic but does not contain the answer, or only hints at it.",
              },
          }
          for n in range(1, len(candidates) + 1)
      }
      return state, questions
  ```
</Accordion>

### The pipeline

`find_quote` runs the five steps on one question.

* It splits every snippet. A result with no usable sentence is printed as `skipped: no sentences`.
* It sends one rank request per result and reads `answers["best"]["choice"]` (a string such as `"2"`), that option's probability, the `confidence`, and `answers["has_answer"]["noul"]`.
* Candidates with `has_answer` at or above 0.3 go into the compare request. If none qualify, there is no compare request.
* It sorts candidates by their compare probability. Ties go to the higher `has_answer`, then to the earlier result. The top one is the answer if its probability is at least 0.6.
* If nothing passes, it prints the no-answer line and the closest candidate, marked "below cutoff". When there was no compare request, the closest candidate is the one with the highest `has_answer`.

The `finally` block writes `out/run.json` even if a request fails partway, so an interrupted run still leaves a record. It holds every result with its sentences, every probability, and every Decisions `x-request-id`. `answer` is `null` when nothing passes the cutoff, and `compare` is `null` when the compare step was skipped.

<Accordion title="The pipeline">
  ```python quote_finder.py (part 3 of 4) theme={null}
  # ---- Pipeline ----------------------------------------------------------------


  def to_candidate(result: Result, sents: list[str], scored: decisions_client.Scored) -> Candidate:
      """Read the top-probability sentence and the has_answer probability from a stage 3 answer."""
      best = scored.answers["best"]
      choice = best["choice"]
      return Candidate(
          result=result,
          sentence_id=int(choice),
          sentence=sents[int(choice) - 1],
          choice_probability=best["probabilities"][choice],
          choice_confidence=best["confidence"],
          has_answer=scored.answers["has_answer"]["noul"],
          rank_request_id=scored.request_id,
      )


  def quote_record(index: int, c: Candidate) -> dict[str, Any]:
      """The run.json entry for a quoted sentence: where it came from and its probabilities."""
      source = {"title": c.result.title, "url": c.result.url, "date": c.result.date}
      return {"result_index": index, "sentence_id": c.sentence_id, "sentence": c.sentence, "answers": c.answers, "has_answer": c.has_answer, **source}


  def request_record(scored: decisions_client.Scored) -> dict[str, Any]:
      """The request ID, token count, and time of one Decisions request, for run.json."""
      return {"request_id": scored.request_id, "input_tokens": scored.input_tokens, "elapsed_s": scored.elapsed_s}


  def find_quote(question: str, out_dir: Path) -> Candidate | None:
      """Search, rank each result's sentences, compare the candidates, and print the quote or a no-answer line."""
      started = time.perf_counter()
      run: dict[str, Any] = {"question": question, "recorded_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
      run.update(search=None, rank=[], compare=None, answer=None, closest=None, totals=None)
      requests: list[decisions_client.Scored] = []
      try:
          with httpx.Client(timeout=30.0) as client:
              # Stages 1 and 2: search, then split every snippet into sentences.
              search_started = time.perf_counter()
              results = search_client.search(question, client)
              split_results = [(result, sentences.split(result.snippet)) for result in results]
              listed = [{"title": r.title, "url": r.url, "date": r.date, "sentence_count": len(s), "sentences": s} for r, s in split_results]
              run["search"] = {"elapsed_s": round(time.perf_counter() - search_started, 3), "results": listed}
              found = f"{len(results)} result{'' if len(results) == 1 else 's'}"
              print(f"Question: {question}\nSearch: {found} in {run['search']['elapsed_s']:.1f} s\n")
              if not results:
                  print("No results")
                  return None

              # Stage 3: one request per result. Keep each result's top-probability sentence.
              print(RESULTS_HEADER)
              ranked: list[tuple[int, Candidate]] = []
              for index, (result, sents) in enumerate(split_results, start=1):
                  if len(sents) < MIN_SENTENCES:
                      print(result_row(index, result, len(sents), None, "skipped: no sentences"))
                      continue
                  scored = decisions_client.score(*rank_request(question, result, sents), client)
                  requests.append(scored)
                  candidate = to_candidate(result, sents, scored)
                  ranked.append((index, candidate))
                  probabilities = {"choice_probability": candidate.choice_probability, "confidence": candidate.choice_confidence}
                  record = {"result_index": index, **request_record(scored), "has_answer": candidate.has_answer, "choice": str(candidate.sentence_id)}
                  run["rank"].append({**record, **probabilities, "probabilities": scored.answers["best"]["probabilities"]})
                  qualifies = candidate.has_answer >= HAS_ANSWER_CUTOFF
                  print(result_row(index, result, len(sents), candidate, "" if qualifies else "no candidate"))
              qualified = [(i, c) for i, c in ranked if c.has_answer >= HAS_ANSWER_CUTOFF]

              # Stage 4: one request with every qualified candidate, so the probabilities share one scale.
              if qualified:
                  scored = decisions_client.score(*compare_request(question, [c for _, c in qualified]), client)
                  requests.append(scored)
                  for n, (_, candidate) in enumerate(qualified, start=1):
                      candidate.answers = scored.answers[f"answers_{n}"]["noul"]
                  run["compare"] = {
                      **request_record(scored),
                      "candidates": {str(n): i for n, (i, _) in enumerate(qualified, start=1)},
                      "answers": {name: answer["noul"] for name, answer in scored.answers.items()},
                  }
                  qualified.sort(key=lambda pair: (-(pair[1].answers or 0.0), -pair[1].has_answer, pair[0]))
                  print_candidates(qualified)

              # Stage 5: your code quotes the top candidate only if it clears the cutoff.
              if qualified and (qualified[0][1].answers or 0.0) >= ANSWER_CUTOFF:
                  index, answer = qualified[0]
                  run["answer"] = quote_record(index, answer)
                  print()
                  print_quote(f"Answer (answers {answer.answers:.3f}):", answer)
                  return answer
              print(f"\nAnswer: No sentence in the top {found} answers this question.")
              if qualified:
                  index, closest = qualified[0]
                  print_quote(f"Closest (answers {closest.answers or 0.0:.3f}, below cutoff):", closest)
              elif ranked:
                  index, closest = max(ranked, key=lambda pair: (pair[1].has_answer, -pair[0]))
                  print_quote(f"Closest (has_answer {closest.has_answer:.3f}, below cutoff):", closest)
              if qualified or ranked:
                  run["closest"] = quote_record(index, closest)
              return None
      except Exception as error:
          run["error"] = f"{type(error).__name__}: {error}"
          raise
      finally:
          tokens = sum(r.input_tokens for r in requests)
          elapsed = round(time.perf_counter() - started, 3)
          run["totals"] = {"decisions_requests": len(requests), "input_tokens": tokens, "elapsed_s": elapsed}
          out_dir.mkdir(parents=True, exist_ok=True)
          (out_dir / "run.json").write_text(json.dumps(run, indent=2, ensure_ascii=False) + "\n")
          print(f"\n{len(requests)} Decisions requests, {tokens:,} input tokens, {elapsed:.1f} s total")
          print(f"Wrote {out_dir / 'run.json'}")
  ```
</Accordion>

### Printing and command line

The results table prints one line per result: sentence count, `has_answer`, the top sentence number, its probability, and `confidence`. A result whose `has_answer` falls below the cutoff shows dashes and `no candidate`. Probabilities print with three decimals. The quote prints exactly as the Search API returned it, in straight double quotes, followed by the page title, URL, and date.

The script takes one question and an optional `--out` folder.

<Accordion title="Printing and command line">
  ```python quote_finder.py (part 4 of 4) theme={null}
  # ---- Printing and command line -----------------------------------------------

  RESULTS_HEADER = f"{'#':<3}{'result':<41}{'sentences':<11}{'has_answer':<12}{'best':<6}{'p(best)':<9}confidence"


  def result_row(index: int, result: Result, count: int, candidate: Candidate | None, note: str) -> str:
      """One line of the results table. Results without a candidate show dashes."""
      has_answer = f"{candidate.has_answer:.3f}" if candidate else "-"
      if candidate and not note:
          best, p, confidence = str(candidate.sentence_id), f"{candidate.choice_probability:.3f}", f"{candidate.choice_confidence:.3f}"
      else:
          best, p, confidence = "-", "-", "-"
      line = f"{index:<3}{result.title[:40]:<41}{count:<11}{has_answer:<12}{best:<6}{p:<9}{confidence:<11}{note}"
      return line.rstrip()


  def print_candidates(qualified: list[tuple[int, Candidate]]) -> None:
      """The stage 4 table, highest probability first. # is the result number."""
      count = f"{len(qualified)} candidate{'' if len(qualified) == 1 else 's'}"
      print(f"\nComparing {count} in one request\n\n{'#':<3}{'answers':<9}sentence")
      for index, candidate in qualified:
          print(f"{index:<3}{candidate.answers or 0.0:<9.3f}{candidate.sentence}")


  def print_quote(label: str, candidate: Candidate) -> None:
      """The quote exactly as the Search API returned it, then its title, URL, and date."""
      source = ", ".join(part for part in (candidate.result.title, candidate.result.url, candidate.result.date) if part)
      print(f'{label}\n"{candidate.sentence}"\n{source}')


  def main() -> None:
      parser = argparse.ArgumentParser(description="Answer a question with one sentence quoted from a live search result.")
      parser.add_argument("question")
      parser.add_argument("--out", type=Path, default=Path("out"), help="folder for run.json (default: out)")
      args = parser.parse_args()
      if not os.environ.get("PERPLEXITY_API_KEY"):
          sys.exit("Set PERPLEXITY_API_KEY first")
      try:
          find_quote(args.question, args.out)
      except httpx.HTTPStatusError as error:
          url = error.request.url
          sys.exit(f"{url.host}{url.path} returned {error.response.status_code}: {error.response.text[:300]}")


  if __name__ == "__main__":
      main()
  ```
</Accordion>

## Test it

Save all seven files in your folder, then run the tests before your first live run. They need no API key or network. They cover the splitter, the shape of both requests, the two cutoffs, a run where no result sends a candidate, the run record after a failed request, and parsing a Search API response, with fake API responses and made-up probabilities.

<Accordion title="test_quote_finder.py">
  ```python test_quote_finder.py theme={null}
  """Offline tests. No API key, no network. Run with: python -m pytest -q"""

  from __future__ import annotations

  import json
  from pathlib import Path
  from typing import Any

  import httpx
  import pytest

  import decisions_client
  import quote_finder
  import search_client
  import sentences
  from decisions_client import Scored
  from search_client import Result

  PAGE = "One sentence about the topic here. Another sentence about the topic. A third sentence about the topic."


  def test_split_handles_markdown_and_ellipsis() -> None:
      snippet = (
          "## History\nThe trench was first sounded in 1875 by HMS Challenger.\n...\n"
          "* **Depth** is about 10,935 metres at the deepest point. It is deeper than Everest is tall."
      )
      assert sentences.split(snippet) == [
          "The trench was first sounded in 1875 by HMS Challenger.",
          "**Depth** is about 10,935 metres at the deepest point.",
          "It is deeper than Everest is tall.",
      ]


  def test_split_keeps_footnote_with_its_sentence() -> None:
      snippet = "The deepest point is the Challenger Deep.^[1]^ It is deeper than Everest is tall.^[a]^"
      assert sentences.split(snippet) == ["The deepest point is the Challenger Deep.^[1]^", "It is deeper than Everest is tall.^[a]^"]


  def test_split_caps_at_255() -> None:
      snippet = " ".join(f"Sentence number {n} is long enough to keep." for n in range(300))
      assert len(sentences.split(snippet)) == 255


  def test_rank_request_shape() -> None:
      sents = ["First sentence of the page.", "Second sentence of the page."]
      state, questions = quote_finder.rank_request("q?", Result("T", "https://e.com", "", None), sents)
      assert state == {"question": "q?", "source": {"title": "T", "url": "https://e.com"}, "sentences": {"1": sents[0], "2": sents[1]}}
      assert set(questions) == {"best", "has_answer"}
      assert questions["best"]["type"] == "choice" and questions["best"]["criteria"] == state["sentences"]
      assert questions["has_answer"]["type"] == "noul" and set(questions["has_answer"]["criteria"]) == {"true", "false"}


  def test_compare_request_shape() -> None:
      result = Result("T", "https://e.com", "", None)
      candidates = [quote_finder.Candidate(result, 1, f"Sentence {n}.", 0.9, 0.9, 0.9, "id") for n in range(3)]
      state, questions = quote_finder.compare_request("q?", candidates)
      assert state["candidates"] == {"1": "Sentence 0.", "2": "Sentence 1.", "3": "Sentence 2."}
      assert list(questions) == ["answers_1", "answers_2", "answers_3"]
      assert all(q["type"] == "noul" for q in questions.values())


  def fake_apis(monkeypatch: pytest.MonkeyPatch, has_answer: dict[str, float], answers: float) -> list[dict[str, Any]]:
      """Two fake results. Rank requests return has_answer by title; compare requests return `answers` for every candidate."""
      results = [Result("Good page", "https://a.com", PAGE, "2026-01-01"), Result("Weak page", "https://b.com", PAGE, None)]
      compare_states: list[dict[str, Any]] = []

      def score(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
          if "best" in questions:
              best = {"choice": "2", "confidence": 0.8, "probabilities": {"1": 0.1, "2": 0.85, "3": 0.05}}
              return Scored({"best": best, "has_answer": {"noul": has_answer[state["source"]["title"]]}}, "rank-id", 100, 0.1)
          compare_states.append(state)
          return Scored({name: {"noul": answers} for name in questions}, "compare-id", 50, 0.1)

      monkeypatch.setattr(search_client, "search", lambda question, client=None: results)
      monkeypatch.setattr(decisions_client, "score", score)
      return compare_states


  def test_low_has_answer_excludes_candidate(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      compare_states = fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.1}, answers=0.9)
      answer = quote_finder.find_quote("q?", tmp_path)
      assert compare_states[0]["candidates"] == {"1": "Another sentence about the topic."}
      assert answer is not None and answer.result.title == "Good page"


  def test_answer_below_cutoff_returns_none(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.8}, answers=0.5)
      assert quote_finder.find_quote("q?", tmp_path) is None
      run = json.loads((tmp_path / "run.json").read_text())
      assert run["answer"] is None
      assert run["closest"]["result_index"] == 1 and run["closest"]["answers"] == 0.5


  def test_no_candidate_skips_compare(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      compare_states = fake_apis(monkeypatch, {"Good page": 0.1, "Weak page": 0.2}, answers=0.9)
      assert quote_finder.find_quote("q?", tmp_path) is None
      run = json.loads((tmp_path / "run.json").read_text())
      assert compare_states == [] and run["compare"] is None
      assert run["closest"]["result_index"] == 2 and run["totals"]["decisions_requests"] == 2


  def test_run_json_written_on_error(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.9}, answers=0.9)

      def fail(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
          request = httpx.Request("POST", decisions_client.DECISIONS_URL)
          raise httpx.HTTPStatusError("500", request=request, response=httpx.Response(500, request=request))

      monkeypatch.setattr(decisions_client, "score", fail)
      with pytest.raises(httpx.HTTPStatusError):
          quote_finder.find_quote("q?", tmp_path)
      run = json.loads((tmp_path / "run.json").read_text())
      assert run["error"].startswith("HTTPStatusError") and len(run["search"]["results"]) == 2


  def test_search_parses_results(monkeypatch: pytest.MonkeyPatch) -> None:
      monkeypatch.setenv("PERPLEXITY_API_KEY", "test-key")
      body = {
          "id": "x",
          "results": [
              {"title": "A", "url": "https://a.com", "snippet": "Text.", "date": "2024-02-26", "last_updated": "2025-01-01"},
              {"title": "B", "url": "https://b.com", "snippet": "More.", "date": None},
          ],
      }
      sent: list[dict[str, Any]] = []

      def handler(request: httpx.Request) -> httpx.Response:
          sent.append(json.loads(request.content))
          return httpx.Response(200, json=body)

      with httpx.Client(transport=httpx.MockTransport(handler)) as client:
          results = search_client.search("q?", client)
      assert sent == [{"query": "q?", "max_results": 5, "max_tokens_per_page": 2048}]
      assert results == [Result("A", "https://a.com", "Text.", "2024-02-26"), Result("B", "https://b.com", "More.", None)]
  ```
</Accordion>

<Accordion title="Run the tests">
  ```bash theme={null}
  python -m pytest
  ```

  ```text theme={null}
  ..........                                                               [100%]
  10 passed in 0.09s
  ```
</Accordion>

## Run it

Each run searches the live web, so the results and the probabilities can change from run to run. Each run overwrites `out/run.json`, which holds your question, the page text, and the request IDs. Add `out/` to `.gitignore` if the folder is in a repository.

<Accordion title="Run the quote finder">
  ```bash theme={null}
  python quote_finder.py "How many bones are in the adult human body?"
  ```
</Accordion>

Recorded on 2026-10-09 at 18:19 UTC with `pplx-decider-v1.1-27b`. Your output will differ.

<Accordion title="Observed output: a numeric fact">
  ```text theme={null}
  Question: How many bones are in the adult human body?
  Search: 5 results in 0.4 s

  #  result                                   sentences  has_answer  best  p(best)  confidence
  1  Human body | Organs, Systems, Structure, 3          1.000       2     0.998    0.997
  2  Bones: How Many Do Humans Have, Types, A 9          0.999       1     0.999    0.999
  3  Bones of The Human Body                  2          1.000       2     0.999    0.999
  4  Spinal and Skeletal Bone: Questions and  4          0.999       3     0.999    0.998
  5  Bone Anatomy                             3          0.999       2     0.999    0.999

  Comparing 5 candidates in one request

  #  answers  sentence
  1  0.998    An adult human body typically has 206 bones.
  3  0.998    There are a total of **206 bones ** in the adult human body.
  5  0.996    The skeleton of an adult human is made up of 206 bones of many different shapes and sizes.
  4  0.996    An average adult has 206 bones.
  2  0.915    Adults have between 206 and 213 bones.

  Answer (answers 0.998):
  "An adult human body typically has 206 bones."
  Human body | Organs, Systems, Structure, Diagram, & Facts, https://www.britannica.com/science/human-body, 2026-04-27

  6 Decisions requests, 4,177 input tokens, 2.1 s total
  Wrote out/run.json
  ```
</Accordion>

Recorded on 2026-10-09 at 18:19 UTC.

<Accordion title="Observed output: a date">
  ```text theme={null}
  Question: In what year was the Hubble Space Telescope launched?
  Search: 5 results in 0.5 s

  #  result                                   sentences  has_answer  best  p(best)  confidence
  1  30 Years Ago: Hubble Launched to Unlock  3          0.999       3     0.985    0.977
  2  The History of Hubble                    3          0.999       3     0.953    0.930
  3  ESA - Hubble overview                    3          1.000       2     0.919    0.878
  4  Hubble History Timeline: Non-Interactive 4          0.999       3     0.535    0.380
  5  NASA's Kennedy Space Center Celebrates H 3          0.997       3     0.997    0.996

  Comparing 5 candidates in one request

  #  answers  sentence
  2  0.997    Hubble was launched April 24, 1990, aboard Space Shuttle Discovery's STS-31 mission.
  1  0.997    The launch of the Hubble Space Telescope took place on April 24, 1990, during the STS-31 mission.
  4  0.991    April 24, 1990 – Hubble launched
  5  0.989    Though only projected to be in service for 10 years when it launched aboard space shuttle Discovery on April 24, 1990, from Kennedy Space Center in Florida, the unique telescope is still a technological marvel 25 years later.
  3  0.984    **Launch date:** 24 April 1990

  Answer (answers 0.997):
  "Hubble was launched April 24, 1990, aboard Space Shuttle Discovery's STS-31 mission."
  The History of Hubble, https://science.nasa.gov/mission/hubble/overview/the-history-of-hubble/, 2022-05-26

  6 Decisions requests, 4,713 input tokens, 1.8 s total
  Wrote out/run.json
  ```
</Accordion>

Recorded on 2026-10-09 at 18:19 UTC. No page in the top five gives a count for one floor's railing.

<Accordion title="Observed output: no answer">
  ```text theme={null}
  Question: How many rivets are in the railing of the Eiffel Tower's second floor?
  Search: 5 results in 0.4 s

  #  result                                   sentences  has_answer  best  p(best)  confidence
  1  Eiffel Tower Information, Tips and Histo 3          0.320       3     0.996    0.994
  2  Eiffel Tower Height: 330m (1,083 ft) – D 4          0.043       -     -        -          no candidate
  3  Facts, height in feet, weight, ...       3          0.259       -     -        -          no candidate
  4  Tour Eiffel - Paris                      2          0.164       -     -        -          no candidate
  5  All you need to know about               6          0.172       -     -        -          no candidate

  Comparing 1 candidate in one request

  #  answers  sentence
  1  0.536    2,500,000 rivets hold it together.

  Answer: No sentence in the top 5 results answers this question.
  Closest (answers 0.536, below cutoff):
  "2,500,000 rivets hold it together."
  Eiffel Tower Information, Tips and History, https://www.parisperfect.com/plan-your-trip/things-to-see/monuments-landmarks/eiffel-tower.php

  6 Decisions requests, 3,182 input tokens, 1.8 s total
  Wrote out/run.json
  ```
</Accordion>

## Reading the numbers

**The bones question.** Every result had a sentence with 206 in it, and every `has_answer` was 0.999 or higher. The compare request scored four of the five candidates between 0.996 and 0.998. "Adults have between 206 and 213 bones" came in lower, at 0.915. Britannica's sentence printed as the answer at 0.998.

**The Hubble question.** Results 1 and 2 both show 0.997 at three decimals. Your code compares the unrounded values, and result 2 was higher (0.99742 against 0.99716), so the NASA sentence printed.

**The rivets question.** Every page gives the tower's total of about 2.5 million rivets, and none gives a count for the second floor. Four results had `has_answer` below 0.3 and sent no candidate. Result 1 cleared that cutoff at 0.320, and its candidate scored 0.536 in the compare request, under the 0.6 cutoff. Your code printed the no-answer line and showed that sentence as the closest.

**Ten questions.** We ran the recipe on 2026-10-09 between 21:14 and 21:15 UTC on the ten questions below: six with a known numeric or dated answer, and four built to have no sentence-level answer in the top results. We read every printed quote.

| Outcome | Count |
| - | - |
| Correct quote | 6 |
| Wrong quote | 1 |
| Correct no-answer | 3 |
| Missed answer | 0 |

A correct no-answer means none of the five snippets answers the question. It does not mean no page on the web does.

<Accordion title="The ten questions">
  | Question | Expected |
  | - | - |
  | How deep is the Mariana Trench? | answer |
  | How long does light from the Sun take to reach Earth? | answer |
  | How many bones are in the adult human body? | answer |
  | When did Voyager 1 cross the heliopause? | answer |
  | When was the Rosetta Stone discovered? | answer |
  | In what year was the Hubble Space Telescope launched? | answer |
  | How many bolts hold the Hubble Space Telescope's primary mirror to its support structure? | no answer |
  | How many pages were in the Voyager 1 launch-day countdown checklist? | no answer |
  | How many rivets are in the railing of the Eiffel Tower's second floor? | no answer |
  | What color was the ink used to sign the Treaty of Rome in 1957? | no answer |
</Accordion>

The wrong quote came from "What color was the ink used to sign the Treaty of Rome in 1957?" No page names an ink color. The top result was a Romanian article whose headline says the treaty was signed on blank pages. That headline got a `has_answer` of 0.906 and a compare probability of 0.973, so your code printed it. A high probability is an estimate that the sentence states the answer to your question. It does not mean the sentence is about what you asked.

A quote that answers is not a quote that is true. Treat the printed sentence as the best candidate from these results, and check it before you rely on it for anything that matters.

**Repeats.** We ran each of the three questions above five times in a row. All fifteen runs got the same five results and printed the same sentence with the same probabilities: 0.998 for bones, 0.997 for Hubble, and 0.536 for rivets. Search results change over days and weeks, and the [Decisions quickstart](/docs/decisions/quickstart) notes that identical requests can occasionally differ in the second decimal place.

**Time and tokens.** In the ten-question run, a rank request used 237 to 2,554 input tokens (median 678) and took 0.24 to 0.49 seconds (median 0.26). A full question, including the search, took 1.6 to 2.6 seconds (median 2.0). Token counts repeat closely from run to run; timings vary, and these come from that one run.

**What to watch for.**

* The `date` field is whatever the Search API returns for the page. For the Wikipedia results in our runs, it was a date from 2001, years before the facts on the page.
* A quote can be a real published figure and still not the current one. In two runs of the Mariana Trench question, Wikipedia results gave 10,935 ± 6 meters and 10,984 ± 25 metres, both with a `date` of 2001-05-14. The first matches [NOAA's revised 2021 measurement](https://repository.library.noaa.gov/view/noaa/33477). They scored 0.986 and 0.985 in the compare request. The probability covers whether a sentence states the answer, not whether the figure is current.
* A snippet can end mid-sentence. In one run, the quote for a Statue of Liberty question stopped at "has 64" because that was where the snippet stopped.
* The splitter breaks after abbreviations such as "Aug." when a number follows, so "Voyager 1 entered interstellar space on Aug." showed up as a candidate. It scored 0.141 in the compare request and was not printed.
* Results can be in other languages. The Treaty of Rome question returned Romanian, Japanese, French, and Spanish pages.

## Adapt it

* **Return the top three quotes.** Print the three highest compare probabilities with their URLs for a research notes tool.
* **Quote only trusted sources.** Add `search_domain_filter` to the Search API request, or `search_recency_filter` for recent facts. Add `search_language_filter` to keep quotes in one language.
* **Add one sentence of framing.** Send the question and the quote to the [Agent API](/docs/agent-api/quickstart) and ask for a one-sentence lead-in. Print the quote unchanged after it.
* **Keep a citation record.** Store the quote, URL, date, and request IDs from `out/run.json` with your answer.
* **Quote your own documents.** Replace `search_client.py` with a function that returns `Result` objects from your own text. Nothing else changes.

## Troubleshooting

* **`Set PERPLEXITY_API_KEY first`**: run the `export` line in this terminal.
* **`401` from either API**: the key is wrong or inactive. A Decisions API `401` carries no request ID.
* **`No results`**: the search returned nothing. The script exits normally.
* **Every result is `skipped: no sentences`**: the snippets had no piece between 25 and 400 characters. Rephrase the question.
* **The quote is on topic but does not answer**: open `out/run.json` and read the `probabilities` map for that result. A close runner-up shows up as a low `confidence`. Raise `ANSWER_CUTOFF` and expect more no-answer results.
* **`400` with `Each decision needs between 1 and 255 options`**: a `choice` got more than 255 sentences. Check the `MAX_SENTENCES` cap in `sentences.py`.
* **`429`**: one question sends its Decisions requests one at a time, well under the 10 requests per second limit. If you run many questions in parallel, the client retries twice and then fails; slow down.
* **A different sentence on a rerun**: the search results changed, or a probability moved. Each run overwrites `out/run.json`, so save the second run elsewhere with `--out out/run-2` and compare `out/run.json` with `out/run-2/run.json`.

## The complete files

Each file in full, for copying.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  pytest==9.1.1
  ```
</Accordion>

<Accordion title="pyproject.toml">
  ```toml pyproject.toml theme={null}
  [tool.ruff]
  line-length = 150
  target-version = "py310"

  [tool.ruff.lint]
  select = ["E", "F", "I", "B", "UP", "C4", "SIM"]

  [tool.mypy]
  strict = true
  ignore_missing_imports = true

  [tool.pytest.ini_options]
  addopts = "-q"
  ```
</Accordion>

<Accordion title="search_client.py">
  ```python search_client.py theme={null}
  """Ask the Search API for result pages and their extracted text."""

  from __future__ import annotations

  import os
  import time
  from dataclasses import dataclass
  from typing import Any

  import httpx

  SEARCH_URL = "https://api.perplexity.ai/search"
  MAX_RESULTS = 5
  MAX_TOKENS_PER_PAGE = 2048
  RETRIES = 2
  RETRY_STATUSES = {429, 500, 502, 503}


  @dataclass(frozen=True)
  class Result:
      """One search result. The snippet is the page text the quote must come from."""

      title: str
      url: str
      snippet: str
      date: str | None


  def search_request(question: str) -> dict[str, Any]:
      """The request body: the question, five results, and up to 2,048 tokens of text per page."""
      return {"query": question, "max_results": MAX_RESULTS, "max_tokens_per_page": MAX_TOKENS_PER_PAGE}


  def parse_results(data: dict[str, Any]) -> list[Result]:
      """Keep the four fields the recipe uses. `date` can be missing or null."""
      return [Result(title=item["title"], url=item["url"], snippet=item["snippet"], date=item.get("date")) for item in data["results"]]


  def search(question: str, client: httpx.Client | None = None) -> list[Result]:
      """Send one Search API request, retrying briefly on 429, 500, 502, and 503."""
      if client is None:
          with httpx.Client(timeout=30.0) as new_client:
              return search(question, new_client)
      headers = {"Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}"}
      for attempt in range(RETRIES + 1):
          response = client.post(SEARCH_URL, headers=headers, json=search_request(question))
          if response.status_code in RETRY_STATUSES and attempt < RETRIES:
              time.sleep(float(response.headers.get("Retry-After", "1")))
              continue
          response.raise_for_status()
          break
      return parse_results(response.json())
  ```
</Accordion>

<Accordion title="sentences.py">
  ```python sentences.py theme={null}
  """Split a Search API snippet into sentences your code can number and quote."""

  from __future__ import annotations

  import re

  MIN_CHARS = 25
  MAX_CHARS = 400
  MAX_SENTENCES = 255  # the choice option limit

  # A sentence ends at . ! or ?, plus any footnote markers like ^[1]^, followed by whitespace
  # and a capital letter, digit, quote, or bracket. The group keeps the ending with its sentence.
  BOUNDARY = re.compile(r"([.!?](?:\^\[[^\]]+\]\^)*)\s+(?=[A-Z0-9\"“(])")
  # Markdown line markers: headings, bullets, and quotes. "**bold**" at the start of a line is kept.
  LINE_PREFIX = re.compile(r"^\s*(?:[#*>-]+\s+)*")


  def split(snippet: str) -> list[str]:
      """Return the snippet's sentences in page order, cleaned only at the edges."""
      sentences: list[str] = []
      seen: set[str] = set()
      for line in snippet.replace("...", "\n").split("\n"):
          line = LINE_PREFIX.sub("", line)
          parts = BOUNDARY.split(line)
          for piece in (text + end for text, end in zip(parts[0::2], [*parts[1::2], ""], strict=True)):
              piece = piece.strip()
              if not MIN_CHARS <= len(piece) <= MAX_CHARS or piece in seen:
                  continue
              seen.add(piece)
              sentences.append(piece)
      return sentences[:MAX_SENTENCES]
  ```
</Accordion>

<Accordion title="decisions_client.py">
  ```python decisions_client.py theme={null}
  """Send one request to the Decisions API and return its answers untouched."""

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
  class Scored:
      """Probabilities from one request. Nothing here is a decision yet."""

      answers: dict[str, Any]  # the response "answers" object, untouched
      request_id: str  # x-request-id header, or ""
      input_tokens: int
      elapsed_s: float


  def score(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
      """Send the request, retrying briefly on 429, 500, 502, and 503, and return the answers."""
      if client is None:
          with httpx.Client(timeout=30.0) as new_client:
              return score(state, questions, new_client)
      body = {"model": MODEL, "state": state, "questions": questions}
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
      return Scored(
          answers=data["answers"],
          request_id=response.headers.get("x-request-id", ""),
          input_tokens=data["usage"]["input_tokens"],
          elapsed_s=round(time.perf_counter() - started, 3),
      )
  ```
</Accordion>

<Accordion title="quote_finder.py">
  ```python quote_finder.py theme={null}
  """Answer a question with one sentence quoted from a live search result."""

  from __future__ import annotations

  import argparse
  import json
  import os
  import sys
  import time
  from dataclasses import dataclass
  from datetime import datetime, timezone
  from pathlib import Path
  from typing import Any

  import httpx

  import decisions_client
  import search_client
  import sentences
  from search_client import Result

  # Cutoffs. Starting points, not validated production values.
  HAS_ANSWER_CUTOFF = 0.3  # a result below this sends no candidate to stage 4
  ANSWER_CUTOFF = 0.6  # the best candidate needs at least this to be printed as the answer
  MIN_SENTENCES = 1  # a result whose snippet has no usable sentence is skipped


  @dataclass
  class Candidate:
      """The top-ranked sentence of one result, with the probabilities behind it."""

      result: Result
      sentence_id: int
      sentence: str
      choice_probability: float
      choice_confidence: float
      has_answer: float
      rank_request_id: str
      answers: float | None = None  # filled in stage 4


  # ---- Requests ----------------------------------------------------------------


  def rank_request(question: str, result: Result, sents: list[str]) -> tuple[dict[str, Any], dict[str, Any]]:
      """Stage 3: number one result's sentences and ask which answers, and whether any does."""
      numbered = {str(n): text for n, text in enumerate(sents, start=1)}
      state = {"question": question, "source": {"title": result.title, "url": result.url}, "sentences": numbered}
      questions = {
          "best": {
              "type": "choice",
              "instructions": (
                  "Which numbered sentence most directly answers the question? "
                  "Prefer a sentence that states the answer itself over one that only mentions the topic."
              ),
              "criteria": numbered,
          },
          "has_answer": {
              "type": "noul",
              "instructions": "Does at least one of the numbered sentences answer the question?",
              "criteria": {
                  "true": "At least one sentence states the answer or directly implies it, so a reader could quote that sentence as the answer.",
                  "false": "The sentences discuss the topic but none states the answer, or answering would need outside knowledge.",
              },
          },
      }
      return state, questions


  def compare_request(question: str, candidates: list[Candidate]) -> tuple[dict[str, Any], dict[str, Any]]:
      """Stage 4: put every candidate in one state and ask the same yes/no of each."""
      state = {"question": question, "candidates": {str(n): c.sentence for n, c in enumerate(candidates, start=1)}}
      questions = {
          f"answers_{n}": {
              "type": "noul",
              "instructions": f"Does candidate {n} state the answer to the question?",
              "criteria": {
                  "true": "The sentence contains the answer itself and can be quoted as the answer without adding anything.",
                  "false": "The sentence is about the topic but does not contain the answer, or only hints at it.",
              },
          }
          for n in range(1, len(candidates) + 1)
      }
      return state, questions


  # ---- Pipeline ----------------------------------------------------------------


  def to_candidate(result: Result, sents: list[str], scored: decisions_client.Scored) -> Candidate:
      """Read the top-probability sentence and the has_answer probability from a stage 3 answer."""
      best = scored.answers["best"]
      choice = best["choice"]
      return Candidate(
          result=result,
          sentence_id=int(choice),
          sentence=sents[int(choice) - 1],
          choice_probability=best["probabilities"][choice],
          choice_confidence=best["confidence"],
          has_answer=scored.answers["has_answer"]["noul"],
          rank_request_id=scored.request_id,
      )


  def quote_record(index: int, c: Candidate) -> dict[str, Any]:
      """The run.json entry for a quoted sentence: where it came from and its probabilities."""
      source = {"title": c.result.title, "url": c.result.url, "date": c.result.date}
      return {"result_index": index, "sentence_id": c.sentence_id, "sentence": c.sentence, "answers": c.answers, "has_answer": c.has_answer, **source}


  def request_record(scored: decisions_client.Scored) -> dict[str, Any]:
      """The request ID, token count, and time of one Decisions request, for run.json."""
      return {"request_id": scored.request_id, "input_tokens": scored.input_tokens, "elapsed_s": scored.elapsed_s}


  def find_quote(question: str, out_dir: Path) -> Candidate | None:
      """Search, rank each result's sentences, compare the candidates, and print the quote or a no-answer line."""
      started = time.perf_counter()
      run: dict[str, Any] = {"question": question, "recorded_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
      run.update(search=None, rank=[], compare=None, answer=None, closest=None, totals=None)
      requests: list[decisions_client.Scored] = []
      try:
          with httpx.Client(timeout=30.0) as client:
              # Stages 1 and 2: search, then split every snippet into sentences.
              search_started = time.perf_counter()
              results = search_client.search(question, client)
              split_results = [(result, sentences.split(result.snippet)) for result in results]
              listed = [{"title": r.title, "url": r.url, "date": r.date, "sentence_count": len(s), "sentences": s} for r, s in split_results]
              run["search"] = {"elapsed_s": round(time.perf_counter() - search_started, 3), "results": listed}
              found = f"{len(results)} result{'' if len(results) == 1 else 's'}"
              print(f"Question: {question}\nSearch: {found} in {run['search']['elapsed_s']:.1f} s\n")
              if not results:
                  print("No results")
                  return None

              # Stage 3: one request per result. Keep each result's top-probability sentence.
              print(RESULTS_HEADER)
              ranked: list[tuple[int, Candidate]] = []
              for index, (result, sents) in enumerate(split_results, start=1):
                  if len(sents) < MIN_SENTENCES:
                      print(result_row(index, result, len(sents), None, "skipped: no sentences"))
                      continue
                  scored = decisions_client.score(*rank_request(question, result, sents), client)
                  requests.append(scored)
                  candidate = to_candidate(result, sents, scored)
                  ranked.append((index, candidate))
                  probabilities = {"choice_probability": candidate.choice_probability, "confidence": candidate.choice_confidence}
                  record = {"result_index": index, **request_record(scored), "has_answer": candidate.has_answer, "choice": str(candidate.sentence_id)}
                  run["rank"].append({**record, **probabilities, "probabilities": scored.answers["best"]["probabilities"]})
                  qualifies = candidate.has_answer >= HAS_ANSWER_CUTOFF
                  print(result_row(index, result, len(sents), candidate, "" if qualifies else "no candidate"))
              qualified = [(i, c) for i, c in ranked if c.has_answer >= HAS_ANSWER_CUTOFF]

              # Stage 4: one request with every qualified candidate, so the probabilities share one scale.
              if qualified:
                  scored = decisions_client.score(*compare_request(question, [c for _, c in qualified]), client)
                  requests.append(scored)
                  for n, (_, candidate) in enumerate(qualified, start=1):
                      candidate.answers = scored.answers[f"answers_{n}"]["noul"]
                  run["compare"] = {
                      **request_record(scored),
                      "candidates": {str(n): i for n, (i, _) in enumerate(qualified, start=1)},
                      "answers": {name: answer["noul"] for name, answer in scored.answers.items()},
                  }
                  qualified.sort(key=lambda pair: (-(pair[1].answers or 0.0), -pair[1].has_answer, pair[0]))
                  print_candidates(qualified)

              # Stage 5: your code quotes the top candidate only if it clears the cutoff.
              if qualified and (qualified[0][1].answers or 0.0) >= ANSWER_CUTOFF:
                  index, answer = qualified[0]
                  run["answer"] = quote_record(index, answer)
                  print()
                  print_quote(f"Answer (answers {answer.answers:.3f}):", answer)
                  return answer
              print(f"\nAnswer: No sentence in the top {found} answers this question.")
              if qualified:
                  index, closest = qualified[0]
                  print_quote(f"Closest (answers {closest.answers or 0.0:.3f}, below cutoff):", closest)
              elif ranked:
                  index, closest = max(ranked, key=lambda pair: (pair[1].has_answer, -pair[0]))
                  print_quote(f"Closest (has_answer {closest.has_answer:.3f}, below cutoff):", closest)
              if qualified or ranked:
                  run["closest"] = quote_record(index, closest)
              return None
      except Exception as error:
          run["error"] = f"{type(error).__name__}: {error}"
          raise
      finally:
          tokens = sum(r.input_tokens for r in requests)
          elapsed = round(time.perf_counter() - started, 3)
          run["totals"] = {"decisions_requests": len(requests), "input_tokens": tokens, "elapsed_s": elapsed}
          out_dir.mkdir(parents=True, exist_ok=True)
          (out_dir / "run.json").write_text(json.dumps(run, indent=2, ensure_ascii=False) + "\n")
          print(f"\n{len(requests)} Decisions requests, {tokens:,} input tokens, {elapsed:.1f} s total")
          print(f"Wrote {out_dir / 'run.json'}")


  # ---- Printing and command line -----------------------------------------------

  RESULTS_HEADER = f"{'#':<3}{'result':<41}{'sentences':<11}{'has_answer':<12}{'best':<6}{'p(best)':<9}confidence"


  def result_row(index: int, result: Result, count: int, candidate: Candidate | None, note: str) -> str:
      """One line of the results table. Results without a candidate show dashes."""
      has_answer = f"{candidate.has_answer:.3f}" if candidate else "-"
      if candidate and not note:
          best, p, confidence = str(candidate.sentence_id), f"{candidate.choice_probability:.3f}", f"{candidate.choice_confidence:.3f}"
      else:
          best, p, confidence = "-", "-", "-"
      line = f"{index:<3}{result.title[:40]:<41}{count:<11}{has_answer:<12}{best:<6}{p:<9}{confidence:<11}{note}"
      return line.rstrip()


  def print_candidates(qualified: list[tuple[int, Candidate]]) -> None:
      """The stage 4 table, highest probability first. # is the result number."""
      count = f"{len(qualified)} candidate{'' if len(qualified) == 1 else 's'}"
      print(f"\nComparing {count} in one request\n\n{'#':<3}{'answers':<9}sentence")
      for index, candidate in qualified:
          print(f"{index:<3}{candidate.answers or 0.0:<9.3f}{candidate.sentence}")


  def print_quote(label: str, candidate: Candidate) -> None:
      """The quote exactly as the Search API returned it, then its title, URL, and date."""
      source = ", ".join(part for part in (candidate.result.title, candidate.result.url, candidate.result.date) if part)
      print(f'{label}\n"{candidate.sentence}"\n{source}')


  def main() -> None:
      parser = argparse.ArgumentParser(description="Answer a question with one sentence quoted from a live search result.")
      parser.add_argument("question")
      parser.add_argument("--out", type=Path, default=Path("out"), help="folder for run.json (default: out)")
      args = parser.parse_args()
      if not os.environ.get("PERPLEXITY_API_KEY"):
          sys.exit("Set PERPLEXITY_API_KEY first")
      try:
          find_quote(args.question, args.out)
      except httpx.HTTPStatusError as error:
          url = error.request.url
          sys.exit(f"{url.host}{url.path} returned {error.response.status_code}: {error.response.text[:300]}")


  if __name__ == "__main__":
      main()
  ```
</Accordion>

<Accordion title="test_quote_finder.py">
  ```python test_quote_finder.py theme={null}
  """Offline tests. No API key, no network. Run with: python -m pytest -q"""

  from __future__ import annotations

  import json
  from pathlib import Path
  from typing import Any

  import httpx
  import pytest

  import decisions_client
  import quote_finder
  import search_client
  import sentences
  from decisions_client import Scored
  from search_client import Result

  PAGE = "One sentence about the topic here. Another sentence about the topic. A third sentence about the topic."


  def test_split_handles_markdown_and_ellipsis() -> None:
      snippet = (
          "## History\nThe trench was first sounded in 1875 by HMS Challenger.\n...\n"
          "* **Depth** is about 10,935 metres at the deepest point. It is deeper than Everest is tall."
      )
      assert sentences.split(snippet) == [
          "The trench was first sounded in 1875 by HMS Challenger.",
          "**Depth** is about 10,935 metres at the deepest point.",
          "It is deeper than Everest is tall.",
      ]


  def test_split_keeps_footnote_with_its_sentence() -> None:
      snippet = "The deepest point is the Challenger Deep.^[1]^ It is deeper than Everest is tall.^[a]^"
      assert sentences.split(snippet) == ["The deepest point is the Challenger Deep.^[1]^", "It is deeper than Everest is tall.^[a]^"]


  def test_split_caps_at_255() -> None:
      snippet = " ".join(f"Sentence number {n} is long enough to keep." for n in range(300))
      assert len(sentences.split(snippet)) == 255


  def test_rank_request_shape() -> None:
      sents = ["First sentence of the page.", "Second sentence of the page."]
      state, questions = quote_finder.rank_request("q?", Result("T", "https://e.com", "", None), sents)
      assert state == {"question": "q?", "source": {"title": "T", "url": "https://e.com"}, "sentences": {"1": sents[0], "2": sents[1]}}
      assert set(questions) == {"best", "has_answer"}
      assert questions["best"]["type"] == "choice" and questions["best"]["criteria"] == state["sentences"]
      assert questions["has_answer"]["type"] == "noul" and set(questions["has_answer"]["criteria"]) == {"true", "false"}


  def test_compare_request_shape() -> None:
      result = Result("T", "https://e.com", "", None)
      candidates = [quote_finder.Candidate(result, 1, f"Sentence {n}.", 0.9, 0.9, 0.9, "id") for n in range(3)]
      state, questions = quote_finder.compare_request("q?", candidates)
      assert state["candidates"] == {"1": "Sentence 0.", "2": "Sentence 1.", "3": "Sentence 2."}
      assert list(questions) == ["answers_1", "answers_2", "answers_3"]
      assert all(q["type"] == "noul" for q in questions.values())


  def fake_apis(monkeypatch: pytest.MonkeyPatch, has_answer: dict[str, float], answers: float) -> list[dict[str, Any]]:
      """Two fake results. Rank requests return has_answer by title; compare requests return `answers` for every candidate."""
      results = [Result("Good page", "https://a.com", PAGE, "2026-01-01"), Result("Weak page", "https://b.com", PAGE, None)]
      compare_states: list[dict[str, Any]] = []

      def score(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
          if "best" in questions:
              best = {"choice": "2", "confidence": 0.8, "probabilities": {"1": 0.1, "2": 0.85, "3": 0.05}}
              return Scored({"best": best, "has_answer": {"noul": has_answer[state["source"]["title"]]}}, "rank-id", 100, 0.1)
          compare_states.append(state)
          return Scored({name: {"noul": answers} for name in questions}, "compare-id", 50, 0.1)

      monkeypatch.setattr(search_client, "search", lambda question, client=None: results)
      monkeypatch.setattr(decisions_client, "score", score)
      return compare_states


  def test_low_has_answer_excludes_candidate(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      compare_states = fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.1}, answers=0.9)
      answer = quote_finder.find_quote("q?", tmp_path)
      assert compare_states[0]["candidates"] == {"1": "Another sentence about the topic."}
      assert answer is not None and answer.result.title == "Good page"


  def test_answer_below_cutoff_returns_none(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.8}, answers=0.5)
      assert quote_finder.find_quote("q?", tmp_path) is None
      run = json.loads((tmp_path / "run.json").read_text())
      assert run["answer"] is None
      assert run["closest"]["result_index"] == 1 and run["closest"]["answers"] == 0.5


  def test_no_candidate_skips_compare(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      compare_states = fake_apis(monkeypatch, {"Good page": 0.1, "Weak page": 0.2}, answers=0.9)
      assert quote_finder.find_quote("q?", tmp_path) is None
      run = json.loads((tmp_path / "run.json").read_text())
      assert compare_states == [] and run["compare"] is None
      assert run["closest"]["result_index"] == 2 and run["totals"]["decisions_requests"] == 2


  def test_run_json_written_on_error(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
      fake_apis(monkeypatch, {"Good page": 0.9, "Weak page": 0.9}, answers=0.9)

      def fail(state: dict[str, Any], questions: dict[str, Any], client: httpx.Client | None = None) -> Scored:
          request = httpx.Request("POST", decisions_client.DECISIONS_URL)
          raise httpx.HTTPStatusError("500", request=request, response=httpx.Response(500, request=request))

      monkeypatch.setattr(decisions_client, "score", fail)
      with pytest.raises(httpx.HTTPStatusError):
          quote_finder.find_quote("q?", tmp_path)
      run = json.loads((tmp_path / "run.json").read_text())
      assert run["error"].startswith("HTTPStatusError") and len(run["search"]["results"]) == 2


  def test_search_parses_results(monkeypatch: pytest.MonkeyPatch) -> None:
      monkeypatch.setenv("PERPLEXITY_API_KEY", "test-key")
      body = {
          "id": "x",
          "results": [
              {"title": "A", "url": "https://a.com", "snippet": "Text.", "date": "2024-02-26", "last_updated": "2025-01-01"},
              {"title": "B", "url": "https://b.com", "snippet": "More.", "date": None},
          ],
      }
      sent: list[dict[str, Any]] = []

      def handler(request: httpx.Request) -> httpx.Response:
          sent.append(json.loads(request.content))
          return httpx.Response(200, json=body)

      with httpx.Client(transport=httpx.MockTransport(handler)) as client:
          results = search_client.search("q?", client)
      assert sent == [{"query": "q?", "max_results": 5, "max_tokens_per_page": 2048}]
      assert results == [Result("A", "https://a.com", "Text.", "2024-02-26"), Result("B", "https://b.com", "More.", None)]
  ```
</Accordion>
