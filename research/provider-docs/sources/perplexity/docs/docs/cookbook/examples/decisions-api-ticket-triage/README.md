> ## Documentation Index
> Fetch the complete documentation index at: https://docs.perplexity.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Triage Support Tickets with the Decisions API

> Route inbound support tickets with three probabilistic questions per ticket from the Decisions API, then send only the escalations to the Agent API.

Ask a chat model "is this ticket urgent?" and you get a paragraph. Somewhere in it is a "yes", a "probably", or a "this may warrant attention". Now write the `if` statement that reads that paragraph. You can't. So you ask for JSON instead, parse it, retry when the JSON is malformed, and still have no idea how sure the model was. And you paid a frontier model to read every ticket, including the spam and the password resets, to get there.

Triage is a pile of small decisions, and each one needs a number you can put a threshold on. That is what the Decisions API returns. You send one piece of content and a set of named questions. You get back a probability for every yes/no question, a probability for every option of every choice question, and a probability for every level of every score question. No prose to parse. Thresholds become one-line comparisons, and tuning them means changing a constant, not rewriting a prompt.

A decision model is a class of model built to make fast, structured decisions that software can use directly. It reads text and images like a multimodal language model, but instead of writing text it returns typed answers with probabilities: yes or no, one of your options, or a level on your rubric. It does not write replies or explain its reasoning; your code does that part. The Decisions API is how you call one, and `pplx-decider-latest` selects the newest decision model. This recipe sends text only; the same request accepts images in `state` when your tickets carry screenshots.

This recipe triages twelve inbound support tickets for a fictional SaaS product. Each ticket gets one Decisions API request that answers three questions at once: does a person need to act, what is the customer asking for, and how severe is the impact. A small routing function turns those numbers into `escalate`, `review`, `queue`, `auto_reply`, or `close`. Only the escalated tickets go on to the investigation step, an Agent API request that drafts an investigation plan. In the run below, 3 of 12 tickets reached it. The other 9 never touched a frontier model.

## What you need

* Python 3.10 or newer on macOS or Linux. The shell commands use Unix syntax.
* A Perplexity API key. Every key can call the Decisions API; there is no separate signup. The same key runs the optional Agent API step.

The Decisions API is one JSON endpoint, `POST https://api.perplexity.ai/v1/decisions`, so the script calls it with `httpx`, a plain HTTP client. The Perplexity Python library is used only for the Agent API step. One key, two APIs.

## Set up

Everything lives in one directory. You create the first three files from this page; the script writes the fourth on every successful run.

```text theme={null}
decisions-api-ticket-triage/
├── requirements.txt       # two pinned dependencies
├── tickets.jsonl          # twelve sample tickets, one JSON object per line
├── triage_tickets.py      # classify, route, and escalate
├── triage_results.jsonl   # written by the script on each successful run
└── .venv/                 # virtual environment from the install step
```

Everything you need is on this page. Start with the dependencies, pinned to the versions this recipe was tested with.

<Accordion title="requirements.txt">
  ```text requirements.txt theme={null}
  httpx==0.28.1
  perplexityai==0.43.3
  ```
</Accordion>

Create the directory and save `requirements.txt` in it. Then create a virtual environment, install the two packages, and export your key.

<Accordion title="Install and set the key">
  ```bash theme={null}
  mkdir decisions-api-ticket-triage && cd decisions-api-ticket-triage
  # save requirements.txt here, then continue
  python3 -m venv .venv
  source .venv/bin/activate
  python -m pip install -r requirements.txt
  export PERPLEXITY_API_KEY="your-api-key-here"
  ```
</Accordion>

## The tickets

Twelve tickets, one JSON object per line. They cover an outage, a leaked credential, accidental data loss, a partial SSO failure, two billing requests, a how-to question, a feature request, a password reset, a rate-limit question, an angry repeat complaint, and one piece of spam. Save the file as `tickets.jsonl`.

Each line is sent whole as the request's `state`. `state` accepts a string, an object, or an array, so you do not flatten the ticket into a prompt. The model sees `plan`, `subject`, and `body` as labeled fields. In production, put the full thread, prior tickets from the same account, and any account metadata in the same object. See the [Decisions API docs](/docs/decisions/quickstart#request-limits) for limits.

