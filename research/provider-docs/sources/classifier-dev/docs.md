---
title: classifier.dev developers
description: Quickstart, every surface (REST, MCP, CLI, skill), limits, errors, versioning. No key needed.
canonical: https://classifier.dev/developers
last-updated: 2026-09-22
---

# classifier.dev developers

From reading this to a first classification, with no account, key or sign-up in between. The API is free within per-IP limits; production is the sandbox.

## Scrape and classify a URL

Send one public HTTP(S) URL instead of input, inputs or items. Any public website is supported; inaccessible, blocked or login-only pages may fail. Use a funded workspace key from https://classifier.dev/app/keys.

```bash
curl https://classifier.dev/v1/classify \
  -H "Authorization: Bearer $CLASSIFIER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: article-001" \
  -d '{
    "url": "https://example.com",
    "labels": ["documentation", "news"],
    "include": ["markdown", "html"]
  }'
```

Context.dev extracts the article once; Jev classifies the Markdown. Results, confidence, scores and usage keep the normal classification shape. article contains url and title. include opts into article.markdown and/or article.html; omit it for compact output. HTML is untrusted page content: sanitize it before rendering. labels, dimensions, instructions and multi work as with text. Model is Jev; long articles require tier fast.

Scraping costs $0.0022 per provider-billed request ($2.20/1,000), plus normal classification. Both formats use the same scrape, at no extra cost. pricing separates scrape_usd, classification_usd and total_usd. Credits are reserved before scraping; a typical URL request temporarily holds $0.0232 and releases the unused amount after settlement. The workspace must have paid credits or an active paid plan and enough balance for the whole hold. Scraping counts toward the default $10 request limit.

A successful scrape remains billable if classification fails. Provider-billed errors (including processed 404s) and uncertain network failures retain the scrape charge; confirmed unbilled failures release it. Read pricing even on errors. No automatic scrape retries. Idempotency-Key rejects repeats with 409 before provider spend; use a new key only for intentional new work.

```
Limits: one URL per request, 8 MB extracted response, 250,000 article tokens,
and existing classification decision limits. No OCR or browser actions.
Article text is never silently truncated. Request source and article content
are not stored in the usage ledger. MCP accepts url and include on
classify_texts, classify_dimensions and classify_multi_label.
```

## Quickstart

```bash
curl https://classifier.dev/spam,not+spam/Win+a+free+iPhone
spam
```

```bash
curl https://classifier.dev -d '{
  "inputs": ["the checkout button does nothing", "love the dark mode"],
  "labels": ["bug", "praise", "feature"]
}'
```

One request, up to 1,000 texts, back in about a second, each with a label, a calibrated confidence and a score per label. Full reference: https://classifier.dev (the same document as `curl classifier.dev`).

Existing TypeSafe code can use the same official SDK and call shape. Change the API root and use a classifier.dev workspace key, or "unused" for the anonymous free tier. Caller credentials are never sent to TypeSafe:

```javascript
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
```

```javascript
const client = new TypeSafeClient({
  apiKey: process.env.CLASSIFIER_API_KEY ?? "unused",
  baseURL: "https://classifier.dev",
});
const result = await client.systemOne({
  state: "I was charged twice. Please fix this today.",
  questions: {
    category: choice("Which team?", { billing: null, technical: null }),
  },
});
```

## Coming soon

Private inference is being built on the same call shape:

```
Private inference      Zero-knowledge, end-to-end encrypted classification:
                       the input is unreadable in transit and unreadable to
                       the service that classifies it.
```

If this is on your roadmap, say so now and it gets built against your case.

```
Book a call   https://cal.com/michaelsf/coffee
Email         contact@classifier.dev
```

## Surfaces

