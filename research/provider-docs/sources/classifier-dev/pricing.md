---
title: classifier.dev pricing
description: Start free, then add a workspace plan for usage credits, API keys and billing.
canonical: https://classifier.dev/pricing
last-updated: 2026-09-22
---

# classifier.dev pricing

Try classifier.dev without an API key, account or card. Create a workspace when you want usage credits, named API keys, shared billing and usage by connection. Every plan includes fast and smart classification, REST, MCP and the CLI.

URL scraping costs $2.20/1,000 provider-billed requests plus normal classification. Markdown and HTML are included on request at no extra cost. Requires funded access and enough balance for the up-front reservation. Successful scrapes remain billable if classification fails; errors disclose any retained scrape charge. See https://classifier.dev/developers.

## Free

```
Price                    $0
Public access            no account; 3,000 fast/minute and 20,000/day per IP
Workspace credit         $5.00 once at personal signup
Workspace seats          1
Get started              https://classifier.dev/auth/sign-up
```

A classification is one text against one label set; 1,000 texts in one request are 1,000 classifications. Multi-label counts once per text, not per label.

Free provider spending is capped at $0.01 per Fast request, $0.10 per Smart request, $0.50 per IP network per UTC day and $100 across everyone per UTC day. Up to four free requests may run at once per IP; IPv6 addresses share a /64 allowance. If Smart reviews reach the request cap, fast answers remain and usage.escalation_failed counts missed reviews. Large inputs or batches need a funded key. Free access pauses when the shared pool or verification capacity is spent; anonymous proxy networks require a funded key. Signup credit uses these same free limits. Synchronous request bodies are limited to 1 MB; funded whole-document uploads allow 10M tokens and 100 MB.

## Pro

```
Price                    $20/month
Included usage           $20.00 each month
Workspace seats          3
Rate limits              10x Free, shared across workspace keys and agents
Billing                  https://classifier.dev/app/plans
```

Usage is charged to the workspace balance at the published input-token and escalation prices. Smart costs the same as Fast when no escalation is needed. A paid request admitted with a positive available balance can finish and leave a negative balance. New requests stop at zero or below until funds are added.

## Scale

```
Price                    $200/month
Included usage           $200.00 each month
Workspace seats          unlimited
Rate limits              100x Free, shared across workspace keys and agents
Billing                  https://classifier.dev/app/plans
```

The same metered prices as Pro with ten times the monthly allowance and rate limits sized for production traffic.

Funded workspaces skip the shared free pool and proxy checks. Each request has a default $10 provider-cost ceiling. Its maximum customer charge is held atomically before inference, so concurrent keys cannot repeatedly overdraw. Unused reservations are released after inference; missing input-token measurements remain held for billing review. If further Smart reviews cannot fit the provider ceiling, completed classifications are returned with escalation_failed; only successful reviews are billed.

## Enterprise

```
Price                    by arrangement
For                      more capacity, private infrastructure or a contract
How                      email contact@classifier.dev or book https://cal.com/michaelsf/coffee
```

```
Dedicated deployment     the service in your own cloud account: AWS, GCP
                         or another
Private inference        end-to-end encrypted, so the texts are readable
                         only inside your deployment
Higher accuracy          a model tuned to your labels and your data
Lower latency            served closer to your traffic, on capacity that
                         is yours
```

Ask by email, contact@classifier.dev, or book a call at https://cal.com/michaelsf/coffee. Say which of the four you need and roughly how many classifications a day; the answer comes back with a price, and the accuracy or latency you are buying is measured on your own data before you commit.

## Pay as you go

```
Top-ups                  $5 to $1,000 per purchase, whole dollars
Auto recharge            optional; charges the saved payment method when
                         the balance falls below your threshold, with an
                         optional calendar-month maximum
Where                    https://classifier.dev/app/credits
```

Purchased funds never expire and are spent after any included plan allowance. Balances update only after the payment is confirmed.

## Usage prices

```
Input tokens           $0.042 per million
Smart escalations      +$2.00 per 1,000
```

Smart starts with Fast and reviews uncertain answers. You pay extra only for successful Smart escalations. No escalation means no extra charge. 1 million input tokens with 50 Smart escalations cost $0.142.

Output tokens are free. Input usage includes text, labels and instructions processed by the base classifier. Retries, fallback routing and Smart model tokens add no separate charges. Paid requests already admitted can finish and leave a negative balance. New requests require a positive available balance.

Jev long context costs $0.084 per million original context tokens, counted with cl100k_base once per input across the request: 2 × Jev's $0.042 rate. Dimensions do not multiply this price; actual screening and final-call usage do not change it. A request with 250,000 original context tokens costs $0.021. No eligible evidence returns 422 long_context_no_evidence, no charge. Requires paid balance or an active paid subscription; free signup credit and anonymous access do not qualify. Fast only, up to 20 documents and 32 decisions, within the synchronous 250,000-token and 1 MB limits. For one whole document, POST /v1/classify accepts up to 10M tokens and 100 MB in one upload and returns 202 with a status_url. No client splitting is needed. The exact document price is reserved after upload; 10M tokens costs $0.84. Failed or canceled jobs are refunded. Final Jev uses selected evidence; eligible chunks can be omitted when its budget fills.

## Included on every plan

Fast and Smart classification with your own labels through REST, MCP or the CLI. Public requests use the public limits when no workspace key is sent; workspace keys charge the workspace balance. Every response reports its applicable rate limit and a 429 says how long to wait.

## Rate limits

```
Free Fast     3,000/minute; 20,000/day
Free Smart    200/minute; 2,000/day
Pro Fast      30,000/minute; 200,000/day
Pro Smart     2,000/minute; 20,000/day
```

Limits count classifications and are shared across workspace keys and agents. Public access is limited per IP. Anonymous traffic also shares a 5,000/minute and 50,000/day allowance with every caller using the same label set, so rotating addresses does not create a new budget. Workspace and enterprise keys do not use that anonymous label-set allowance. Laya trial limits apply to every plan.