<Accordion title="tickets.jsonl">
  ```json tickets.jsonl theme={null}
  {"id": "T-1001", "plan": "enterprise", "subject": "Dashboards down for whole org", "body": "Since 08:40 UTC every dashboard returns 502. 140 users affected, we have a board meeting at 10."}
  {"id": "T-1002", "plan": "pro", "subject": "Charged twice this month", "body": "My card shows two $49 charges on the 3rd. I only have one workspace. Please refund one."}
  {"id": "T-1003", "plan": "free", "subject": "How do I export a chart as PNG?", "body": "I can see the share button but not export. Is PNG export on the free plan?"}
  {"id": "T-1004", "plan": "pro", "subject": "Feature request: dark mode for embeds", "body": "Embedded charts are always light. Dark mode would match our site. Not urgent, just a wish."}
  {"id": "T-1005", "plan": "free", "subject": "Boost your SEO ranking today!!!", "body": "We offer guaranteed first page results. Reply for a free audit of lumen-analytics.com."}
  {"id": "T-1006", "plan": "enterprise", "subject": "API key committed to public repo", "body": "A contractor pushed our production API key to a public GitHub repo an hour ago. How do we rotate it and see what it accessed?"}
  {"id": "T-1007", "plan": "pro", "subject": "Deleted workspace by accident", "body": "I deleted the 'Q3 Board' workspace instead of a test one. Three months of saved reports are gone. Can you restore it?"}
  {"id": "T-1008", "plan": "free", "subject": "Reset password link expired", "body": "The reset email arrived 2 hours late and the link says expired. Can you send a new one?"}
  {"id": "T-1009", "plan": "pro", "subject": "Getting 429s from the ingest API", "body": "Our nightly job started hitting 429 Too Many Requests around 2am. Nothing changed on our side. Is there a new rate limit, or is something wrong?"}
  {"id": "T-1010", "plan": "pro", "subject": "This is the third time I'm writing", "body": "Nobody answered my last two tickets about the CSV import mangling dates. I'm about to cancel. Fix it or tell me you won't."}
  {"id": "T-1011", "plan": "enterprise", "subject": "SSO login loops back to sign-in page", "body": "Okta users get bounced back to the login page after authenticating. Started after your release notes mentioned an auth change. About 30 of 200 users affected so far."}
  {"id": "T-1012", "plan": "free", "subject": "Cancel and refund", "body": "I upgraded by mistake yesterday and haven't used any Pro features. Please cancel and refund the $49."}
  ```
</Accordion>

## The script, stage by stage

The rest of this page walks through `triage_tickets.py` one piece at a time. Every block below is an exact excerpt of the full file, which is at the end of the page.

### Imports and constants

The script needs `httpx` for the Decisions API and the Perplexity Python library for the Agent API. The endpoint and the model live in one place. `pplx-decider-latest` selects the newest decision model, so the recipe moves to new versions without a code change.

The thresholds are the whole routing policy. Tune them against your own labeled tickets and nothing else in the file changes.

<Accordion title="Imports and constants">
  ```python theme={null}
  """Triage inbound support tickets with the Decisions API.

  One Decisions API request per ticket answers three questions with probabilities
  (needs a human? which intent? how severe?). Threshold rules turn those numbers
  into a route. Only tickets routed to `escalate` go on to the investigation
  step: an Agent API request that drafts an investigation plan.
  """

  from __future__ import annotations

  import argparse
  import json
  import os
  import sys
  from dataclasses import asdict, dataclass
  from typing import Any

  import httpx
  from perplexity import Perplexity, PerplexityError

  # The Decisions API endpoint and model.
  DECISIONS_URL = "https://api.perplexity.ai/v1/decisions"
  DECISIONS_MODEL = "pplx-decider-latest"
  AGENT_API_PRESET = "low"  # the investigation step; only escalated tickets reach it

  # Thresholds. Tune these against your own labeled tickets; nothing else changes.
  ESCALATE_P_CRITICAL = 0.35  # a one-in-three shot at the top level is an incident
  ESCALATE_MIN_SCORE = 2.5  # halfway to "outage" is too hot for a queue
  REVIEW_MIN_INTENT_CONFIDENCE = 0.60  # below this the runner-up intent is too close
  CLOSE_SPAM_MAX_SEVERITY = 0.5  # real spam sits at level 0; anything higher gets a look
  # T-1004 settles at 0.29 to 0.32; keep this cutoff clear of that cluster.
  AUTO_REPLY_MAX_HUMAN = 0.35
  AUTO_REPLY_MAX_SEVERITY = 1.5  # never auto-reply to a possible level 2 (blocks work)
  AUTO_REPLY_INTENTS = {"how_to", "account_access", "feature_request"}  # self-service
  ```
</Accordion>

### Three questions, one request

The three questions cover the three question types, written as the JSON the API takes. A `noul` is a yes/no question and returns one probability. A `choice` returns a probability for every option plus the top option and a confidence. A `score` takes an ordered rubric, where the position in the list is the level, and returns the expected level, a probability for every level, and a confidence. The names you give the questions (`needs_human`, `intent`, `severity`) are the keys you read the answers from.

`confidence` is the API's own certainty estimate for the pick. It is not `max(probabilities)`, and the two can differ by a lot: on T-1007 below the top option had 0.58 of the mass while confidence came back at 0.51. Confidence drops when the runner-up is close or when no option fits the content well. The expected level a `score` question returns is the probability-weighted average of the levels, so a ticket split evenly between level 2 and level 3 scores about 2.5. That is why the script also reads the probability on the top level separately: an average can look calm while the tail is not.

