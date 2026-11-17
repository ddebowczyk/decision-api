> ## Documentation Index
> Fetch the complete documentation index at: https://docs.perplexity.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Drive a Browser with the Decisions API

> Build a browser agent that asks the Decisions API six questions about a numbered screenshot and gets probabilities back. Your code compares them to cutoffs and does the clicking, scrolling, and stopping. One Decisions API request per step, plus retries if needed.

Most browser agents ask a chat model to describe the next click in text, then parse an element out of the reply with no measure of how certain the model was. When the click is wrong, nothing tells you it was a guess.

The Decisions API returns probabilities instead of text. Your script numbers everything clickable on the page, screenshots it, and sends the picture to `pplx-decider-latest` with the goal and six questions: which badge advances the goal, whether the goal is already reached, whether a banner is in the way, and three more. The model never clicks anything. A six-rule policy in your code compares the probabilities to cutoffs and does the clicking, scrolling, and stopping.

The recipe is two Python files: one that calls the API and one that drives the browser with Playwright. The default goal navigates the public Perplexity docs to the Decisions API quickstart and finds the section about images, in five steps and about 37,000 input tokens.

<Frame caption="A live run of this recipe. The side panel shows the probabilities from each Decisions API response and the policy rule they trigger. The panel was added for the recording. The script prints the top candidates to the console and writes every probability to out/run.jsonl.">
  <video autoPlay muted loop playsInline controls className="w-full aspect-video" src="https://mintcdn.com/perplexity/b8meChceyTdCZFVn/docs/assets/images/cookbook/examples/decisions-api-browser-agent-demo.mp4?fit=max&auto=format&n=b8meChceyTdCZFVn&q=85&s=48504b78ebd262300db08ed034897f1f" data-path="docs/assets/images/cookbook/examples/decisions-api-browser-agent-demo.mp4" />
</Frame>

## What you need