```
REST API        POST https://classifier.dev  or  GET https://classifier.dev/{labels}/{text}
                Query form: GET https://classifier.dev/?labels={a,b}&text={text}
                Versioned alias: POST https://classifier.dev/v1/classify (same body, same answer)
TypeSafe SDK    Base URL https://classifier.dev; POST /v1/systemone and GET /v1/models
                JavaScript: @typesafe-ai/sdk   Python: typesafe-sdk
OpenAPI 3.1     https://classifier.dev/openapi.json
MCP             https://classifier.dev/mcp (tools) and https://classifier.dev/mcp/docs (documentation)
                Setup for Claude, ChatGPT, Codex, Cursor: https://classifier.dev/mcp-setup
CLI             npm i -g classifier-dev  ->  classify bug,feature,praise < feedback.txt
Python SDK      Install the tagged source below; from classifier_dev import classify
                https://github.com/mrmps/classifier-dev/tree/python-v0.1.0/sdk/python
Go SDK          go get github.com/mrmps/classifier-dev/sdk/go   https://pkg.go.dev/github.com/mrmps/classifier-dev/sdk/go
JavaScript      fetch() is the SDK; see EXAMPLES. Source for both SDKs: https://github.com/mrmps/classifier-dev/tree/main/sdk
Agent skill     npx skills add https://classifier.dev
Agent feedback  https://classifier.dev/.well-known/agent-feedback.json
llms.txt        https://classifier.dev/llms.txt
Discovery       /.well-known/ard.json, /.well-known/mcp/server-card.json,
                /.well-known/agent-card.json, /.well-known/api-catalog, /sitemap.xml
```

## Endpoints

```
Method  Path                      Purpose
-------------------------------------------------------------------------
POST    /v1/classify              Classify 1-1,000 texts. Body: {inputs, labels, tier?, instructions?, multi?, max_labels?}
POST    /                         Alias of /v1/classify, tracks the current major
POST    /v1/classify/batch        Alias, for callers that look for a batch endpoint by name
POST    /v1/systemone             TypeSafe System One wire-compatible endpoint
GET     /v1/models                TypeSafe model aliases in the official SDK response shape
GET     /{labels}/{text}          One text in the URL: /spam,not+spam/Win+a+free+iPhone -> "spam"
GET     /?labels=&text=           The same as query parameters: /?labels=spam,not+spam&text=Win+a+free+iPhone
GET     /v1/health                {ok, version, time}
GET     /api                      Machine-readable index of everything here (also GET /?mode=agent)
GET     /openapi.json             The OpenAPI 3.1 specification
POST    /mcp                      MCP, Streamable HTTP (tools); POST /mcp/docs for the docs server
POST    /api/v1/feedback          Structured report with optional evidence; returns a receipt
POST    /api/v1/observations      Lightweight category + summary signal; returns a receipt
GET     /api/v1/receipts/{id}     Poll whether an agent report landed
GET     /api/v1/policy            Feedback categories, evidence types and limits
```

Single-label response for POST: {"tier", "model", "results": [{"label", "confidence", "scores"}...], "usage"}

Results preserve input order. Confidence and scores may be null; check for null before numeric comparisons. Multi-label results instead have labels (an array), independent scores and model, with no singular label or confidence. Labels scoring at least 0.7 are returned. Repeated inference can vary; it is not an exact deterministic computation. Full field reference: https://classifier.dev (PARAMETERS).

## Long context

Default Jev and explicit model: "jev" automatically process inputs over 32,000 characters through chunking, parallel Jev evidence screening and a final Jev call. POST with a workspace key backed by paid balance or an active paid subscription; anonymous access and free signup credit do not qualify. Fast only. Synchronous limits: 250,000 original cl100k_base context tokens summed across inputs, 20 documents, 32 decisions and a 1 MB request body. Decisions count documents × dimensions, or documents × labels in multi-label mode. Existing dedicated enterprise/operator access remains supported. Each continuous whitespace or non-whitespace run is limited to 8,192 UTF-16 code units; longer runs return 400 long_context_input before tokenization or chunking.

Relevant and uncertain chunks, including opposing evidence and exceptions, are eligible for the final call. Whole chunks are packed in source order within 20,000 cl100k_base tokens and a conservative provider estimate. Eligible evidence may be omitted when full; usage.long_context reports selection counts, token usage, calls and timing. No eligible evidence returns 422 long_context_no_evidence without charge, also when no eligible chunk fits for a document. See LONG DOCUMENTS at https://classifier.dev for the full field reference and limitations. Explicit model: "chunklaya" remains a separate legacy opt-in.