Write criteria the way you would brief a new support hire. The option descriptions in `intent` and the level descriptions in `severity` do most of the work. Vague criteria give you flat probabilities.

<Accordion title="The three questions">
  ```python theme={null}
  QUESTIONS: dict[str, dict[str, Any]] = {
      "needs_human": {
          "type": "noul",
          "instructions": (
              "Does a person need to act on this ticket before an automated reply "
              "would be acceptable?"
          ),
          "criteria": {
              "true": (
                  "Refunds, account recovery, security incidents, outages, complaints, "
                  "or anything a canned answer cannot resolve."
              ),
              "false": "A documentation link or a self-service flow fully resolves it.",
          },
      },
      "intent": {
          "type": "choice",
          "instructions": "What is the customer asking for?",
          "criteria": {
              "outage_or_bug": "Something that used to work is broken or unavailable.",
              "billing": "Charges, refunds, invoices, plan changes.",
              "account_access": "Login, password, SSO, or permissions for an account.",
              "security": "Leaked credentials, suspicious access, or a data exposure.",
              "how_to": "A usage question a docs page could answer.",
              "feature_request": "Asking for something the product does not do.",
              "spam": "Unsolicited marketing or irrelevant to the product.",
          },
      },
      "severity": {
          "type": "score",
          "instructions": "How severe is the customer impact right now?",
          "criteria": [
              "No impact. A question, wish, or spam.",
              "Minor. Cosmetic or a workaround exists.",
              "Blocks a core workflow for this customer.",
              "Outage for many users, data loss, or security exposure.",
          ],
      },
  }
  ```
</Accordion>

### Loading tickets and recording decisions

`DecisionsError` is the error the script raises when the Decisions API answers with anything but `200`. `load_tickets` reads one JSON object per line. `Decision` is what the script records for each ticket: the route, a one-line reason, every probability the route used, and the request id from the `x-request-id` response header. You will want all of it later when you tune thresholds or ask why a ticket went where it did, and the request id is what support asks for.

<Accordion title="DecisionsError, load_tickets, and Decision">
  ```python theme={null}
  class DecisionsError(Exception):
      """A Decisions API request that did not return an answer."""


  def load_tickets(path: str) -> list[dict[str, str]]:
      """Read one JSON object per line: an `id`, a `subject`, and any fields you like.

      The whole object is sent as `state`, so the model sees every field you include.
      """
      with open(path, encoding="utf-8") as handle:
          return [json.loads(line) for line in handle if line.strip()]


  @dataclass
  class Decision:
      ticket_id: str
      route: str
      reason: str
      needs_human: float
      intent: str
      intent_confidence: float
      severity: float
      p_critical: float
      request_id: str  # the x-request-id header; quote it in support requests
  ```
</Accordion>

### From probabilities to a route

`route` is a pure function of five numbers and a label, taken as keyword arguments so a call site cannot silently swap two floats. Order matters. Danger first: if the probability mass on the top severity level is at or above `ESCALATE_P_CRITICAL`, or the expected severity clears `ESCALATE_MIN_SCORE`, the ticket escalates no matter what else the model said. Uncertainty second: if the model is not confident about the intent, a person decides what the ticket is. Only then do the automated exits run, and each one requires a confident, low-risk signal.

Escalation checks the tail, not just the average. A ticket with severity probabilities `{1: 0.5, 3: 0.5}` has an expected score of 2.0, which looks moderate. It also has a coin-flip chance of being an outage. `p_critical` catches that; the expected score alone does not.

<Accordion title="route()">
  ```python theme={null}
  def route(
      *,
      needs_human: float,
      intent: str,
      intent_confidence: float,
      severity: float,
      p_critical: float,
  ) -> tuple[str, str]:
      """Turn probabilities into a route: danger, then uncertainty, then automation."""
      if p_critical >= ESCALATE_P_CRITICAL or severity >= ESCALATE_MIN_SCORE:
          return "escalate", f"P(crit)={p_critical:.2f}, expected severity {severity:.2f}"
      if intent_confidence < REVIEW_MIN_INTENT_CONFIDENCE:
          return "review", f"intent unclear (confidence {intent_confidence:.2f})"
      if intent == "spam" and severity < CLOSE_SPAM_MAX_SEVERITY:
          return "close", f"spam, severity {severity:.2f}"
      if (
          needs_human <= AUTO_REPLY_MAX_HUMAN
          and severity < AUTO_REPLY_MAX_SEVERITY
          and intent in AUTO_REPLY_INTENTS
      ):
          return "auto_reply", f"{intent}, needs_human {needs_human:.2f}"
      return "queue", f"{intent}, needs_human {needs_human:.2f}, severity {severity:.2f}"
  ```
</Accordion>

### One request per ticket

`classify` posts one request per ticket: the model, the ticket as `state`, and all three questions. Anything but `200` raises `DecisionsError` with the status, the error body, and the request id, so a failure tells you what to fix and what to quote.