* Python 3.10 or newer on macOS or Linux. The commands below use Unix shell syntax.
* A Perplexity API key from the [API Console](https://www.perplexity.ai/account/api).
* About 700 MB of free disk space for the Chromium browser that Playwright downloads.

## Set up

The project is six files in one folder, all copied from this page. The script creates `out/` when it runs.

```text theme={null}
decisions-api-browser-agent/
├── requirements.txt         # the three packages to install, with exact versions
├── pyproject.toml           # settings for the code checkers (ruff and mypy) and the tests
├── page_script.js           # runs inside the web page: draws the numbered badges, scrolls
├── decisions_client.py      # talks to the Decisions API: the six questions, one request per step, retries
├── browser_agent.py         # drives the browser: the policy, the clicks, the loop
├── test_browser_agent.py    # 8 tests that run with no API key
├── out/                     # created by the script: screenshots, run.jsonl (one JSON line per step), summary.json
└── .venv/                   # the Python virtual environment created in the setup step
```

Every step runs the same loop:

1. `browser_agent.py` asks Playwright to run `page_script.js`, which draws a numbered badge on everything clickable.
2. Playwright takes a screenshot.
3. `decisions_client.py` sends the goal, the screenshot, and six questions to the Decisions API, which returns a probability for every answer.
4. `browser_agent.py` compares the probabilities to its cutoffs and picks one action.
5. Playwright clicks or scrolls. Repeat until the goal is reached or the policy stops.

Only `browser_agent.py` decides. Playwright never sees the goal, and the API never touches the browser.

`requirements.txt` pins the three packages to the versions this tutorial was tested with.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  playwright==1.63.0
  pytest==9.1.1
  ```
</Accordion>

`httpx` sends the API requests. `playwright` controls the browser. `pytest` runs the tests.

`pyproject.toml` holds settings for `ruff` (code style), `mypy` (type checks), and `pytest`. You do not need `ruff` or `mypy` to run the agent.

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

Create the folder, save `requirements.txt` and `pyproject.toml` in it, then run the remaining commands. The virtual environment (`.venv`) keeps this project's packages separate from the rest of your system.

<Accordion title="Install and set your key">
  ```bash theme={null}
  python3 --version   # 3.10 or newer
  mkdir decisions-api-browser-agent && cd decisions-api-browser-agent
  # save requirements.txt and pyproject.toml in this folder, then continue
  python3 -m venv .venv
  source .venv/bin/activate
  python -m pip install -r requirements.txt
  python -m playwright install chromium
  export PERPLEXITY_API_KEY="your-api-key-here"
  ```
</Accordion>

The Chromium download is the slowest step. In a new terminal, run the `source` and `export` lines again.

## The page script

`page_script.js` runs inside the web page. Playwright passes it to the browser with `page.evaluate`. It is one function that takes a single command: `"number"` or `"scroll"`.

<Accordion title="page_script.js">
  ```javascript page_script.js theme={null}
  // Runs inside the web page. Called by browser_agent.py through Playwright's page.evaluate
  // with one argument: "number" draws a red numbered badge beside every visible clickable
  // element and returns the legend; "scroll" scrolls the page and any tall scroll box down.
  (command) => {
    // The page itself plus every tall scroll box (such as a docs sidebar), each listed once.
    const SCROLLERS = () => [...new Set([document.scrollingElement, ...document.querySelectorAll('*')])].filter(e =>
      e && (e === document.scrollingElement || /(auto|scroll)/.test(getComputedStyle(e).overflowY))
        && e.scrollHeight > e.clientHeight + 40 && e.getBoundingClientRect().height > 200);

    const number = () => {
      document.querySelectorAll('.dm-badge').forEach(e => e.remove());
      document.querySelectorAll('[data-dm]').forEach(e => { e.style.outline = ''; e.removeAttribute('data-dm'); });  // last step's marks are stale
      const els = [...document.querySelectorAll('a, button, input, select, [role=button], [role=link], [role=tab]')]
        .filter(e => !(e.tagName === 'A' && !e.getAttribute('href') && !e.onclick && !e.getAttribute('role')))
        .filter(e => {
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          return r.width >= 8 && r.height >= 8 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0
            && !e.disabled && e.getAttribute('aria-disabled') !== 'true'
            && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
        });
      const legend = [];
      let n = 0;
      els.slice(0, 250).forEach((e) => {
        const r = e.getBoundingClientRect();
        const img = e.querySelector('img');
        const label = (e.innerText || e.value || e.getAttribute('aria-label') || e.getAttribute('title')
          || e.getAttribute('placeholder') || (img && img.alt) || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').slice(0, 60);
        // Skip elements with nothing to read (invisible characters do not count) and elements covered by something else.
        const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
        const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
        const top = document.elementFromPoint(cx, cy);
        const covered = top && !top.classList.contains('dm-badge') && !(e === top || e.contains(top) || top.contains(e));
        if (!label || covered) return;
        n += 1;
        e.setAttribute('data-dm', String(n));
        // Anchor the badge to the element's first line of text so it sits beside its own line,
        // even for indented or wrapped items. Fall back to the element box.
        let a = r;
        const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT,
          {acceptNode: t => t.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP});
        const tn = walker.nextNode();
        if (tn) {
          const rg = document.createRange();
          rg.selectNodeContents(tn);
          const rects = rg.getClientRects();
          if (rects.length && rects[0].width > 0) a = rects[0];
        }
        const b = document.createElement('div');
        b.className = 'dm-badge';
        b.textContent = n;
        Object.assign(b.style, {position: 'fixed', left: Math.max(2, a.left - 20) + 'px',
          top: (a.top + (a.height - 16) / 2) + 'px', zIndex: 2147483646, background: '#d81b2b', color: '#fff',
          font: 'bold 11px/16px Arial', width: '16px', height: '16px', borderRadius: '8px',
          textAlign: 'center', pointerEvents: 'none'});
        document.body.appendChild(b);
        // For the local log only: add the nearest section heading to short sidebar labels,
        // so five links that all say "Quickstart" can be told apart. The model never sees this.
        let group = '';
        if (label.length <= 24 && e.closest('li')) {
          for (let el = e, hops = 0; el && hops < 6 && !group; el = el.parentElement, hops++) {
            for (let sib = el.previousElementSibling; sib && !group; sib = sib.previousElementSibling) {
              if (/^H[1-6]$/.test(sib.tagName) || sib.querySelector?.('h1,h2,h3,h4,h5,h6')) {
                group = (sib.innerText || '').trim().split('\n')[0].slice(0, 30);
              }
            }
          }
        }
        const tag = e.tagName.toLowerCase();
        legend.push({n, kind: tag === 'a' ? 'link' : tag, label: group && group !== label ? `${label} (${group})` : label});
      });
      return {legend, canScroll: SCROLLERS().some(e => e.scrollTop + e.clientHeight < e.scrollHeight - 4)};
    };

    const scroll = () => {
      SCROLLERS().forEach(e => e.scrollBy({top: Math.round(e.clientHeight * 0.75), behavior: 'instant'}));
      return null;
    };

    if (command === 'number') return number();
    if (command === 'scroll') return scroll();
    throw new Error(`unknown command: ${command}`);
  }
  ```
</Accordion>

Save this as `page_script.js` in the project folder.

`SCROLLERS` collects every scrollable container: the page itself and any tall element with its own scrollbar, such as a docs sidebar.

`number` does five things:

1. Removes the badges, numbers, and outline from the previous step. Without this, an element numbered 20 last step would keep that number, and the script could click it instead of the element with the highest probability.
2. Finds every link, button, input, select, and element with a button, link, or tab role that is on screen, at least 8 pixels wide and tall, visible, and enabled.
3. Skips elements with no readable text and elements covered by another element, such as a link under a sticky header, by checking what the browser reports at the element's center point. Elements inside iframes or shadow DOM are not found.
4. Numbers each remaining element, stores the number on it as `data-dm`, and draws a red badge beside the element's first line of text. Placement matters: in a sidebar with indented items, a badge at the corner of the element's box sat 50 pixels from its label, and the probability on the correct element dropped from 94% to 65%.
5. Returns a legend (number, kind, label) and `canScroll`. Short labels such as "Quickstart" include the nearest section heading, so the log can distinguish several "Quickstart" links. The legend is for the log only; it is never sent to the API.

`scroll` moves the page and every scrollable container down by three quarters of the window.

## The API client: decisions\_client.py

`decisions_client.py` calls the Decisions API and has no knowledge of the browser. Copy the complete file from [The complete files](#the-complete-files), then read it here in three parts.

### Endpoint, model, and retry settings

<Accordion title="Endpoint, model, and retry settings">
  ```python theme={null}
  """The part of the agent that talks to the Decisions API: the six questions, one request per step,
  and bounded retries. Nothing in this file knows about the browser."""

  from __future__ import annotations

  import base64
  import time
  from typing import Any

  import httpx

  API_URL = "https://api.perplexity.ai/v1/decisions"
  MODEL = "pplx-decider-latest"
  REQUEST_TIMEOUT_S = 90.0  # a 1,000-tile screenshot answers in about a second; this covers a slow one
  RETRY_STATUSES = {429, 500, 502, 503, 504}
  MAX_RETRIES = 2  # two more tries for those, and for dropped connections, waiting Retry-After seconds (or 1 s, then 2 s)
  MAX_RETRY_DELAY_S = 30.0  # if Retry-After asks for more than this, stop with an error instead of waiting

  RISK_LEVELS = [
      "Read only: browsing or navigating",
      "Enters information such as a search or a setting",
      "Changes account state such as signing in or selecting a plan",
      "Payment, purchase, or deletion",
  ]


  class DecisionsError(Exception):
      """The Decisions API returned an error response, or a response the script cannot read."""


  def make_client(api_key: str) -> httpx.Client:
      """One HTTP client for the whole run: it carries the key, the timeout, and a reused connection."""
      return httpx.Client(headers={"Authorization": f"Bearer {api_key}"}, timeout=REQUEST_TIMEOUT_S)
  ```
</Accordion>

* `API_URL` and `MODEL` set the endpoint and the model.
* `REQUEST_TIMEOUT_S`, `RETRY_STATUSES`, `MAX_RETRIES`, and `MAX_RETRY_DELAY_S` control the timeout and retries. A 429 (rate limit), a 5xx (server error), or a dropped connection is retried twice. A 400 or 401 is a problem with the request and is not retried. If the server asks for a wait longer than 30 seconds, the script stops with an error rather than retry early.
* `RISK_LEVELS` is a four-level scale from "Read only: browsing or navigating" to "Payment, purchase, or deletion," used by the `risk` question and by the policy.
* `DecisionsError` is raised when the API returns an error, or a 200 that is missing a field this script reads. A dedicated exception lets the agent catch this case and print one line instead of a stack trace.
* `make_client` builds the single HTTP client for the run, with the API key and timeout set in one place.

### The questions

<Accordion title="The questions">
  ```python theme={null}
  DISMISS_QUESTION = (
      "If a cookie banner, modal, or overlay is present, which numbered element closes it with the minimum consent? "
      "If none is present, pick the element you would click for the goal."
  )
  TARGET_QUESTION = (
      "Is an element that directly advances the goal visible in this screenshot? Answer no if the page would need to be scrolled to find it."
  )
  NEXT_QUESTION = "Which numbered element should be clicked next to make progress on the goal?"
  RISK_QUESTION = "How consequential is clicking the element that best advances the goal from this page?"


  def build_questions(count: int) -> dict[str, dict[str, Any]]:
      """Six fixed questions. The two choice questions take the badge numbers as options,
      with no descriptions: the model has to read the numbers off the screenshot."""
      badges: dict[str, None] = {str(n): None for n in range(1, count + 1)}
      return {
          "blocked": {"type": "noul", "instructions": "Is a cookie banner, modal, or login wall covering part of the page?"},
          "dismiss": {"type": "choice", "instructions": DISMISS_QUESTION, "criteria": badges},
          "target_visible": {"type": "noul", "instructions": TARGET_QUESTION},
          "next_action": {"type": "choice", "instructions": NEXT_QUESTION, "criteria": badges},
          "goal_reached": {"type": "noul", "instructions": "Has the goal already been fully completed on the page shown?"},
          "risk": {"type": "score", "instructions": RISK_QUESTION, "criteria": RISK_LEVELS},
      }
  ```
</Accordion>

`build_questions` returns the six questions sent on every step. The Decisions API has three question types, and this file uses all of them:

* `noul` is a yes-or-no question. The answer is the probability of yes. `blocked`, `target_visible`, and `goal_reached` are `noul`.
* `choice` is a select-one question. You supply the options; the answer is a probability for each. `dismiss` and `next_action` are `choice`. Their options are the badge numbers 1 to N with no description (`None`, sent as `null`), so the model must read each number from the screenshot and identify the element beside it.
* `score` is a rating question with ordered levels. `risk` is `score`, using the four `RISK_LEVELS`.

No question names a website or page. Each refers to "the goal," and the goal text is sent in the request.

### The request

<Accordion title="The request">
  ```python theme={null}
  def decide(client: httpx.Client, goal: str, png: bytes, count: int, last_action: str, step: int) -> tuple[dict[str, Any], float, str | None]:
      """One request per step: the goal, the last action, the screenshot, and the badge count.
      Returns the parsed response, the elapsed milliseconds, and the request id.
      Retries 429, 5xx, and dropped connections a bounded number of times; raises DecisionsError on any other failure."""
      body = {
          "model": MODEL,
          "state": [
              f"Goal: {goal}",
              f"Step {step}. Last action: {last_action}",
              {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(png).decode()}},
              f"The clickable elements carry red numbered badges 1 to {count}. Answer with the badge number.",
          ],
          "questions": build_questions(count),
      }
      for attempt in range(MAX_RETRIES + 1):
          t0 = time.perf_counter()
          try:
              response = client.post(API_URL, json=body)
          except httpx.TransportError:  # dropped connection or read timeout
              if attempt == MAX_RETRIES:
                  raise
              time.sleep(float(2**attempt))
              continue
          rid = response.headers.get("x-request-id")
          if response.status_code == 200:
              return _parse(response, count, rid), (time.perf_counter() - t0) * 1000, rid
          if response.status_code not in RETRY_STATUSES or attempt == MAX_RETRIES:
              break
          delay = _retry_delay(response, attempt)
          if delay > MAX_RETRY_DELAY_S:  # the server asked for a longer wait than this script is willing to make; do not retry early
              raise DecisionsError(f"Decisions API asked to wait {delay:.0f} s before retrying ({response.status_code}); stopping instead")
          time.sleep(delay)
      raise DecisionsError(f"Decisions API failed: {response.status_code} {response.text.strip()}" + (f" (x-request-id {rid})" if rid else ""))


  def _parse(response: httpx.Response, count: int, rid: str | None) -> dict[str, Any]:
      """The JSON body of a 200, checked for the shape this script reads. Anything else is a DecisionsError."""
      try:
          data = response.json()
          answers = data["answers"]
          for name in build_questions(count):
              answer = answers[name]
              if answer["type"] in ("choice", "score") and not answer["probabilities"]:
                  raise ValueError(f"{name} has no probabilities")
              if answer["type"] == "choice":
                  answer["probabilities"][answer["choice"]]  # the chosen option must be one of the scored ones
              if answer["type"] == "noul":
                  float(answer["noul"])
          int(data["usage"]["input_tokens"])
          return dict(data)
      except (ValueError, KeyError, TypeError) as exc:
          raise DecisionsError(
              f"Decisions API returned a 200 this script cannot read ({exc!r}): {response.text[:200]!r}" + (f" (x-request-id {rid})" if rid else "")
          ) from exc


  def _retry_delay(response: httpx.Response, attempt: int) -> float:
      """Seconds to wait before retrying: the Retry-After header if it is a number, else 1 s then 2 s."""
      try:
          return max(0.0, float(response.headers.get("retry-after", "")))
      except ValueError:
          return float(2**attempt)
  ```
</Accordion>

`decide` sends one request per step, plus retries if needed. The `state` is a list of four items: the goal, the previous action, the screenshot (as base64 text), and one sentence stating that the badges are numbered 1 to N. The goal is sent every time because the model retains nothing between requests.

`decide` takes the `httpx.Client` as an argument rather than creating its own, so the tests can pass a fake client that returns prepared responses.

The loop makes up to three attempts. A 200 returns the parsed JSON, the latency of that attempt in milliseconds, and the request id from the `x-request-id` header. A 429, 5xx, or dropped connection waits and retries; `_retry_delay` uses the `Retry-After` header when the server sends a number, otherwise 1 second, then 2. If the header asks for more than `MAX_RETRY_DELAY_S`, the loop stops with an error rather than retry early. Any other status raises `DecisionsError` with the status code, the API's message, and the request id. Include that id in any support request.

`_parse` checks a 200 for the fields this script reads: all six answers, probabilities for every `choice` and `score`, a `choice` that is one of the scored options, a number for every `noul`, and a token count. Anything else becomes a `DecisionsError` instead of a `KeyError` later. It is a sanity check, not full schema validation. The check iterates over `build_questions(count)`, so the question names are defined in one place.

## The agent: browser\_agent.py

`browser_agent.py` drives the browser and makes the decisions. Copy the complete file from [The complete files](#the-complete-files), then read it here in six parts.

### Imports and cutoffs

<Accordion title="Imports and cutoffs">
  ```python theme={null}
  """A browser agent that asks the Decisions API for probabilities and decides from them.

  Each step: number the clickable elements, screenshot the page, send the screenshot and the goal
  to the model (see decisions_client.py), compare the returned probabilities to cutoffs, act. The
  options the model scores are bare badge numbers, so the only link between an option and an
  element is the picture.
  """

  from __future__ import annotations

  import argparse
  import contextlib
  import json
  import os
  import sys
  from dataclasses import asdict, dataclass
  from pathlib import Path
  from typing import Any, Literal

  import httpx
  from playwright.sync_api import Error as PlaywrightError
  from playwright.sync_api import Page, ViewportSize, sync_playwright
  from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

  from decisions_client import RISK_LEVELS, DecisionsError, decide, make_client

  VIEWPORT: ViewportSize = {"width": 1280, "height": 800}  # 40 x 25 tiles of 32 px, under the 2,048-tile limit
  PAGE_SCRIPT = Path(__file__).with_name("page_script.js").read_text(encoding="utf-8")

  ACT_MIN = 0.6  # click only when the top candidate has at least this probability
  DONE_MIN = 0.8  # stop when goal_reached is at least this
  TARGET_MIN = 0.5  # below this the target is judged off screen: scroll instead of clicking
  BLOCKED_MIN = 0.8  # above this a banner or modal is in the way: clear it first
  RISK_STOP_LEVEL = 3  # "Payment, purchase, or deletion"
  RISK_STOP_MIN = 0.7  # ...with at least this probability on that level
  ```
</Accordion>

* The imports from `decisions_client` require both files to be in the same folder.
* `VIEWPORT` is the browser window, 1280 by 800 pixels. The API reads images in 32 by 32 pixel tiles and accepts up to 2,048 per image; 1280 by 800 is 1,000 tiles. The screenshot accounts for about 6,000 of the roughly 7,300 input tokens in each request.
* `PAGE_SCRIPT` reads `page_script.js` from the same folder once, at startup.
* The six values from `ACT_MIN` to `RISK_STOP_MIN` are the cutoffs, and they are the entire policy. `ACT_MIN = 0.6` means "click only if the model puts at least 0.6 on its top choice." A probability is the model's score, not a measured success rate. The cutoffs were chosen by observing where answers landed on these pages, and most sit far from 50% so that small run-to-run differences do not change the agent's behavior.

### Actions

<Accordion title="Actions">
  ```python theme={null}
  Kind = Literal["click", "dismiss", "scroll", "stop"]  # "dismiss" is a click that clears a banner
  StopReason = Literal["goal_reached", "risk_review", "low_confidence", "no_candidates"]


  @dataclass(frozen=True)
  class Action:
      """What the agent does next."""

      kind: Kind
      detail: str  # one sentence for the console
      badge: str | None = None  # the badge to click, when kind is "click" or "dismiss"
      stop_reason: StopReason | None = None  # why the run ends, when kind is "stop"
  ```
</Accordion>

`Action` is what the policy returns: a `kind`, a `detail` sentence for the console, the `badge` to click when there is one, and a `stop_reason` when the run is ending. `Kind` and `StopReason` are `Literal` types, so `mypy` catches a misspelled value before you run. `Action` is a `frozen` dataclass: nothing can modify it after the policy creates it.

### The policy

<Accordion title="The policy">
  ```python theme={null}
  def choose(answers: dict[str, Any], can_scroll: bool, labels: dict[str, str], last_dismissed: str | None) -> Action:
      """Turn one set of answers into one Action. Pure: no browser, no network.
      labels maps badge numbers to element text and is used only to avoid clicking the same banner button twice."""
      done = answers["goal_reached"]["noul"]
      blocked = answers["blocked"]["noul"]
      dismiss, p_dismiss = answers["dismiss"]["choice"], max(answers["dismiss"]["probabilities"].values())
      visible = answers["target_visible"]["noul"]
      choice, p_choice = answers["next_action"]["choice"], max(answers["next_action"]["probabilities"].values())
      # probability that the next click is at the stop level or worse (levels are ordered, so sum from the level up)
      p_risk_stop = sum(p for level, p in answers["risk"]["probabilities"].items() if int(level) >= RISK_STOP_LEVEL)

      if done >= DONE_MIN:
          return Action("stop", f"Goal reached ({done:.0%}).", stop_reason="goal_reached")
      if p_risk_stop >= RISK_STOP_MIN:  # checked before any click, including a banner dismissal
          return Action(
              "stop",
              f"Next click is {RISK_LEVELS[RISK_STOP_LEVEL].lower()} or worse ({p_risk_stop:.0%}). Stopping for a person to review {choice}.",
              stop_reason="risk_review",
          )
      if blocked >= BLOCKED_MIN and p_dismiss >= ACT_MIN and labels.get(dismiss) != last_dismissed:
          return Action("dismiss", f"Banner in the way ({blocked:.0%}). Clearing it: clicking {dismiss} ({p_dismiss:.0%}).", badge=dismiss)
      if visible < TARGET_MIN and can_scroll:
          return Action("scroll", f"Target not in view ({visible:.0%} visible). Scrolling.")
      if p_choice >= ACT_MIN:
          return Action("click", f"Clicking {choice} ({p_choice:.0%}).", badge=choice)
      return Action("stop", f"No candidate above {ACT_MIN:.0%} (best {p_choice:.0%}). Stopping rather than guessing.", stop_reason="low_confidence")
  ```
</Accordion>

`choose` is where the decision is made: it takes the model's probabilities and returns one `Action`. It touches neither the browser nor the network, so the tests can check each rule in under a second.

The order of the checks is the policy, read top to bottom:

1. If `goal_reached` is at least 80%, stop. Completion takes priority over everything else.
2. If the next click is probably a payment, purchase, or deletion (0.7 or more on level 3), stop for human review. This runs before any click, including a banner dismissal. It is a model's estimate from a screenshot, not a safeguard, so use this agent on pages where a wrong click is harmless.
3. If a banner is probably in the way (80%) and one element has at least 60% as the one that closes it, dismiss it. The loop remembers the last banner button it clicked so the same one is never clicked twice.
4. If the target is probably not on screen (under 50%) and the page can still scroll, scroll.
5. If the best click candidate is at least 60%, click it.
6. Otherwise stop rather than guess.

### Acting on the page

<Accordion title="Acting on the page">
  ```python theme={null}
  def act(page: Page, action: Action, pause_s: float, out: Path, step: int) -> None:
      """Show the decision, save the decision frame, then scroll or click. Stops change nothing on the page."""
      if action.badge:
          page.evaluate("n => document.querySelector(`[data-dm='${n}']`).style.outline = '3px solid #28a745'", action.badge)
      page.wait_for_timeout(int(pause_s * 1000))
      page.screenshot(path=str(out / f"step-{step:02d}-decision.png"))
      if action.kind == "scroll":
          page.evaluate(PAGE_SCRIPT, "scroll")
      elif action.badge:
          element = page.locator(f"[data-dm='{action.badge}']").first
          element.evaluate("e => e.removeAttribute('target')")  # keep the flow in one tab
          element.click()
          with contextlib.suppress(PlaywrightTimeoutError):  # some clicks change the page without a load event
              page.wait_for_load_state("load", timeout=8000)
          page.wait_for_timeout(1200)
      page.evaluate("document.querySelectorAll('.dm-badge').forEach(e => e.remove())")
  ```
</Accordion>

`act` is the only function that changes the page. If the action has a badge, it outlines that element in green, waits `pause_s` seconds (1.5 by default) so the decision is visible, and saves `out/step-NN-decision.png`. A scroll then runs the page script's `scroll` command. A click finds the element by its `data-dm` number, removes any `target` attribute so links open in the same tab, clicks, and waits for the page to load; some clicks change the page without a load event, so that wait may time out silently. A stop changes nothing. Finally, it removes the badges.

### The loop

<Accordion title="The loop">
  ```python theme={null}
  def run(args: argparse.Namespace, client: httpx.Client, page: Page, out: Path) -> dict[str, Any]:
      """The loop: number, screenshot, decide, log, act. Returns the run summary."""
      last_action, last_dismissed, stop_reason = "none, this is the first page", None, None
      page.goto(args.start_url, wait_until="load", timeout=45000)
      page.wait_for_timeout(1500)
      with (out / "run.jsonl").open("w", encoding="utf-8") as log:
          for step in range(1, args.max_steps + 1):
              found = page.evaluate(PAGE_SCRIPT, "number")
              if not found["legend"]:  # nothing to click yet: give a slow page two more seconds, then stop rather than send an empty choice
                  page.wait_for_timeout(2000)
                  found = page.evaluate(PAGE_SCRIPT, "number")
              if not found["legend"]:
                  print(f"step {step}: No clickable elements on the page. Stopping.")
                  stop_reason = "no_candidates"
                  break
              legend, can_scroll = found["legend"], found["canScroll"]
              png = page.screenshot(type="png")
              (out / f"step-{step:02d}-input.png").write_bytes(png)

              resp, ms, req_id = decide(client, args.goal, png, len(legend), last_action, step)
              answers = resp["answers"]
              labels = {str(x["n"]): x["label"] for x in legend}  # stays local; the model never sees it
              action = choose(answers, can_scroll, labels, last_dismissed)
              top = sorted(answers["next_action"]["probabilities"].items(), key=lambda kv: -kv[1])[:3]
              print(f"step {step}: {action.detail}  [{ms:.0f} ms, {resp['usage']['input_tokens']} tokens, {req_id}]")
              print("   top candidates: " + ", ".join(f"{k} '{labels.get(k, '')}' {v:.1%}" for k, v in top))
              record = {
                  "step": step,
                  "url": page.url,
                  "request_id": req_id,
                  "latency_ms": round(ms),
                  "model": resp.get("model"),
                  "usage": resp["usage"],
                  "legend": legend,
                  "answers": answers,
                  "action": asdict(action),
              }
              log.write(json.dumps(record) + "\n")
              log.flush()

              act(page, action, args.pause, out, step)
              if action.kind == "stop":
                  stop_reason = action.stop_reason
                  break
              if action.kind == "dismiss":
                  last_dismissed = labels.get(action.badge or "")
              last_action = "scrolled down" if action.kind == "scroll" else f"clicked element {action.badge}"
      return {"goal": args.goal, "steps": step, "stop_reason": stop_reason or "max_steps", "final_url": page.url}


  def _step_count(value: str) -> int:
      """argparse type for --max-steps: a whole number from 1 to 100."""
      n = int(value)
      if not 1 <= n <= 100:
          raise argparse.ArgumentTypeError("must be 1 to 100")
      return n
  ```
</Accordion>

`run` loads the start page, opens `out/run.jsonl`, and for each step:

1. Numbers the page and takes a screenshot, saved as `out/step-NN-input.png`. This is exactly what the model receives. If nothing is clickable, it waits two seconds and checks again, then stops with `no_candidates`.
2. Calls `decide` for the probabilities, then `choose` for the action.
3. Prints the action, latency, tokens, and request id, plus the top three click candidates with their labels. Writes everything to `run.jsonl`, including every probability at full precision.
4. Calls `act`.
5. Stops if the action was a stop. Otherwise records the action, in words, for the next request's `state`.

It returns a summary: the goal, the number of steps, why it stopped, and the final URL.

### Command line and entry point

<Accordion title="Command line and entry point">
  ```python theme={null}
  def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
      parser = argparse.ArgumentParser(description="Drive a browser toward a goal with the Decisions API.")
      parser.add_argument("--start-url", default="https://docs.perplexity.ai/docs/getting-started/overview")
      parser.add_argument("--goal", default="Open the Decisions API quickstart and find the section about images in state.")
      parser.add_argument("--max-steps", type=_step_count, default=10, metavar="N", help="give up after N steps (1 to 100)")
      parser.add_argument("--headed", action="store_true", help="show the browser window")
      parser.add_argument("--pause", type=float, default=1.5, help="seconds to hold each decision on screen")
      parser.add_argument("--out", type=Path, default=Path("out"), help="folder for screenshots, run.jsonl, and summary.json")
      return parser.parse_args(argv)


  def main(argv: list[str] | None = None) -> int:
      """Entry point. Returns the exit code: 0 when the loop ended on its own (any stop reason, including max_steps),
      1 on an API, network, or browser error, 2 on bad setup. On an error, out/ keeps the screenshots and run.jsonl
      written so far, but no summary.json."""
      args = parse_args(argv)
      api_key = os.environ.get("PERPLEXITY_API_KEY")
      if not api_key:
          print("Set PERPLEXITY_API_KEY", file=sys.stderr)
          return 2
      args.out.mkdir(parents=True, exist_ok=True)
      (args.out / "summary.json").unlink(missing_ok=True)  # never leave an old success summary next to a new run's files
      try:
          with make_client(api_key) as client, sync_playwright() as playwright:
              browser = playwright.chromium.launch(headless=not args.headed)
              try:
                  page = browser.new_page(viewport=VIEWPORT, locale="en-US")
                  summary = run(args, client, page, args.out)
              finally:
                  browser.close()
      except PlaywrightError as exc:  # PlaywrightTimeoutError is a PlaywrightError; drop Playwright's multi-line call log
          print(str(exc).splitlines()[0], file=sys.stderr)
          return 1
      except (DecisionsError, httpx.HTTPError) as exc:
          print(exc, file=sys.stderr)
          return 1
      (args.out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
      print(json.dumps(summary, indent=2))
      return 0


  if __name__ == "__main__":
      raise SystemExit(main())
  ```
</Accordion>

`parse_args` defines the options. Each has a default, so `python browser_agent.py` runs the tutorial flow. `_step_count` rejects a `--max-steps` value outside 1 to 100 before the browser opens.

`main` reads the API key from the environment and returns an exit code: `2` if the key is missing, `1` if the API, network, or browser fails, `0` when the loop ends on its own for any stop reason. It closes the browser even when `run` raises, and prints API, network, and browser errors to standard error as a single line. It deletes any previous `out/summary.json` before starting and writes a new one when the loop ends. On an error, `out/` keeps the screenshots and `run.jsonl` written so far, but no `summary.json`.

The last two lines run `main` only when the file is executed directly, not when the tests import it.

## Run it

From the project folder, with the virtual environment active and your key exported:

<Accordion title="Run the agent">
  ```bash theme={null}
  python browser_agent.py --headed
  ```
</Accordion>

`--headed` shows the browser window. The defaults start on the docs overview page with the goal "Open the Decisions API quickstart and find the section about images in state." Pass `--start-url` and `--goal` to use your own.

Output from a headless run on 2026-10-06 at 18:17 UTC. The labels in the console come from the local legend; the model received only the badge numbers.

<Accordion title="Observed output">
  ```text theme={null}
  step 1: Target not in view (7% visible). Scrolling.  [1141 ms, 7396 tokens, 021b0ec0-5788-45ba-a527-a1f8ee542e96]
     top candidates: 8 'Search Ctrl K' 27.1%, 19 'Quickstart (Router API)' 17.3%, 23 'Switch to light theme' 12.9%
  step 2: Target not in view (8% visible). Scrolling.  [417 ms, 7342 tokens, e80496ab-2176-4964-aa05-832b4bb0086d]
     top candidates: 10 'Quickstart (Router API)' 33.9%, 13 'Quickstart (Agent API)' 29.0%, 21 'Quickstart (Search API)' 9.0%
  step 3: Clicking 20 (100%).  [267 ms, 7294 tokens, df76dabd-ac5e-4e0c-94d9-13926e247514]
     top candidates: 20 'Quickstart (Decisions API)' 99.8%, 10 'Quickstart (Search API)' 0.1%, 8 'Search Ctrl K' 0.0%
  step 4: Clicking 31 (99%).  [258 ms, 7456 tokens, 044a2b17-6173-4b0f-87ee-27a0540386b2]
     top candidates: 31 'Images in state (On this page)' 98.6%, 26 'Quickstart (On this page)' 1.1%, 20 'Quickstart (Decisions API)' 0.0%
  step 5: Goal reached (100%).  [305 ms, 7456 tokens, 78a531aa-1b35-4a67-b124-b43d193670d3]
     top candidates: 31 'Images in state (On this page)' 60.2%, 20 'Quickstart (Decisions API)' 13.4%, 26 'Quickstart (On this page)' 4.4%
  {
    "goal": "Open the Decisions API quickstart and find the section about images in state.",
    "steps": 5,
    "stop_reason": "goal_reached",
    "final_url": "https://docs.perplexity.ai/docs/decisions/quickstart#images-in-state"
  }
  ```
</Accordion>

Five requests and 36,944 input tokens (tokens are how the API measures and bills a request): about 7,300 to 7,500 per step, of which about 6,000 are the screenshot. Our runs took 16 to 22 seconds, most of it page loads and the 1.5 second pause per decision. The first request took about a second; the others took a quarter to half a second.

Open `out/step-03-input.png` to see the frame the model received when it put 99.8% on badge 20, and `out/step-03-decision.png` for the same frame with the chosen link outlined. `out/run.jsonl` has every probability for every step.

## Reading the numbers

The model produced the probabilities; the policy produced the action.

**Steps 1 and 2: the policy scrolls.** `target_visible` is 7% and then 8%: the Decisions API section is below the visible part of the sidebar. The click candidates are spread thin, the best at about a third. That is the expected result when the right answer is not on the page. The policy checks `target_visible` before the click, so it scrolls instead of clicking a weak candidate.

**Step 3: badge 20 receives 99.8%.** "Quickstart" under the "Decisions API" heading is now on screen next to badge 20. `target_visible` rises to 99%, badge 20 receives 99.8%, the runner-up 0.1%, and the policy clicks. Three links on screen say "Quickstart"; scoring the right one requires reading the heading above it in the image.

**Step 4: a new page, a new badge 31.** On the quickstart page, "Images in state" in the "On this page" list is beside badge 31. The model puts 99% on it and the policy clicks. Badge numbers are reassigned every step; nothing carries over.

**Step 5: `goal_reached` crosses the cutoff.** It stayed far below 80% for four steps. With the "Images in state" heading at the top of the page it exceeds 99%, and the policy stops. Nothing in the code judges whether the goal is met; it asks the model and compares the answer to a cutoff.

Identical requests return similar probabilities, not identical ones. Across our runs, badge 20 on step 3 ranged from 93% to 99.8%, badge 31 on step 4 from 92% to 99%, and the step 1 and 2 candidates varied below 40%. Every action was the same because the cutoffs sit far from those values. Leave margin when you set cutoffs.

## Adapt it

* **Your goal and your site.** Pass `--start-url` and `--goal`. Write the goal as a plain instruction: "Open the pricing page and find the enterprise tier."
* **Add the labels.** For pages with many similar elements, put each element's label in its option description instead of `None`: `{str(x["n"]): f"{x['kind']} '{x['label']}'" for x in legend}`. In our test this raised the step 3 probability from 93% to 96% and added about 3,000 input tokens per step.
* **A more conservative stop.** Lower `RISK_STOP_LEVEL` to 2 to stop before sign-ins and plan changes as well; `choose` sums every level at or above it. To ask for confirmation instead of stopping, replace that branch's `Action("stop", ...)` with an `input()` prompt and click only on yes.
* **Form filling.** Add a `choice` question for which input to fill and a source for the value. The model scores the inputs from the screenshot; your code selects the top one and types into it.
* **Verify each action.** Add a `noul` question, "Did the last action described in the state produce the change it was meant to produce?", and log it.
* **Larger pages.** Keep the screenshot at or under 2,048 tiles of 32 by 32 pixels (1440 by 1440 or 2048 by 1024 fit). `choice` accepts up to 255 options; the page script caps at 250.

## Troubleshooting

* `Set PERPLEXITY_API_KEY` means the variable is not set in this terminal. Run the `export` line again.
* `Decisions API failed: 401 {"error":{"message":"Invalid API key provided. Ensure your API key is correct and active.","type":"invalid_api_key","code":401}}` means the key is wrong or inactive.
* `Decisions API failed: 400` is a problem with the request; `error.message` gives the reason. If you raise the page script's 250-badge cap, keep it at or under 255, the `choice` option limit. An image over 2,048 tiles returns 504 after about a minute, not 400; if you change `VIEWPORT`, keep width ÷ 32 × height ÷ 32 at or under 2,048.
* `Decisions API failed: 429` means your organization exceeded the request limit (10 per second) or the token limit, and two retries did not clear it. Another process is likely sharing the limit; wait and rerun.
* `FileNotFoundError: ... page_script.js` or `ModuleNotFoundError: No module named 'decisions_client'` means a file is not next to `browser_agent.py`.
* `No candidate above 60%`. Open `out/step-NN-input.png`. If two badges sit side by side next to the expected element, the image is ambiguous. If the right element is the top choice at around 50%, the goal sentence may be too vague.
* The agent scrolls to the bottom and reaches `--max-steps`. Nothing on the page advances the goal as written, or the target is inside a scrollable container the page script does not detect.
* The page shows "Just a moment..." or a verification challenge. Run with `--headed`; some sites challenge headless browsers.
* A click opens a new tab. `target="_blank"` links are handled; buttons that open windows with JavaScript are not. Add a `context.on("page")` handler if you need them.

## Test it

The tests use no API key, network, or browser. Save `test_browser_agent.py` next to the other files.

<Accordion title="test_browser_agent.py">
  ```python test_browser_agent.py theme={null}
  """Offline tests for the policy and the request. No API key, network, or browser needed."""

  from __future__ import annotations

  import json
  from typing import Any

  import httpx

  import browser_agent as ba
  import decisions_client as dc


  def answers(
      goal: float = 0.05,
      blocked: float = 0.1,
      visible: float = 0.9,
      p_top: float = 0.9,
      p_dismiss: float = 0.5,
      risk3: float = 0.02,
  ) -> dict[str, Any]:
      """One fake set of answers in the shape the Decisions API returns. Badge 7 is the top click; badge 2 closes the banner."""
      probs = {**{str(n): 0.001 for n in range(1, 11)}, "7": p_top}
      dprobs = {**{str(n): 0.001 for n in range(1, 11)}, "2": p_dismiss}
      return {
          "goal_reached": {"type": "noul", "noul": goal},
          "blocked": {"type": "noul", "noul": blocked},
          "target_visible": {"type": "noul", "noul": visible},
          "next_action": {"type": "choice", "choice": "7", "probabilities": probs},
          "dismiss": {"type": "choice", "choice": "2", "probabilities": dprobs},
          "risk": {"type": "score", "score": 0.2, "probabilities": {"0": 1 - risk3 - 0.02, "1": 0.01, "2": 0.01, "3": risk3}},
      }


  LABELS = {str(n): f"element {n}" for n in range(1, 11)}


  # --- choose(): one test per policy rule, in policy order ------------------------------------
  def test_goal_reached_stops_before_anything_else() -> None:
      action = ba.choose(answers(goal=0.9, blocked=0.95, p_dismiss=0.9, risk3=0.9), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "goal_reached")


  def test_payment_risk_stops_before_any_click() -> None:
      action = ba.choose(answers(blocked=0.95, p_dismiss=0.95, risk3=0.85), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "risk_review")


  def test_dismisses_a_banner_once() -> None:
      assert ba.choose(answers(blocked=0.9, p_dismiss=0.8), True, LABELS, None).kind == "dismiss"
      assert ba.choose(answers(blocked=0.9, p_dismiss=0.8), True, LABELS, "element 2").kind == "click"


  def test_scrolls_when_target_not_visible() -> None:
      assert ba.choose(answers(visible=0.2), True, LABELS, None).kind == "scroll"


  def test_clicks_confident_candidate() -> None:
      action = ba.choose(answers(), True, LABELS, None)
      assert (action.kind, action.badge) == ("click", "7")


  def test_stops_rather_than_guessing() -> None:
      action = ba.choose(answers(p_top=0.45), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "low_confidence")


  # --- decide(): the request, against a fake server -------------------------------------------
  OK = {"model": dc.MODEL, "answers": answers(), "usage": {"input_tokens": 7000}}


  def fake_client(responses: list[httpx.Response], calls: list[dict[str, Any]]) -> httpx.Client:
      """An httpx.Client that answers with the given responses in order and records each request body in calls."""

      def handler(request: httpx.Request) -> httpx.Response:
          calls.append(json.loads(request.content))
          return responses[len(calls) - 1]

      return httpx.Client(transport=httpx.MockTransport(handler))


  def test_decide_sends_the_model_screenshot_and_questions() -> None:
      calls: list[dict[str, Any]] = []
      with fake_client([httpx.Response(200, json=OK, headers={"x-request-id": "rid-1"})], calls) as client:
          resp, _, rid = dc.decide(client, "find pricing", b"png-bytes", 10, "none", 1)
      assert (resp, rid) == (OK, "rid-1")
      assert calls[0]["model"] == dc.MODEL
      assert calls[0]["state"][2]["image_url"]["url"].startswith("data:image/png;base64,")
      assert list(calls[0]["questions"]) == ["blocked", "dismiss", "target_visible", "next_action", "goal_reached", "risk"]


  def test_decide_retries_a_429() -> None:
      calls: list[dict[str, Any]] = []
      responses = [httpx.Response(429, json={"error": "slow down"}, headers={"retry-after": "0"}), httpx.Response(200, json=OK)]
      with fake_client(responses, calls) as client:
          resp, _, _ = dc.decide(client, "g", b"png", 3, "none", 1)
      assert (resp, len(calls)) == (OK, 2)
  ```
</Accordion>

* `answers` builds a fake set of answers in the same shape the API returns, so each test can set only the probabilities it cares about.
* **The policy.** Six tests, one per rule, in policy order: stop when the goal is reached, stop on payment risk before any click, dismiss a banner only once, scroll when the target is off screen, click a confident candidate, and stop rather than guess.
* **The request.** `fake_client` builds an `httpx.Client` on `httpx.MockTransport`, which returns prepared responses instead of calling the network. One test checks that the request carries the model, the screenshot, and the six questions. The other checks that a 429 is retried.

<Accordion title="Run the tests">
  ```bash theme={null}
  python -m pytest
  ```
</Accordion>

You should see:

```text theme={null}
........                                                                 [100%]
8 passed in 0.14s
```

Optional: the checks we ran before publishing. You should see exactly three lines: `All checks passed!`, `3 files already formatted`, and `Success: no issues found in 3 source files`.

<Accordion title="Lint, format, and type check">
  ```bash theme={null}
  python -m pip install ruff==0.16.10 mypy==2.4.0
  ruff check . && ruff format --check . && python -m mypy .
  ```
</Accordion>

## The complete files

The exact files used for the run above.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  playwright==1.63.0
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

<Accordion title="page_script.js">
  ```javascript page_script.js theme={null}
  // Runs inside the web page. Called by browser_agent.py through Playwright's page.evaluate
  // with one argument: "number" draws a red numbered badge beside every visible clickable
  // element and returns the legend; "scroll" scrolls the page and any tall scroll box down.
  (command) => {
    // The page itself plus every tall scroll box (such as a docs sidebar), each listed once.
    const SCROLLERS = () => [...new Set([document.scrollingElement, ...document.querySelectorAll('*')])].filter(e =>
      e && (e === document.scrollingElement || /(auto|scroll)/.test(getComputedStyle(e).overflowY))
        && e.scrollHeight > e.clientHeight + 40 && e.getBoundingClientRect().height > 200);

    const number = () => {
      document.querySelectorAll('.dm-badge').forEach(e => e.remove());
      document.querySelectorAll('[data-dm]').forEach(e => { e.style.outline = ''; e.removeAttribute('data-dm'); });  // last step's marks are stale
      const els = [...document.querySelectorAll('a, button, input, select, [role=button], [role=link], [role=tab]')]
        .filter(e => !(e.tagName === 'A' && !e.getAttribute('href') && !e.onclick && !e.getAttribute('role')))
        .filter(e => {
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          return r.width >= 8 && r.height >= 8 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0
            && !e.disabled && e.getAttribute('aria-disabled') !== 'true'
            && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
        });
      const legend = [];
      let n = 0;
      els.slice(0, 250).forEach((e) => {
        const r = e.getBoundingClientRect();
        const img = e.querySelector('img');
        const label = (e.innerText || e.value || e.getAttribute('aria-label') || e.getAttribute('title')
          || e.getAttribute('placeholder') || (img && img.alt) || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').slice(0, 60);
        // Skip elements with nothing to read (invisible characters do not count) and elements covered by something else.
        const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
        const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
        const top = document.elementFromPoint(cx, cy);
        const covered = top && !top.classList.contains('dm-badge') && !(e === top || e.contains(top) || top.contains(e));
        if (!label || covered) return;
        n += 1;
        e.setAttribute('data-dm', String(n));
        // Anchor the badge to the element's first line of text so it sits beside its own line,
        // even for indented or wrapped items. Fall back to the element box.
        let a = r;
        const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT,
          {acceptNode: t => t.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP});
        const tn = walker.nextNode();
        if (tn) {
          const rg = document.createRange();
          rg.selectNodeContents(tn);
          const rects = rg.getClientRects();
          if (rects.length && rects[0].width > 0) a = rects[0];
        }
        const b = document.createElement('div');
        b.className = 'dm-badge';
        b.textContent = n;
        Object.assign(b.style, {position: 'fixed', left: Math.max(2, a.left - 20) + 'px',
          top: (a.top + (a.height - 16) / 2) + 'px', zIndex: 2147483646, background: '#d81b2b', color: '#fff',
          font: 'bold 11px/16px Arial', width: '16px', height: '16px', borderRadius: '8px',
          textAlign: 'center', pointerEvents: 'none'});
        document.body.appendChild(b);
        // For the local log only: add the nearest section heading to short sidebar labels,
        // so five links that all say "Quickstart" can be told apart. The model never sees this.
        let group = '';
        if (label.length <= 24 && e.closest('li')) {
          for (let el = e, hops = 0; el && hops < 6 && !group; el = el.parentElement, hops++) {
            for (let sib = el.previousElementSibling; sib && !group; sib = sib.previousElementSibling) {
              if (/^H[1-6]$/.test(sib.tagName) || sib.querySelector?.('h1,h2,h3,h4,h5,h6')) {
                group = (sib.innerText || '').trim().split('\n')[0].slice(0, 30);
              }
            }
          }
        }
        const tag = e.tagName.toLowerCase();
        legend.push({n, kind: tag === 'a' ? 'link' : tag, label: group && group !== label ? `${label} (${group})` : label});
      });
      return {legend, canScroll: SCROLLERS().some(e => e.scrollTop + e.clientHeight < e.scrollHeight - 4)};
    };

    const scroll = () => {
      SCROLLERS().forEach(e => e.scrollBy({top: Math.round(e.clientHeight * 0.75), behavior: 'instant'}));
      return null;
    };

    if (command === 'number') return number();
    if (command === 'scroll') return scroll();
    throw new Error(`unknown command: ${command}`);
  }
  ```
</Accordion>

<Accordion title="decisions_client.py">
  ```python decisions_client.py theme={null}
  """The part of the agent that talks to the Decisions API: the six questions, one request per step,
  and bounded retries. Nothing in this file knows about the browser."""

  from __future__ import annotations

  import base64
  import time
  from typing import Any

  import httpx

  API_URL = "https://api.perplexity.ai/v1/decisions"
  MODEL = "pplx-decider-latest"
  REQUEST_TIMEOUT_S = 90.0  # a 1,000-tile screenshot answers in about a second; this covers a slow one
  RETRY_STATUSES = {429, 500, 502, 503, 504}
  MAX_RETRIES = 2  # two more tries for those, and for dropped connections, waiting Retry-After seconds (or 1 s, then 2 s)
  MAX_RETRY_DELAY_S = 30.0  # if Retry-After asks for more than this, stop with an error instead of waiting

  RISK_LEVELS = [
      "Read only: browsing or navigating",
      "Enters information such as a search or a setting",
      "Changes account state such as signing in or selecting a plan",
      "Payment, purchase, or deletion",
  ]


  class DecisionsError(Exception):
      """The Decisions API returned an error response, or a response the script cannot read."""


  def make_client(api_key: str) -> httpx.Client:
      """One HTTP client for the whole run: it carries the key, the timeout, and a reused connection."""
      return httpx.Client(headers={"Authorization": f"Bearer {api_key}"}, timeout=REQUEST_TIMEOUT_S)


  DISMISS_QUESTION = (
      "If a cookie banner, modal, or overlay is present, which numbered element closes it with the minimum consent? "
      "If none is present, pick the element you would click for the goal."
  )
  TARGET_QUESTION = (
      "Is an element that directly advances the goal visible in this screenshot? Answer no if the page would need to be scrolled to find it."
  )
  NEXT_QUESTION = "Which numbered element should be clicked next to make progress on the goal?"
  RISK_QUESTION = "How consequential is clicking the element that best advances the goal from this page?"


  def build_questions(count: int) -> dict[str, dict[str, Any]]:
      """Six fixed questions. The two choice questions take the badge numbers as options,
      with no descriptions: the model has to read the numbers off the screenshot."""
      badges: dict[str, None] = {str(n): None for n in range(1, count + 1)}
      return {
          "blocked": {"type": "noul", "instructions": "Is a cookie banner, modal, or login wall covering part of the page?"},
          "dismiss": {"type": "choice", "instructions": DISMISS_QUESTION, "criteria": badges},
          "target_visible": {"type": "noul", "instructions": TARGET_QUESTION},
          "next_action": {"type": "choice", "instructions": NEXT_QUESTION, "criteria": badges},
          "goal_reached": {"type": "noul", "instructions": "Has the goal already been fully completed on the page shown?"},
          "risk": {"type": "score", "instructions": RISK_QUESTION, "criteria": RISK_LEVELS},
      }


  def decide(client: httpx.Client, goal: str, png: bytes, count: int, last_action: str, step: int) -> tuple[dict[str, Any], float, str | None]:
      """One request per step: the goal, the last action, the screenshot, and the badge count.
      Returns the parsed response, the elapsed milliseconds, and the request id.
      Retries 429, 5xx, and dropped connections a bounded number of times; raises DecisionsError on any other failure."""
      body = {
          "model": MODEL,
          "state": [
              f"Goal: {goal}",
              f"Step {step}. Last action: {last_action}",
              {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(png).decode()}},
              f"The clickable elements carry red numbered badges 1 to {count}. Answer with the badge number.",
          ],
          "questions": build_questions(count),
      }
      for attempt in range(MAX_RETRIES + 1):
          t0 = time.perf_counter()
          try:
              response = client.post(API_URL, json=body)
          except httpx.TransportError:  # dropped connection or read timeout
              if attempt == MAX_RETRIES:
                  raise
              time.sleep(float(2**attempt))
              continue
          rid = response.headers.get("x-request-id")
          if response.status_code == 200:
              return _parse(response, count, rid), (time.perf_counter() - t0) * 1000, rid
          if response.status_code not in RETRY_STATUSES or attempt == MAX_RETRIES:
              break
          delay = _retry_delay(response, attempt)
          if delay > MAX_RETRY_DELAY_S:  # the server asked for a longer wait than this script is willing to make; do not retry early
              raise DecisionsError(f"Decisions API asked to wait {delay:.0f} s before retrying ({response.status_code}); stopping instead")
          time.sleep(delay)
      raise DecisionsError(f"Decisions API failed: {response.status_code} {response.text.strip()}" + (f" (x-request-id {rid})" if rid else ""))


  def _parse(response: httpx.Response, count: int, rid: str | None) -> dict[str, Any]:
      """The JSON body of a 200, checked for the shape this script reads. Anything else is a DecisionsError."""
      try:
          data = response.json()
          answers = data["answers"]
          for name in build_questions(count):
              answer = answers[name]
              if answer["type"] in ("choice", "score") and not answer["probabilities"]:
                  raise ValueError(f"{name} has no probabilities")
              if answer["type"] == "choice":
                  answer["probabilities"][answer["choice"]]  # the chosen option must be one of the scored ones
              if answer["type"] == "noul":
                  float(answer["noul"])
          int(data["usage"]["input_tokens"])
          return dict(data)
      except (ValueError, KeyError, TypeError) as exc:
          raise DecisionsError(
              f"Decisions API returned a 200 this script cannot read ({exc!r}): {response.text[:200]!r}" + (f" (x-request-id {rid})" if rid else "")
          ) from exc


  def _retry_delay(response: httpx.Response, attempt: int) -> float:
      """Seconds to wait before retrying: the Retry-After header if it is a number, else 1 s then 2 s."""
      try:
          return max(0.0, float(response.headers.get("retry-after", "")))
      except ValueError:
          return float(2**attempt)
  ```
</Accordion>

<Accordion title="browser_agent.py">
  ```python browser_agent.py theme={null}
  """A browser agent that asks the Decisions API for probabilities and decides from them.

  Each step: number the clickable elements, screenshot the page, send the screenshot and the goal
  to the model (see decisions_client.py), compare the returned probabilities to cutoffs, act. The
  options the model scores are bare badge numbers, so the only link between an option and an
  element is the picture.
  """

  from __future__ import annotations

  import argparse
  import contextlib
  import json
  import os
  import sys
  from dataclasses import asdict, dataclass
  from pathlib import Path
  from typing import Any, Literal

  import httpx
  from playwright.sync_api import Error as PlaywrightError
  from playwright.sync_api import Page, ViewportSize, sync_playwright
  from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

  from decisions_client import RISK_LEVELS, DecisionsError, decide, make_client

  VIEWPORT: ViewportSize = {"width": 1280, "height": 800}  # 40 x 25 tiles of 32 px, under the 2,048-tile limit
  PAGE_SCRIPT = Path(__file__).with_name("page_script.js").read_text(encoding="utf-8")

  ACT_MIN = 0.6  # click only when the top candidate has at least this probability
  DONE_MIN = 0.8  # stop when goal_reached is at least this
  TARGET_MIN = 0.5  # below this the target is judged off screen: scroll instead of clicking
  BLOCKED_MIN = 0.8  # above this a banner or modal is in the way: clear it first
  RISK_STOP_LEVEL = 3  # "Payment, purchase, or deletion"
  RISK_STOP_MIN = 0.7  # ...with at least this probability on that level


  Kind = Literal["click", "dismiss", "scroll", "stop"]  # "dismiss" is a click that clears a banner
  StopReason = Literal["goal_reached", "risk_review", "low_confidence", "no_candidates"]


  @dataclass(frozen=True)
  class Action:
      """What the agent does next."""

      kind: Kind
      detail: str  # one sentence for the console
      badge: str | None = None  # the badge to click, when kind is "click" or "dismiss"
      stop_reason: StopReason | None = None  # why the run ends, when kind is "stop"


  def choose(answers: dict[str, Any], can_scroll: bool, labels: dict[str, str], last_dismissed: str | None) -> Action:
      """Turn one set of answers into one Action. Pure: no browser, no network.
      labels maps badge numbers to element text and is used only to avoid clicking the same banner button twice."""
      done = answers["goal_reached"]["noul"]
      blocked = answers["blocked"]["noul"]
      dismiss, p_dismiss = answers["dismiss"]["choice"], max(answers["dismiss"]["probabilities"].values())
      visible = answers["target_visible"]["noul"]
      choice, p_choice = answers["next_action"]["choice"], max(answers["next_action"]["probabilities"].values())
      # probability that the next click is at the stop level or worse (levels are ordered, so sum from the level up)
      p_risk_stop = sum(p for level, p in answers["risk"]["probabilities"].items() if int(level) >= RISK_STOP_LEVEL)

      if done >= DONE_MIN:
          return Action("stop", f"Goal reached ({done:.0%}).", stop_reason="goal_reached")
      if p_risk_stop >= RISK_STOP_MIN:  # checked before any click, including a banner dismissal
          return Action(
              "stop",
              f"Next click is {RISK_LEVELS[RISK_STOP_LEVEL].lower()} or worse ({p_risk_stop:.0%}). Stopping for a person to review {choice}.",
              stop_reason="risk_review",
          )
      if blocked >= BLOCKED_MIN and p_dismiss >= ACT_MIN and labels.get(dismiss) != last_dismissed:
          return Action("dismiss", f"Banner in the way ({blocked:.0%}). Clearing it: clicking {dismiss} ({p_dismiss:.0%}).", badge=dismiss)
      if visible < TARGET_MIN and can_scroll:
          return Action("scroll", f"Target not in view ({visible:.0%} visible). Scrolling.")
      if p_choice >= ACT_MIN:
          return Action("click", f"Clicking {choice} ({p_choice:.0%}).", badge=choice)
      return Action("stop", f"No candidate above {ACT_MIN:.0%} (best {p_choice:.0%}). Stopping rather than guessing.", stop_reason="low_confidence")


  def act(page: Page, action: Action, pause_s: float, out: Path, step: int) -> None:
      """Show the decision, save the decision frame, then scroll or click. Stops change nothing on the page."""
      if action.badge:
          page.evaluate("n => document.querySelector(`[data-dm='${n}']`).style.outline = '3px solid #28a745'", action.badge)
      page.wait_for_timeout(int(pause_s * 1000))
      page.screenshot(path=str(out / f"step-{step:02d}-decision.png"))
      if action.kind == "scroll":
          page.evaluate(PAGE_SCRIPT, "scroll")
      elif action.badge:
          element = page.locator(f"[data-dm='{action.badge}']").first
          element.evaluate("e => e.removeAttribute('target')")  # keep the flow in one tab
          element.click()
          with contextlib.suppress(PlaywrightTimeoutError):  # some clicks change the page without a load event
              page.wait_for_load_state("load", timeout=8000)
          page.wait_for_timeout(1200)
      page.evaluate("document.querySelectorAll('.dm-badge').forEach(e => e.remove())")


  def run(args: argparse.Namespace, client: httpx.Client, page: Page, out: Path) -> dict[str, Any]:
      """The loop: number, screenshot, decide, log, act. Returns the run summary."""
      last_action, last_dismissed, stop_reason = "none, this is the first page", None, None
      page.goto(args.start_url, wait_until="load", timeout=45000)
      page.wait_for_timeout(1500)
      with (out / "run.jsonl").open("w", encoding="utf-8") as log:
          for step in range(1, args.max_steps + 1):
              found = page.evaluate(PAGE_SCRIPT, "number")
              if not found["legend"]:  # nothing to click yet: give a slow page two more seconds, then stop rather than send an empty choice
                  page.wait_for_timeout(2000)
                  found = page.evaluate(PAGE_SCRIPT, "number")
              if not found["legend"]:
                  print(f"step {step}: No clickable elements on the page. Stopping.")
                  stop_reason = "no_candidates"
                  break
              legend, can_scroll = found["legend"], found["canScroll"]
              png = page.screenshot(type="png")
              (out / f"step-{step:02d}-input.png").write_bytes(png)

              resp, ms, req_id = decide(client, args.goal, png, len(legend), last_action, step)
              answers = resp["answers"]
              labels = {str(x["n"]): x["label"] for x in legend}  # stays local; the model never sees it
              action = choose(answers, can_scroll, labels, last_dismissed)
              top = sorted(answers["next_action"]["probabilities"].items(), key=lambda kv: -kv[1])[:3]
              print(f"step {step}: {action.detail}  [{ms:.0f} ms, {resp['usage']['input_tokens']} tokens, {req_id}]")
              print("   top candidates: " + ", ".join(f"{k} '{labels.get(k, '')}' {v:.1%}" for k, v in top))
              record = {
                  "step": step,
                  "url": page.url,
                  "request_id": req_id,
                  "latency_ms": round(ms),
                  "model": resp.get("model"),
                  "usage": resp["usage"],
                  "legend": legend,
                  "answers": answers,
                  "action": asdict(action),
              }
              log.write(json.dumps(record) + "\n")
              log.flush()

              act(page, action, args.pause, out, step)
              if action.kind == "stop":
                  stop_reason = action.stop_reason
                  break
              if action.kind == "dismiss":
                  last_dismissed = labels.get(action.badge or "")
              last_action = "scrolled down" if action.kind == "scroll" else f"clicked element {action.badge}"
      return {"goal": args.goal, "steps": step, "stop_reason": stop_reason or "max_steps", "final_url": page.url}


  def _step_count(value: str) -> int:
      """argparse type for --max-steps: a whole number from 1 to 100."""
      n = int(value)
      if not 1 <= n <= 100:
          raise argparse.ArgumentTypeError("must be 1 to 100")
      return n


  def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
      parser = argparse.ArgumentParser(description="Drive a browser toward a goal with the Decisions API.")
      parser.add_argument("--start-url", default="https://docs.perplexity.ai/docs/getting-started/overview")
      parser.add_argument("--goal", default="Open the Decisions API quickstart and find the section about images in state.")
      parser.add_argument("--max-steps", type=_step_count, default=10, metavar="N", help="give up after N steps (1 to 100)")
      parser.add_argument("--headed", action="store_true", help="show the browser window")
      parser.add_argument("--pause", type=float, default=1.5, help="seconds to hold each decision on screen")
      parser.add_argument("--out", type=Path, default=Path("out"), help="folder for screenshots, run.jsonl, and summary.json")
      return parser.parse_args(argv)


  def main(argv: list[str] | None = None) -> int:
      """Entry point. Returns the exit code: 0 when the loop ended on its own (any stop reason, including max_steps),
      1 on an API, network, or browser error, 2 on bad setup. On an error, out/ keeps the screenshots and run.jsonl
      written so far, but no summary.json."""
      args = parse_args(argv)
      api_key = os.environ.get("PERPLEXITY_API_KEY")
      if not api_key:
          print("Set PERPLEXITY_API_KEY", file=sys.stderr)
          return 2
      args.out.mkdir(parents=True, exist_ok=True)
      (args.out / "summary.json").unlink(missing_ok=True)  # never leave an old success summary next to a new run's files
      try:
          with make_client(api_key) as client, sync_playwright() as playwright:
              browser = playwright.chromium.launch(headless=not args.headed)
              try:
                  page = browser.new_page(viewport=VIEWPORT, locale="en-US")
                  summary = run(args, client, page, args.out)
              finally:
                  browser.close()
      except PlaywrightError as exc:  # PlaywrightTimeoutError is a PlaywrightError; drop Playwright's multi-line call log
          print(str(exc).splitlines()[0], file=sys.stderr)
          return 1
      except (DecisionsError, httpx.HTTPError) as exc:
          print(exc, file=sys.stderr)
          return 1
      (args.out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
      print(json.dumps(summary, indent=2))
      return 0


  if __name__ == "__main__":
      raise SystemExit(main())
  ```
</Accordion>

<Accordion title="test_browser_agent.py">
  ```python test_browser_agent.py theme={null}
  """Offline tests for the policy and the request. No API key, network, or browser needed."""

  from __future__ import annotations

  import json
  from typing import Any

  import httpx

  import browser_agent as ba
  import decisions_client as dc


  def answers(
      goal: float = 0.05,
      blocked: float = 0.1,
      visible: float = 0.9,
      p_top: float = 0.9,
      p_dismiss: float = 0.5,
      risk3: float = 0.02,
  ) -> dict[str, Any]:
      """One fake set of answers in the shape the Decisions API returns. Badge 7 is the top click; badge 2 closes the banner."""
      probs = {**{str(n): 0.001 for n in range(1, 11)}, "7": p_top}
      dprobs = {**{str(n): 0.001 for n in range(1, 11)}, "2": p_dismiss}
      return {
          "goal_reached": {"type": "noul", "noul": goal},
          "blocked": {"type": "noul", "noul": blocked},
          "target_visible": {"type": "noul", "noul": visible},
          "next_action": {"type": "choice", "choice": "7", "probabilities": probs},
          "dismiss": {"type": "choice", "choice": "2", "probabilities": dprobs},
          "risk": {"type": "score", "score": 0.2, "probabilities": {"0": 1 - risk3 - 0.02, "1": 0.01, "2": 0.01, "3": risk3}},
      }


  LABELS = {str(n): f"element {n}" for n in range(1, 11)}


  # --- choose(): one test per policy rule, in policy order ------------------------------------
  def test_goal_reached_stops_before_anything_else() -> None:
      action = ba.choose(answers(goal=0.9, blocked=0.95, p_dismiss=0.9, risk3=0.9), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "goal_reached")


  def test_payment_risk_stops_before_any_click() -> None:
      action = ba.choose(answers(blocked=0.95, p_dismiss=0.95, risk3=0.85), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "risk_review")


  def test_dismisses_a_banner_once() -> None:
      assert ba.choose(answers(blocked=0.9, p_dismiss=0.8), True, LABELS, None).kind == "dismiss"
      assert ba.choose(answers(blocked=0.9, p_dismiss=0.8), True, LABELS, "element 2").kind == "click"


  def test_scrolls_when_target_not_visible() -> None:
      assert ba.choose(answers(visible=0.2), True, LABELS, None).kind == "scroll"


  def test_clicks_confident_candidate() -> None:
      action = ba.choose(answers(), True, LABELS, None)
      assert (action.kind, action.badge) == ("click", "7")


  def test_stops_rather_than_guessing() -> None:
      action = ba.choose(answers(p_top=0.45), True, LABELS, None)
      assert (action.kind, action.stop_reason) == ("stop", "low_confidence")


  # --- decide(): the request, against a fake server -------------------------------------------
  OK = {"model": dc.MODEL, "answers": answers(), "usage": {"input_tokens": 7000}}


  def fake_client(responses: list[httpx.Response], calls: list[dict[str, Any]]) -> httpx.Client:
      """An httpx.Client that answers with the given responses in order and records each request body in calls."""

      def handler(request: httpx.Request) -> httpx.Response:
          calls.append(json.loads(request.content))
          return responses[len(calls) - 1]

      return httpx.Client(transport=httpx.MockTransport(handler))


  def test_decide_sends_the_model_screenshot_and_questions() -> None:
      calls: list[dict[str, Any]] = []
      with fake_client([httpx.Response(200, json=OK, headers={"x-request-id": "rid-1"})], calls) as client:
          resp, _, rid = dc.decide(client, "find pricing", b"png-bytes", 10, "none", 1)
      assert (resp, rid) == (OK, "rid-1")
      assert calls[0]["model"] == dc.MODEL
      assert calls[0]["state"][2]["image_url"]["url"].startswith("data:image/png;base64,")
      assert list(calls[0]["questions"]) == ["blocked", "dismiss", "target_visible", "next_action", "goal_reached", "risk"]


  def test_decide_retries_a_429() -> None:
      calls: list[dict[str, Any]] = []
      responses = [httpx.Response(429, json={"error": "slow down"}, headers={"retry-after": "0"}), httpx.Response(200, json=OK)]
      with fake_client(responses, calls) as client:
          resp, _, _ = dc.decide(client, "g", b"png", 3, "none", 1)
      assert (resp, len(calls)) == (OK, 2)
  ```
</Accordion>
