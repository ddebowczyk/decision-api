# Agent authentication on classifier.dev

Canonical: https://classifier.dev/auth.md · Last updated 2026-09-22

Classification and documentation work without a key. Workspace API keys use
the workspace credit balance; current plans are at https://classifier.dev/pricing.
Send API keys as bearer credentials on REST or MCP.
Billing uses a separate browser sign-in session.
This file follows the discovery path from https://github.com/workos/auth.md;
classifier.dev does not implement that spec's agent registration or token exchange.

## Discover

- REST: POST https://classifier.dev/v1/classify with inputs and labels.
- TypeSafe SDK: POST https://classifier.dev/v1/systemone and GET
  https://classifier.dev/v1/models with base URL https://classifier.dev.
- MCP: https://classifier.dev/mcp; docs: https://classifier.dev/mcp/docs.
- OpenAPI: https://classifier.dev/openapi.json.
- RFC 9728 metadata: https://classifier.dev/.well-known/oauth-protected-resource.
  No OAuth authorization server, scopes, ID-JAG exchange or agent identity assertion.

## Pick a method

- **anonymous** — free, per IP: fast 3,000/minute and 20,000/day;
  smart 200/minute and 2,000/day. No account or card. The TypeSafe SDK requires
  an apiKey value, so use a non-empty placeholder such as "unused"; it is ignored.
- **service_auth (workspace key)** — classifier_agent_ keys charge the workspace
  credit balance. Create and manage keys in /app/keys. Free workspaces have
  the public ceilings, shared across keys. Paid plans raise them: Pro 10x, Scale 100x:
  fast 30,000/minute and 200,000/day; smart 2,000/minute and 20,000/day,
  shared across keys and agents. Pro accepts up to 1,000 inputs per request.
- **service_auth (partner key)** — separately arranged limits;
  contact https://cal.com/michaelsf/coffee.

## Register and claim

Create a workspace at /auth/sign-up and create or rotate workspace keys at
/app/keys. There is no agent registration or claim endpoint. Public classification requires no
registration.

## Use the key

    Authorization: Bearer classifier_agent_...

Use the same header on REST and MCP. For the CLI, use --api-key or set
CLASSIFY_API_KEY (CLASSIFIER_API_KEY also works). Keep keys out of URLs.
For the official TypeSafe SDK, use the classifier_agent_ key as its apiKey and
set baseURL/base_url to https://classifier.dev. POST /v1/systemone then charges
the workspace from TypeSafe's returned token usage and uses its shared quota;
GET /v1/models remains public and free. Never use a real TypeSafe API key with
classifier.dev: caller credentials are not forwarded to TypeSafe.
No token exchange or refresh is needed. Your browser billing session is not
an API credential.

Default/explicit Jev inputs over 32,000 characters require a workspace key
backed by paid balance or an active paid subscription. Anonymous access and
free signup credit do not qualify. This Fast-only long-context path costs
$0.084 per million original cl100k_base context tokens, summed once across
inputs regardless of dimensions or screening/final usage. It accepts at most
250,000 context tokens, 20 documents and 32 decisions within a 1 MB body.
Final Jev reads selected evidence; usage.long_context discloses omissions.
Explicit model: "chunklaya" retains the separate legacy opt-in behavior.

## Errors

- 401 — the key is invalid; create a replacement in your workspace.
- 402 — insufficient workspace balance. Manage billing at https://classifier.dev/app/plans.
  long_context_payment_required means paid funding is required for long context.
- 403 — the key is inactive or the workspace cannot authorize usage.
- 429 — quota reached; wait the Retry-After seconds. RateLimit headers describe
  the allowance. The code is rate_limit_minute or rate_limit_day.
- 400 — invalid classification parameters; the message says what to change.
  long_context_too_large and long_context_input identify long-context refusals.
- 422 — long_context_no_evidence; no eligible evidence, no charge.
- 502 — classification provider failure; retry with backoff.
- 503 — billing verification is unavailable; retry later.
  long_context_unavailable means the long-context path is unavailable.

## Revocation and billing

Rotate workspace keys at /app/keys; rotating invalidates the previous key.
Manage your subscription at /app/plans.
Partner keys are rotated through their issuing contact. There is no
OAuth revocation or token exchange endpoint.