The response has one entry per question under `answers`, keyed by the name you gave it. `answers["needs_human"]["noul"]` is the yes probability. `answers["intent"]` has `choice`, `confidence`, and `probabilities`. `answers["severity"]` has `score`, `confidence`, `legend`, and `probabilities`. The level keys in `legend` and `probabilities` are strings (`"0"` to `"3"`), because JSON object keys always are, so the script builds the top level's key from the length of the rubric and reads the mass on it.

<Accordion title="classify()">
  ```python theme={null}
  def classify(client: httpx.Client, ticket: dict[str, str]) -> Decision:
      """One request per ticket. All three questions share the ticket as `state`."""
      response = client.post(
          DECISIONS_URL,
          json={"model": DECISIONS_MODEL, "state": ticket, "questions": QUESTIONS},
      )
      request_id = response.headers.get("x-request-id", "none")
      if response.status_code != 200:
          detail = response.text.strip()  # the JSON error body
          status = response.status_code
          raise DecisionsError(f"{status} {detail} (x-request-id {request_id})")
      body = response.json()
      needs_human = body["answers"]["needs_human"]["noul"]
      intent = body["answers"]["intent"]
      severity = body["answers"]["severity"]
      top_level = str(len(QUESTIONS["severity"]["criteria"]) - 1)  # keys are strings
      p_critical = severity["probabilities"].get(top_level, 0.0)
      chosen, reason = route(
          needs_human=needs_human,
          intent=intent["choice"],
          intent_confidence=intent["confidence"],
          severity=severity["score"],
          p_critical=p_critical,
      )
      return Decision(
          ticket_id=ticket["id"],
          route=chosen,
          reason=reason,
          needs_human=needs_human,
          intent=intent["choice"],
          intent_confidence=intent["confidence"],
          severity=severity["score"],
          p_critical=p_critical,
          request_id=request_id,
      )
  ```
</Accordion>

### The investigation step

Only escalated tickets reach `draft_escalation`. It uses the Perplexity Python library to make one Agent API request with the `low` preset and asks for a short investigation plan: what to check first, what to tell the customer, who to page. This is the call you would not want to make for all twelve tickets, and the triage step is what keeps it to three. The plan text changes from run to run and may carry citation markers such as `[web:1]` where the Agent API used a web source.

<Accordion title="draft_escalation()">
  ```python theme={null}
  def draft_escalation(
      agent: Perplexity, ticket: dict[str, str], decision: Decision
  ) -> str:
      """The investigation step: one Agent API request, only for escalated tickets."""
      prompt = (
          "You are the on-call support engineer for Lumen Analytics, a SaaS dashboard "
          "product. Write a short investigation plan for this escalated ticket: what to "
          "check first, what to tell the customer in the first reply, and who to page. "
          "Plain text, under 150 words.\n\n"
          f"Ticket: {json.dumps(ticket)}\n"
          f"Triage: intent={decision.intent}, expected severity={decision.severity:.2f}, "
          f"P(crit)={decision.p_critical:.2f}"
      )
      response = agent.responses.create(preset=AGENT_API_PRESET, input=prompt)
      return response.output_text.strip() or "(no text in Agent API response)"
  ```
</Accordion>

### The run loop

`main` reads the key from `PERPLEXITY_API_KEY`, opens one `httpx.Client` that sends the key as a bearer token on every request, and classifies every ticket in order. The client timeout is 30 seconds, far more than a ticket needs, so only a real problem trips it. It catches `DecisionsError` and `httpx.HTTPError`, the base class for timeouts and connection failures, so every failure prints the same one-line message and stops the run before any results are written. Then it prints a table and writes one JSON line per ticket. With `--draft-escalations` it builds one `Perplexity` client and sends the escalated tickets to the Agent API; a failure there prints a line to stderr and the loop continues, because the triage results are already on disk and worth keeping.

The API allows 10 requests per second per organization. More than 10 requests in the same second get `429` with a `Retry-After` header. This loop is sequential, so it never gets close.