A funded workspace can upload one whole document of up to 10,000,000 tokens (100 MB) in one POST /v1/classify request. Send JSON with input and labels, or text/plain with labels in the query. Large documents return 202 and a status_url. For the same flow with smaller inputs, send the header Prefer: respond-async. Splitting, screening and final judgment happen automatically. The original whole-document token count sets the hold and final charge at $0.084/M. Failures, cancellation and 24-hour expiry refund unfinished work. See TEN-MILLION-TOKEN JOBS in the full docs.

The repository CLI uploads and waits:

```
node cli/classify.js a,b --document document.txt --json
```

## Authentication

Classification works without a key within the public limits. Create a workspace at https://classifier.dev/auth/sign-up and manage workspace keys at https://classifier.dev/app/keys. Workspace keys use the classifier_agent_ prefix. Send Authorization: Bearer <key> on REST or MCP. Partner keys remain supported. https://classifier.dev/auth.md

The official TypeSafe SDK requires a non-empty apiKey when it constructs a client. Use "unused" for anonymous free access; classifier.dev ignores that value and applies the per-IP public limits. To attach requests to a workspace, pass a classifier_agent_ key from /app/keys as the SDK apiKey. The key is validated by classifier.dev, uses the workspace quota and credit balance, and makes billing headers available on the SDK response. Never put a real TypeSafe credential here: caller credentials are not forwarded to TypeSafe.

## Spending limits

Free inference allows up to $0.01 of provider cost per Fast request or $0.10 per Smart request, $0.50 per IP per UTC day, and $100 across everyone per UTC day. IPv6 addresses share a /64 allowance. At most four free requests run concurrently per IP. If Smart reviews reach the request ceiling, the fast answers remain and usage.escalation_failed counts missed reviews. Longer prompts or expensive batches need a funded workspace API key. Reservations include in-flight work, retries and fallback models. Anonymous proxy traffic requires a funded key. Unfunded workspace keys share the free limits. Funded work uses its workspace balance, outside the shared free budget, with a default $10 maximum request allowance. Synchronous request bodies are limited to 1 MB; whole-document jobs allow 100 MB (see TEN-MILLION-TOKEN JOBS). A supplied Idempotency-Key prevents re-execution: synchronous repeated keys receive 409, not a cached response; whole-document UUID keys return the same job. Free keys are scoped to the IP and UTC day; workspace keys are scoped to the account.

## Examples

curl:

```bash
curl https://classifier.dev/v1/classify -H 'content-type: application/json' \
  -d '{
    "inputs": ["the checkout button does nothing", "love the dark mode"],
    "labels": ["bug", "praise", "feature"]
  }'
```

JavaScript (Node 18+, Bun, browsers — CORS is open):

```javascript
const res = await fetch("https://classifier.dev/v1/classify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ inputs, labels: ["bug", "praise", "feature"] }),
});
const { results } = await res.json();   // results[i] = { label, confidence, scores }
```

Python SDK (standard library only; requires Git to install):

```bash
pip install "classifier-dev @ git+https://github.com/mrmps/classifier-dev.git@python-v0.1.0#subdirectory=sdk/python"
```

Python:

```python
from classifier_dev import classify
for r in classify(texts, ["bug", "praise", "feature"]):
    print(r.label, r.confidence)
```

Go (go get github.com/mrmps/classifier-dev/sdk/go):

```go
results, err := classifier.Classify(ctx, texts, []string{"bug", "praise", "feature"})
// results[i].Label, *results[i].Confidence
```

Multi-label, capped at two tags per text:

```bash
curl https://classifier.dev/v1/classify -d '{
  "inputs": ["postgres index tuning for ML"],
  "labels": ["databases", "ml", "frontend"],
  "multi": true, "max_labels": 2
}'
```

## Keys and limits