<Accordion title="main()">
  ```python theme={null}
  def main() -> int:
      parser = argparse.ArgumentParser(description=__doc__)
      parser.add_argument(
          "--draft-escalations",
          action="store_true",
          help="send escalations to the Agent API",
      )
      parser.add_argument("--tickets", default="tickets.jsonl", help="input file")
      parser.add_argument("--out", default="triage_results.jsonl", help="output file")
      args = parser.parse_args()

      api_key = os.environ.get("PERPLEXITY_API_KEY")
      if not api_key:
          print("Set PERPLEXITY_API_KEY first.", file=sys.stderr)
          return 2

      tickets = load_tickets(args.tickets)
      if not tickets:
          print(f"No tickets found in {args.tickets}.")
          return 0

      decisions: list[Decision] = []
      with httpx.Client(
          headers={"Authorization": f"Bearer {api_key}"}, timeout=30.0
      ) as client:
          for ticket in tickets:
              try:
                  decisions.append(classify(client, ticket))
              except (DecisionsError, httpx.HTTPError) as error:
                  print(f"{ticket['id']}: Decisions API failed: {error}", file=sys.stderr)
                  return 1

      header = (
          f"{'ticket':<7} {'route':<10} {'human':>5} {'intent':<16} "
          f"{'conf':>4} {'sev':>4} {'P(crit)':>7}  reason"
      )
      print(header)
      print("-" * len(header))
      for d in decisions:
          print(
              f"{d.ticket_id:<7} {d.route:<10} {d.needs_human:>5.2f} {d.intent:<16} "
              f"{d.intent_confidence:>4.2f} {d.severity:>4.2f} {d.p_critical:>7.2f}  "
              f"{d.reason}"
          )

      with open(args.out, "w", encoding="utf-8") as handle:
          for d in decisions:
              handle.write(json.dumps(asdict(d)) + "\n")
      escalated = [d for d in decisions if d.route == "escalate"]
      print(f"\n{len(escalated)} of {len(decisions)} escalated. Results: {args.out}")

      if not args.draft_escalations:
          print("Add --draft-escalations to send the escalated tickets to the Agent API.")
          return 0
      agent = Perplexity(api_key=api_key)
      by_id = {t["id"]: t for t in tickets}
      for d in escalated:
          print(f"\n=== {d.ticket_id}: {by_id[d.ticket_id]['subject']} ===")
          try:
              print(draft_escalation(agent, by_id[d.ticket_id], d))
          except PerplexityError as error:  # the library's base class
              print(f"{d.ticket_id}: Agent API request failed: {error}", file=sys.stderr)
      return 0


  if __name__ == "__main__":
      sys.exit(main())
  ```
</Accordion>

### The full file

Save this as `triage_tickets.py`. It is the seven excerpts above in order, nothing else.