No key is needed for free use. Free limits are per IP and counted in classifications, not requests: 3,000 a minute and 20,000 a day on the fast tier, 200 a minute and 2,000 a day on smart. Every classification response carries RateLimit-Limit and RateLimit-Policy, and RateLimit-Remaining once the limiter has been consulted (every 200 and 429); a 429 adds Retry-After. Workspace keys are metered against the workspace credit balance; current plans are at https://classifier.dev/pricing. Pro workspaces have 10x minute and daily allowances shared across keys and agents, and accept up to 1,000 inputs per request on both tiers. Use --api-key with the CLI, or set CLASSIFY_API_KEY (CLASSIFIER_API_KEY also works). https://classifier.dev/auth.md

```
POST /v1/systemone counts named questions rather than HTTP requests. A
placeholder uses the public fast-tier quota per IP. A classifier_agent_ key
uses the workspace's shared quota and credit balance; returned TypeSafe token
usage determines the charge, and Pro gets the same 10x allowance as the REST
and MCP APIs. GET /v1/models does not spend quota or credits. TypeSafe-native
validation, rate-limit and service errors retain their status and body;
x-typesafe-request-id, Retry-After and Retry-After-Ms are preserved. Workspace
responses also expose x-request-id and x-billing-status (pending, settled, refunded or
review). Successful workspace responses include x-billed-input-tokens,
x-smart-escalations and x-usage-cost-usd. The price is $0.042 per million
base input tokens plus $0.002 per successful Smart escalation.
```

## Sandbox

The sandbox endpoint, POST /v1/sandbox/classify, runs real inference with the same authentication, quotas and billing as POST /v1/classify. Workspace keys spend workspace credits. Request content is retained for training unless you set share_data: false; usage and billing metadata are still recorded. Start with a handful of inputs. This is not a simulated billing environment.

## Errors

```
POST errors are JSON. Classification errors include a stable code:
```

```json
{"error": "Provide at least 2 labels; got 1 ("spam").", "code": "too_few_labels"}
```

The GET forms answer plain text (error:, usage:, try: lines, the last a URL that would have worked) unless ?verbose=1 or Accept: application/json asks for the JSON object. A 429 on the free limits names the plan that lifts them and carries its URL as upgrade, so an agent that runs out of room can hand its person the link rather than a wait.

400 codes: no_input, too_many_inputs, too_few_labels, too_many_labels, empty_label, duplicate_labels, empty_input, input_too_long, bad_tier, bad_json. 404: not_found. 429: rate_limit_minute, rate_limit_day (with Retry-After). 502: typesafe or typesafe_<status> when the decision model failed; openrouter_<status>, chain_exhausted or timeout when the fallback chain did; upstream_other. A 402 request_spending_limit means the batch needs fewer or shorter inputs, or a funded workspace key. Retry 502s with backoff. 401: invalid_api_key for unsupported credentials. 403: inactive_api_key for paused or revoked workspace keys; proxy_requires_payment when a free caller uses anonymous proxy infrastructure. 402: insufficient_balance or request_spending_limit. Follow action and retryable in spending errors; retrying an unchanged over-budget request will not make it fit. Long context: 400 long_context_input or long_context_too_large; 402 long_context_payment_required; 422 long_context_no_evidence (no charge); 503 long_context_unavailable. Smart long-context requests return 400 bad_tier. The list a client can validate against: components.schemas.Error in https://classifier.dev/openapi.json

## Versioning

The response shape is stable and additive: fields are added, never renamed or removed, within a major version. The current major is v1, addressed as POST /v1/classify; the bare POST / is an alias that always tracks the current major. Every response carries an x-api-version header. A breaking change would ship as /v2 alongside /v1, and /v1 would then carry Deprecation and Sunset headers for at least six months before removal. Classification is side-effect-free, but inference has a cost. Send Idempotency-Key to prevent duplicate work: a repeated admitted key returns 409 duplicate_request, not a cached result. Keep the original response or request ID; changing the key starts a new billable operation.

## Source and support

The whole service — worker, CLI, eval harness — is open source at https://github.com/mrmps/classifier-dev. Issues there; conversations at https://cal.com/michaelsf/coffee; the person behind it at https://x.com/michael_chomsky. Measured accuracy, calibration and cost: https://classifier.dev/benchmark