<Accordion title="Full code - triage_tickets.py">
  ```python triage_tickets.py theme={null}
  """Triage inbound support tickets with the Decisions API.

  One Decisions API request per ticket answers three questions with probabilities
  (needs a human? which intent? how severe?). Threshold rules turn those numbers
  into a route. Only tickets routed to `escalate` go on to the investigation
  step: an Agent API request that drafts an investigation plan.
  """

  from __future__ import annotations

  import argparse
  import json
  import os
  import sys
  from dataclasses import asdict, dataclass
  from typing import Any

  import httpx
  from perplexity import Perplexity, PerplexityError

  # The Decisions API endpoint and model.
  DECISIONS_URL = "https://api.perplexity.ai/v1/decisions"
  DECISIONS_MODEL = "pplx-decider-latest"
  AGENT_API_PRESET = "low"  # the investigation step; only escalated tickets reach it

  # Thresholds. Tune these against your own labeled tickets; nothing else changes.
  ESCALATE_P_CRITICAL = 0.35  # a one-in-three shot at the top level is an incident
  ESCALATE_MIN_SCORE = 2.5  # halfway to "outage" is too hot for a queue
  REVIEW_MIN_INTENT_CONFIDENCE = 0.60  # below this the runner-up intent is too close
  CLOSE_SPAM_MAX_SEVERITY = 0.5  # real spam sits at level 0; anything higher gets a look
  # T-1004 settles at 0.29 to 0.32; keep this cutoff clear of that cluster.
  AUTO_REPLY_MAX_HUMAN = 0.35
  AUTO_REPLY_MAX_SEVERITY = 1.5  # never auto-reply to a possible level 2 (blocks work)
  AUTO_REPLY_INTENTS = {"how_to", "account_access", "feature_request"}  # self-service


  QUESTIONS: dict[str, dict[str, Any]] = {
      "needs_human": {
          "type": "noul",
          "instructions": (
              "Does a person need to act on this ticket before an automated reply "
              "would be acceptable?"
          ),
          "criteria": {
              "true": (
                  "Refunds, account recovery, security incidents, outages, complaints, "
                  "or anything a canned answer cannot resolve."
              ),
              "false": "A documentation link or a self-service flow fully resolves it.",
          },
      },
      "intent": {
          "type": "choice",
          "instructions": "What is the customer asking for?",
          "criteria": {
              "outage_or_bug": "Something that used to work is broken or unavailable.",
              "billing": "Charges, refunds, invoices, plan changes.",
              "account_access": "Login, password, SSO, or permissions for an account.",
              "security": "Leaked credentials, suspicious access, or a data exposure.",
              "how_to": "A usage question a docs page could answer.",
              "feature_request": "Asking for something the product does not do.",
              "spam": "Unsolicited marketing or irrelevant to the product.",
          },
      },
      "severity": {
          "type": "score",
          "instructions": "How severe is the customer impact right now?",
          "criteria": [
              "No impact. A question, wish, or spam.",
              "Minor. Cosmetic or a workaround exists.",
              "Blocks a core workflow for this customer.",
              "Outage for many users, data loss, or security exposure.",
          ],
      },
  }


  class DecisionsError(Exception):
      """A Decisions API request that did not return an answer."""


  def load_tickets(path: str) -> list[dict[str, str]]:
      """Read one JSON object per line: an `id`, a `subject`, and any fields you like.

      The whole object is sent as `state`, so the model sees every field you include.
      """
      with open(path, encoding="utf-8") as handle:
          return [json.loads(line) for line in handle if line.strip()]


  @dataclass
  class Decision:
      ticket_id: str
      route: str
      reason: str
      needs_human: float
      intent: str
      intent_confidence: float
      severity: float
      p_critical: float
      request_id: str  # the x-request-id header; quote it in support requests


  def route(
      *,
      needs_human: float,
      intent: str,
      intent_confidence: float,
      severity: float,
      p_critical: float,
  ) -> tuple[str, str]:
      """Turn probabilities into a route: danger, then uncertainty, then automation."""
      if p_critical >= ESCALATE_P_CRITICAL or severity >= ESCALATE_MIN_SCORE:
          return "escalate", f"P(crit)={p_critical:.2f}, expected severity {severity:.2f}"
      if intent_confidence < REVIEW_MIN_INTENT_CONFIDENCE:
          return "review", f"intent unclear (confidence {intent_confidence:.2f})"
      if intent == "spam" and severity < CLOSE_SPAM_MAX_SEVERITY:
          return "close", f"spam, severity {severity:.2f}"
      if (
          needs_human <= AUTO_REPLY_MAX_HUMAN
          and severity < AUTO_REPLY_MAX_SEVERITY
          and intent in AUTO_REPLY_INTENTS
      ):
          return "auto_reply", f"{intent}, needs_human {needs_human:.2f}"
      return "queue", f"{intent}, needs_human {needs_human:.2f}, severity {severity:.2f}"


  def classify(client: httpx.Client, ticket: dict[str, str]) -> Decision:
      """One request per ticket. All three questions share the ticket as `state`."""
      response = client.post(
          DECISIONS_URL,
          json={"model": DECISIONS_MODEL, "state": ticket, "questions": QUESTIONS},
      )
      request_id = response.headers.get("x-request-id", "none")
      if response.status_code != 200:
          detail = response.text.strip()  # the JSON error body
          status = response.status_code
          raise DecisionsError(f"{status} {detail} (x-request-id {request_id})")
      body = response.json()
      needs_human = body["answers"]["needs_human"]["noul"]
      intent = body["answers"]["intent"]
      severity = body["answers"]["severity"]
      top_level = str(len(QUESTIONS["severity"]["criteria"]) - 1)  # keys are strings
      p_critical = severity["probabilities"].get(top_level, 0.0)
      chosen, reason = route(
          needs_human=needs_human,
          intent=intent["choice"],
          intent_confidence=intent["confidence"],
          severity=severity["score"],
          p_critical=p_critical,
      )
      return Decision(
          ticket_id=ticket["id"],
          route=chosen,
          reason=reason,
          needs_human=needs_human,
          intent=intent["choice"],
          intent_confidence=intent["confidence"],
          severity=severity["score"],
          p_critical=p_critical,
          request_id=request_id,
      )


  def draft_escalation(
      agent: Perplexity, ticket: dict[str, str], decision: Decision
  ) -> str:
      """The investigation step: one Agent API request, only for escalated tickets."""
      prompt = (
          "You are the on-call support engineer for Lumen Analytics, a SaaS dashboard "
          "product. Write a short investigation plan for this escalated ticket: what to "
          "check first, what to tell the customer in the first reply, and who to page. "
          "Plain text, under 150 words.\n\n"
          f"Ticket: {json.dumps(ticket)}\n"
          f"Triage: intent={decision.intent}, expected severity={decision.severity:.2f}, "
          f"P(crit)={decision.p_critical:.2f}"
      )
      response = agent.responses.create(preset=AGENT_API_PRESET, input=prompt)
      return response.output_text.strip() or "(no text in Agent API response)"


  def main() -> int:
      parser = argparse.ArgumentParser(description=__doc__)
      parser.add_argument(
          "--draft-escalations",
          action="store_true",
          help="send escalations to the Agent API",
      )
      parser.add_argument("--tickets", default="tickets.jsonl", help="input file")
      parser.add_argument("--out", default="triage_results.jsonl", help="output file")
      args = parser.parse_args()

      api_key = os.environ.get("PERPLEXITY_API_KEY")
      if not api_key:
          print("Set PERPLEXITY_API_KEY first.", file=sys.stderr)
          return 2

      tickets = load_tickets(args.tickets)
      if not tickets:
          print(f"No tickets found in {args.tickets}.")
          return 0

      decisions: list[Decision] = []
      with httpx.Client(
          headers={"Authorization": f"Bearer {api_key}"}, timeout=30.0
      ) as client:
          for ticket in tickets:
              try:
                  decisions.append(classify(client, ticket))
              except (DecisionsError, httpx.HTTPError) as error:
                  print(f"{ticket['id']}: Decisions API failed: {error}", file=sys.stderr)
                  return 1

      header = (
          f"{'ticket':<7} {'route':<10} {'human':>5} {'intent':<16} "
          f"{'conf':>4} {'sev':>4} {'P(crit)':>7}  reason"
      )
      print(header)
      print("-" * len(header))
      for d in decisions:
          print(
              f"{d.ticket_id:<7} {d.route:<10} {d.needs_human:>5.2f} {d.intent:<16} "
              f"{d.intent_confidence:>4.2f} {d.severity:>4.2f} {d.p_critical:>7.2f}  "
              f"{d.reason}"
          )

      with open(args.out, "w", encoding="utf-8") as handle:
          for d in decisions:
              handle.write(json.dumps(asdict(d)) + "\n")
      escalated = [d for d in decisions if d.route == "escalate"]
      print(f"\n{len(escalated)} of {len(decisions)} escalated. Results: {args.out}")

      if not args.draft_escalations:
          print("Add --draft-escalations to send the escalated tickets to the Agent API.")
          return 0
      agent = Perplexity(api_key=api_key)
      by_id = {t["id"]: t for t in tickets}
      for d in escalated:
          print(f"\n=== {d.ticket_id}: {by_id[d.ticket_id]['subject']} ===")
          try:
              print(draft_escalation(agent, by_id[d.ticket_id], d))
          except PerplexityError as error:  # the library's base class
              print(f"{d.ticket_id}: Agent API request failed: {error}", file=sys.stderr)
      return 0


  if __name__ == "__main__":
      sys.exit(main())
  ```
</Accordion>

## Run it

From the directory with the three files, with the virtual environment active and the key exported:

<Accordion title="Run the triage">
  ```bash theme={null}
  python triage_tickets.py
  ```
</Accordion>

Output observed on 2026-09-30 at 19:53 UTC against the Decisions API. The escalation plan below is from a `--draft-escalations` run a few minutes earlier, which printed the same table.

<Accordion title="Observed output">
  ```text theme={null}
  ticket  route      human intent           conf  sev P(crit)  reason
  -------------------------------------------------------------------
  T-1001  escalate    1.00 outage_or_bug    0.99 2.97    0.97  P(crit)=0.97, expected severity 2.97
  T-1002  queue       0.99 billing          0.99 1.17    0.02  billing, needs_human 0.99, severity 1.17
  T-1003  auto_reply  0.08 how_to           0.97 0.42    0.00  how_to, needs_human 0.08
  T-1004  auto_reply  0.31 feature_request  0.99 0.27    0.00  feature_request, needs_human 0.31
  T-1005  close       0.42 spam             0.98 0.09    0.02  spam, severity 0.09
  T-1006  escalate    0.99 security         0.99 2.99    0.99  P(crit)=0.99, expected severity 2.99
  T-1007  escalate    0.96 outage_or_bug    0.51 2.84    0.85  P(crit)=0.85, expected severity 2.84
  T-1008  queue       0.81 account_access   0.99 1.76    0.01  account_access, needs_human 0.81, severity 1.76
  T-1009  queue       0.87 outage_or_bug    0.86 1.85    0.02  outage_or_bug, needs_human 0.87, severity 1.85
  T-1010  queue       0.98 outage_or_bug    0.97 2.00    0.04  outage_or_bug, needs_human 0.98, severity 2.00
  T-1011  review      0.96 account_access   0.55 2.19    0.24  intent unclear (confidence 0.55)
  T-1012  queue       0.98 billing          0.99 0.87    0.01  billing, needs_human 0.98, severity 0.87

  3 of 12 escalated. Results: triage_results.jsonl
  Add --draft-escalations to send the escalated tickets to the Agent API.
  ```
</Accordion>

The twelve classification requests take about 2.5 seconds in total. In our tests most requests took 150 to 250 ms for 590 to 659 input tokens per ticket. The first request of a process is slower because it opens the connection, and an occasional request took several seconds. Plan for hundreds of milliseconds per ticket, not tens, and measure your own.

Add `--draft-escalations` to run the Agent API step for the escalated tickets. That run took 17.2 seconds end to end, and 15.6 of those seconds were the three Agent API requests.

<Accordion title="Run with escalations">
  ```bash theme={null}
  python triage_tickets.py --draft-escalations
  ```
</Accordion>

<Accordion title="Observed escalation plan for T-1001">
  ```text theme={null}
  === T-1001: Dashboards down for whole org ===
  First: Treat this as a critical, org-wide outage. Check monitoring and status-page alerts, recent deploys, and API/gateway error rates around 08:40 UTC; verify whether dashboards fail across regions and capture request IDs and logs for the 502s.

  First reply: “We’ve escalated this as a critical incident and are investigating the dashboard 502s affecting your organization. We understand the 10:00 UTC board meeting is time-sensitive. We’ll share the next update within 15 minutes, even if we’re still investigating.”

  Page the incident commander and on-call dashboard/backend and SRE engineers immediately; notify the enterprise account owner/support lead.
  ```
</Accordion>

The `P(crit)` column is the probability on the top severity level, the one the escalation rule reads. `triage_results.jsonl` has one line per ticket with the route, the reason, every probability the route used at full precision, and the request id. Keep these files. They are your labeled dataset for tuning thresholds later.

## Reading the numbers

A few rows in that table show why probabilities beat free text for this job.

**T-1007, the deleted workspace.** Intent confidence was 0.51. The probabilities were spread across `outage_or_bug` (0.58), `feature_request` (0.20), and `how_to` (0.13), which is fair; none of the seven options describes "I deleted my own data". A confidence-first policy would have parked this in `review`. But `P(crit)` was 0.85: whatever this ticket is, it is probably data loss. Danger-first ordering sends it to `escalate`. In our run the Agent API draft told the on-call engineer to check the audit logs and whether the reports can be recovered from a soft-delete window or a backup, and to tell the customer not to recreate the workspace while recovery is investigated.

**T-1011, the SSO loop.** Intent confidence 0.55, with the mass split between `account_access` (0.61) and `outage_or_bug` (0.37). Expected severity 2.19 and `P(crit)` 0.24, under both escalation thresholds. This lands in `review`, which is right. Thirty of two hundred users cannot log in, and a person should decide in the next few minutes whether that is an incident. A free-text classifier would have picked one label and hidden the disagreement.

**T-1004, the dark mode request.** This is the one ticket in the set that taught us something about thresholds. Across five runs on 2026-09-29, `needs_human` came back at 0.29, 0.29, 0.31, 0.31, and 0.32. On 2026-09-30 it was 0.31 on every run. The first version of this script used an `AUTO_REPLY_MAX_HUMAN` of 0.30, so the same ticket flipped between `auto_reply` and `queue` with nothing about it changing. A cutoff that sits on top of where the model settles turns small run-to-run movement into a different decision. That is why the constant is 0.35: clear of the cluster, so T-1004 auto-replies on every run. Whether a feature request should auto-reply at all is a team choice. If you want a person to see them, drop `feature_request` from `AUTO_REPLY_INTENTS` rather than pulling the threshold down onto the cluster. Replay `triage_results.jsonl` to see what else a change moves.

**T-1005, the spam.** `needs_human` was 0.42, which looks odd for spam until you read the criteria: the model was asked whether "a canned answer" resolves it, and spam does not fit either description. The route does not use `needs_human` for spam; it closes on `intent == "spam"` with a severity under 0.5. Pick the signal that answers the question you are actually asking.

Identical requests usually return identical numbers, but not always. On 2026-09-30, 11 of 13 full runs printed the same table byte for byte. One of the other two moved T-1009 and T-1012 by at most 0.06, and the other put T-1011's intent confidence at 0.53 instead of 0.55. On 2026-09-29, `needs_human` on T-1004 ranged from 0.29 to 0.32. With the cutoffs clear of those ranges, every route held on every run. Set thresholds with margin, do not read the third decimal place, and check where your borderline tickets cluster before you trust a cutoff that sits on top of them.

## Adapt it

* **Your tickets.** Replace `tickets.jsonl` with an export from your help desk. Keep one JSON object per line with an `id` and a `subject`; other fields are up to you. Pass `--tickets path/to/file.jsonl`.
* **Your categories.** Edit the `criteria` in `QUESTIONS`. Describe every option; undescribed options are interpreted by name alone.
* **Your thresholds.** Label a few hundred tickets, run the script, and compare the routes against the labels. Adjust the constants. Escalation misses are expensive, so start with `ESCALATE_P_CRITICAL` low and raise it only when the on-call rota complains.
* **More context.** Put the conversation history, account tier, and open incidents in the `state` object. The questions do not change.
* **Throughput.** Write an async `classify` with `httpx.AsyncClient` and classify tickets concurrently. Stay under 10 requests per second per organization, and on `429` wait `Retry-After` seconds before you retry.

## Troubleshooting

Every Decisions API error prints as `<ticket>: Decisions API failed: <status> <error body> (x-request-id <id>)`. Read `error.message` in the body. A `504` returns an HTML page instead of JSON; retry it.

* `400` with `Invalid model` means `DECISIONS_MODEL` is not a model name the Decisions API accepts. Use `pplx-decider-latest`.
* `400` with any other message is a request problem, for example an empty question name, `state` set to `null`, a `null` `score` level, or more than 255 options. The message names it.
* `401` is a missing or invalid key. The Decisions API reads `Authorization: Bearer` only, which `httpx.Client` sends for you here.
* `429` means more than 10 requests landed in one second, or the requests were very large (a token limit also applies). A sequential loop like this one stays well under the request limit, so if you see it, something else in your organization is probably sharing the budget. Wait `Retry-After` seconds and rerun.
* A timeout or connection error prints the `httpx` error message. Check your network, or raise `timeout` on the client if you send much larger tickets.
* `triage_results.jsonl` is written only after every ticket is classified, so a failed run leaves the previous results in place.
