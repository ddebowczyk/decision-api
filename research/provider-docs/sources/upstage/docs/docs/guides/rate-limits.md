> For the complete documentation index, see [/llms.txt](/llms.txt).

> Source: /docs/guides/rate-limits

# Rate limits

To ensure a stable and reliable experience for all users, our services include rate limits on API requests to maintain fair resource distribution.
This guide explains our rate limit policy and provides best practices to help you avoid hitting limits and manage exceeded requests effectively.

## What are rate limits?

Rate limits help ensure a smooth and reliable experience by preventing excessive API requests from impacting system performance. They define the maximum number of API calls allowed within a specific time frame.
If you exceed this limit, additional requests will be temporarily blocked until the cooldown period ends, allowing you to resume usage.
The following rate limit policies are applied in our services:

- **RPS (Requests per second)**: The maximum number of API requests allowed per second.
- **RPM (Requests per minute)**: The maximum number of API requests allowed per minute.
- **TPM (Tokens per minute)**: The maximum number of tokens allowed per minute (applied to text-based models like Solar LLMs).
- **PPM (Pages per minute)**: The maximum number of pages allowed per minute (applied to document processing models like Document Parse).

## What happens when the rate limit is exceeded?

If the rate limit is exceeded, the server responds with an HTTP status code `429 Too Many Requests`.
When this happens, you must wait for a designated cooldown period before retrying your request.

## Rate limits by capability

The following table provides a comprehensive overview of rate limits across all our capabilities, organized by commitment tier:

Rate limits are automatically assigned based on your commitment tier. For detailed information about commitment tiers and pricing, please visit our [Pricing page](https://www.upstage.ai/pricing). To raise your rate limits, purchase credits on the [Credit page](https://console.upstage.ai/billing/credit) to upgrade your commitment tier. If no commitment tier covers the limits you need, [contact us](https://www.upstage.ai/contact-us?utm_medium=console\&utm_source=docs\&utm_content=rate-limits) with your requirements.

> **Legacy Tiers**: Legacy tiers represent the rate limit structure prior to our pricing policy update on November 4, 2025. For more details about the update, see our [Changelog](/docs/resources/changelog#2025-11). To check your current rate limit tier, visit the [Credit page](https://console.upstage.ai/billing/credit) and refer to the Rate limit section under Commitment.

### Generate (Chat / Reasoning / Structured outputs)

#### Solar Pro 4

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>250,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>500,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

> **Legacy Tiers**: On legacy tiers, Solar Pro 4 is limited to 100 RPM and 50,000 TPM regardless of tier level. Commitment tiers are assigned automatically when you purchase credits on the [Credit page](https://console.upstage.ai/billing/credit).

#### Solar Mini 4

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>50,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>150,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

> **Legacy Tiers**: On legacy tiers, Solar Mini 4 is limited to 100 RPM and 50,000 TPM regardless of tier level. Commitment tiers are assigned automatically when you purchase credits on the [Credit page](https://console.upstage.ai/billing/credit).

#### Solar Pro 3

> `solar-pro3` will be fully deprecated on **October 30, 2026 (KST)**. Requests naming it will return an error after that date. Please migrate to [`solar-pro4`](/docs/models/solar-pro-4).

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>250,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>500,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>100</td><td>100,000</td></tr><tr><td>Tier 2 (Legacy)</td><td>300</td><td>300,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>500</td><td>500,000</td></tr></tbody></table>

#### Solar Pro 2

> `solar-pro2` will be fully deprecated on **October 30, 2026 (KST)**. Requests naming it will return an error after that date. Please migrate to [`solar-pro4`](/docs/models/solar-pro-4).

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>250,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>500,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>100</td><td>100,000</td></tr><tr><td>Tier 2 (Legacy)</td><td>300</td><td>300,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>500</td><td>500,000</td></tr></tbody></table>

#### Solar Mini

> `solar-mini` will be fully deprecated on **October 30, 2026 (KST)**. Requests naming it will return an error after that date. Please migrate to [`solar-mini4`](/docs/models/solar-mini-4).

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>50,000</td></tr><tr><td>Tier 1 (Explore)</td><td>800</td><td>300,000</td></tr><tr><td>Tier 2 (Build)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 3 (Scale)</td><td>8,000</td><td>3,000,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>15,000</td><td>6,000,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>100</td><td>100,000</td></tr><tr><td>Tier 2 (Legacy)</td><td>300</td><td>300,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>500</td><td>500,000</td></tr></tbody></table>

#### Syn Pro

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>50,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>150,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>100</td><td>100,000</td></tr><tr><td>Tier 2 (Legacy)</td><td>300</td><td>300,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>500</td><td>500,000</td></tr></tbody></table>

#### Solar DocVision

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>50,000</td></tr><tr><td>Tier 1 (Explore)</td><td>300</td><td>100,000</td></tr><tr><td>Tier 2 (Build)</td><td>1,200</td><td>500,000</td></tr><tr><td>Tier 3 (Scale)</td><td>2,500</td><td>900,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>4,500</td><td>1,800,000</td></tr></tbody></table>

### Decide (Structured decisions)

Solar Decide is served on Solar Mini 4 and shares its rate limits.

#### Solar Decide

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>50,000</td></tr><tr><td>Tier 1 (Explore)</td><td>400</td><td>150,000</td></tr><tr><td>Tier 2 (Build)</td><td>2,000</td><td>750,000</td></tr><tr><td>Tier 3 (Scale)</td><td>4,000</td><td>1,500,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>8,000</td><td>3,000,000</td></tr></tbody></table>

> **Legacy Tiers**: On legacy tiers, Solar Decide is limited to 100 RPM and 50,000 TPM regardless of tier level. Commitment tiers are assigned automatically when you purchase credits on the [Credit page](https://console.upstage.ai/billing/credit).

### Embed

#### Embeddings

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>300,000</td></tr><tr><td>Tier 1 (Explore)</td><td>2,000</td><td>700,000</td></tr><tr><td>Tier 2 (Build)</td><td>9,000</td><td>3,500,000</td></tr><tr><td>Tier 3 (Scale)</td><td>18,000</td><td>7,000,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>35,000</td><td>14,000,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>TPM (Tokens per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>300</td><td>300,000</td></tr><tr><td>Tier 2 (Legacy)</td><td>500</td><td>500,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>1,000</td><td>1,000,000</td></tr></tbody></table>

### Parse (Document parsing / Document OCR)

#### OCR

**Synchronous API**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>3</td><td>500</td></tr><tr><td>Tier 1 (Explore)</td><td>6</td><td>1,000</td></tr><tr><td>Tier 2 (Build)</td><td>10</td><td>1,500</td></tr><tr><td>Tier 3 (Scale)</td><td>15</td><td>2,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>20</td><td>3,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>10</td><td>500</td></tr><tr><td>Tier 2 (Legacy)</td><td>10</td><td>1,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>20</td><td>1,500</td></tr></tbody></table>

#### Document Parse

**Synchronous API**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>3</td><td>500</td></tr><tr><td>Tier 1 (Explore)</td><td>6</td><td>1,000</td></tr><tr><td>Tier 2 (Build)</td><td>10</td><td>1,500</td></tr><tr><td>Tier 3 (Scale)</td><td>15</td><td>2,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>20</td><td>3,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>10</td><td>500</td></tr><tr><td>Tier 2 (Legacy)</td><td>10</td><td>1,000</td></tr><tr><td>Tier 3 (Legacy)</td><td>20</td><td>1,500</td></tr></tbody></table>

**Asynchronous API**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>6</td><td>1,200</td></tr><tr><td>Tier 1 (Explore)</td><td>12</td><td>3,600</td></tr><tr><td>Tier 2 (Build)</td><td>20</td><td>12,000</td></tr><tr><td>Tier 3 (Scale)</td><td>30</td><td>18,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>40</td><td>24,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>30</td><td>1,200</td></tr><tr><td>Tier 2 (Legacy)</td><td>30</td><td>3,600</td></tr><tr><td>Tier 3 (Legacy)</td><td>30</td><td>12,000</td></tr></tbody></table>

### Extract (Universal information extraction)

#### Information Extract

**Synchronous API**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>1</td><td>300</td></tr><tr><td>Tier 1 (Explore)</td><td>3</td><td>900</td></tr><tr><td>Tier 2 (Build)</td><td>10</td><td>1,500</td></tr><tr><td>Tier 3 (Scale)</td><td>15</td><td>2,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>20</td><td>3,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>10</td><td>300</td></tr><tr><td>Tier 2 (Legacy)</td><td>10</td><td>900</td></tr><tr><td>Tier 3 (Legacy)</td><td>10</td><td>1,500</td></tr></tbody></table>

**Asynchronous API**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>2</td><td>1,200</td></tr><tr><td>Tier 1 (Explore)</td><td>6</td><td>3,600</td></tr><tr><td>Tier 2 (Build)</td><td>20</td><td>12,000</td></tr><tr><td>Tier 3 (Scale)</td><td>30</td><td>18,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>40</td><td>24,000</td></tr></tbody></table>

### Classify (Document classification)

#### Document Classify

<table><thead><tr><th>Tier</th><th>RPM (Requests per minute)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 0</td><td>100</td><td>300</td></tr><tr><td>Tier 1 (Explore)</td><td>100</td><td>900</td></tr><tr><td>Tier 2 (Build)</td><td>100</td><td>1,500</td></tr><tr><td>Tier 3 (Scale)</td><td>100</td><td>2,000</td></tr><tr><td>Tier 4 (Enterprise)</td><td>100</td><td>3,000</td></tr></tbody></table>

**Legacy Tiers**

<table><thead><tr><th>Tier</th><th>RPS (Requests per second)</th><th>PPM (Pages per minute)</th></tr></thead><tbody><tr><td>Tier 1 (Legacy)</td><td>10</td><td>300</td></tr><tr><td>Tier 2 (Legacy)</td><td>10</td><td>900</td></tr><tr><td>Tier 3 (Legacy)</td><td>20</td><td>1,500</td></tr></tbody></table>

## Rate limit response headers

Upstage API includes HTTP response headers in all responses to indicate the rate limit status.
You can use these headers to programmatically monitor your current usage and remaining allowance, helping you proactively prevent exceeding the rate limits.

> **Note**: For rate limit values (RPM/TPM/PPM values by Tier), refer to the [Rate limits by capability](#rate-limits-by-capability) section above.

### Header categories

Depending on the characteristics of the API endpoint, up to three categories of rate limit headers are included in the response.

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Category</th><th>Description</th><th>Target</th><th>Header Suffix</th></tr></thead><tbody><tr><td><strong>RPS / RPM</strong> (Requests Per Second / Minute)</td><td>Limit on the number of requests per second or minute</td><td>All API requests</td><td><code>-Requests</code></td></tr><tr><td><strong>TPM</strong> (Tokens Per Minute)</td><td>Limit on the number of tokens per minute</td><td>Token-based models like Chat and Embedding</td><td><code>-Tokens</code></td></tr><tr><td><strong>PPM</strong> (Pages Per Minute)</td><td>Limit on the number of pages per minute</td><td>Document processing models like Document Parse and OCR</td><td><code>-Pages</code></td></tr></tbody></table>

- The RPS/RPM headers are **always** included.
- The TPM headers are included only if a TPM limit is set for the model.
- The PPM headers are included only if a PPM limit is set for the model.

### Complete list of headers

#### Limit (Maximum allowance)

Indicates the maximum allowance within the current rate limit window.

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Header</th><th>Value Type</th><th>Description</th><th>Example</th></tr></thead><tbody><tr><td><code>X-Upstage-RateLimit-Limit-Requests</code></td><td>integer (string)</td><td>Maximum requests per second or minute</td><td><code>500</code></td></tr><tr><td><code>X-Upstage-RateLimit-Limit-Tokens</code></td><td>integer (string)</td><td>Maximum tokens per minute</td><td><code>200000</code></td></tr><tr><td><code>X-Upstage-RateLimit-Limit-Pages</code></td><td>integer (string)</td><td>Maximum pages per minute</td><td><code>500</code></td></tr></tbody></table>

#### Remaining (Remaining allowance)

Indicates the remaining allowance within the current rate limit window.

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Header</th><th>Value Type</th><th>Description</th><th>Example</th></tr></thead><tbody><tr><td><code>X-Upstage-RateLimit-Remaining-Requests</code></td><td>integer (string)</td><td>Remaining requests</td><td><code>499</code></td></tr><tr><td><code>X-Upstage-RateLimit-Remaining-Tokens</code></td><td>integer (string)</td><td>Remaining tokens</td><td><code>195000</code></td></tr><tr><td><code>X-Upstage-RateLimit-Remaining-Pages</code></td><td>integer (string)</td><td>Remaining pages</td><td><code>490</code></td></tr></tbody></table>

#### Reset (Reset time)

Indicates the time when the rate limit window resets as a Unix timestamp (in seconds).

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Header</th><th>Value Type</th><th>Description</th><th>Example</th></tr></thead><tbody><tr><td><code>X-Upstage-RateLimit-Reset-Requests</code></td><td>Unix timestamp (string)</td><td>RPS/RPM reset time</td><td><code>1742300460</code></td></tr><tr><td><code>X-Upstage-RateLimit-Reset-Tokens</code></td><td>Unix timestamp (string)</td><td>TPM reset time</td><td><code>1742300460</code></td></tr><tr><td><code>X-Upstage-RateLimit-Reset-Pages</code></td><td>Unix timestamp (string)</td><td>PPM reset time</td><td><code>1742300460</code></td></tr></tbody></table>

#### Interval (Window period)

Indicates the duration unit of the rate limit window.

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Header</th><th>Value Type</th><th>Possible Values</th><th>Description</th></tr></thead><tbody><tr><td><code>X-Upstage-RateLimit-Interval-Requests</code></td><td>string</td><td><code>"second"</code>, <code>"minute"</code></td><td>RPS/RPM window period</td></tr><tr><td><code>X-Upstage-RateLimit-Interval-Tokens</code></td><td>string</td><td><code>"minute"</code></td><td>TPM window period</td></tr><tr><td><code>X-Upstage-RateLimit-Interval-Pages</code></td><td>string</td><td><code>"minute"</code></td><td>PPM window period</td></tr></tbody></table>

#### Retry-After (Retry possible time)

Included only when the rate limit is exceeded (HTTP status code `429`). It indicates the time when you can retry the request as a Unix timestamp (in seconds).

<table><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Header</th><th>Value Type</th><th>Description</th><th>Example</th></tr></thead><tbody><tr><td><code>X-Upstage-RateLimit-Retry-After-Requests</code></td><td>Unix timestamp (string)</td><td>RPS/RPM retry possible time</td><td><code>1742300445</code></td></tr><tr><td><code>X-Upstage-RateLimit-Retry-After-Tokens</code></td><td>Unix timestamp (string)</td><td>TPM retry possible time</td><td><code>1742300445</code></td></tr><tr><td><code>X-Upstage-RateLimit-Retry-After-Pages</code></td><td>Unix timestamp (string)</td><td>PPM retry possible time</td><td><code>1742300445</code></td></tr></tbody></table>

> **Note**: The `Retry-After` header is included in the response only when the rate limit for that category is exceeded (`Retry-After > 0`). It is not included in successful responses (HTTP 200).

### Response examples

#### Successful response (Chat API — RPM + TPM applied)

```http
HTTP/1.1 200 OK
X-Upstage-RateLimit-Limit-Requests: 500
X-Upstage-RateLimit-Remaining-Requests: 499
X-Upstage-RateLimit-Reset-Requests: 1742300460
X-Upstage-RateLimit-Interval-Requests: minute
X-Upstage-RateLimit-Limit-Tokens: 200000
X-Upstage-RateLimit-Remaining-Tokens: 195000
X-Upstage-RateLimit-Reset-Tokens: 1742300460
X-Upstage-RateLimit-Interval-Tokens: minute
```

#### Successful response (Document Parse API — RPM + PPM applied)

```http
HTTP/1.1 200 OK
X-Upstage-RateLimit-Limit-Requests: 100
X-Upstage-RateLimit-Remaining-Requests: 98
X-Upstage-RateLimit-Reset-Requests: 1742300460
X-Upstage-RateLimit-Interval-Requests: minute
X-Upstage-RateLimit-Limit-Pages: 500
X-Upstage-RateLimit-Remaining-Pages: 490
X-Upstage-RateLimit-Reset-Pages: 1742300460
X-Upstage-RateLimit-Interval-Pages: minute
```

#### Rate limit exceeded response (HTTP 429 — RPM exceeded)

```http
HTTP/1.1 429 Too Many Requests
X-Upstage-RateLimit-Limit-Requests: 500
X-Upstage-RateLimit-Remaining-Requests: 0
X-Upstage-RateLimit-Reset-Requests: 1742300460
X-Upstage-RateLimit-Interval-Requests: minute
X-Upstage-RateLimit-Retry-After-Requests: 1742300445
X-Upstage-RateLimit-Limit-Tokens: 200000
X-Upstage-RateLimit-Remaining-Tokens: 150000
X-Upstage-RateLimit-Reset-Tokens: 1742300460
X-Upstage-RateLimit-Interval-Tokens: minute
```

> **Note**: Even if the RPM is exceeded, the TPM/PPM headers will still return the current status of their respective categories. The `Retry-After` header is only included for the exceeded category (Requests in this case).

### Programming examples

#### Python

```python
import time
import requests

response = requests.post(
    "https://api.upstage.ai/v1/solar/chat/completions",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "model": "solar-pro",
        "messages": [{"role": "user", "content": "Hello"}]
    }
)

# Check rate limit status
rpm_remaining = int(response.headers.get("X-Upstage-RateLimit-Remaining-Requests", -1))
rpm_reset = int(response.headers.get("X-Upstage-RateLimit-Reset-Requests", 0))

if rpm_remaining == 0:
    # Wait until rate limit resets
    wait_seconds = rpm_reset - int(time.time())
    if wait_seconds > 0:
        print(f"Rate limit reached. Waiting {wait_seconds}s...")
        time.sleep(wait_seconds)

# Handle 429 response
if response.status_code == 429:
    retry_after = int(response.headers.get("X-Upstage-RateLimit-Retry-After-Requests", 0))
    wait_seconds = retry_after - int(time.time())
    if wait_seconds > 0:
        time.sleep(wait_seconds)
```

#### cURL

```bash
# Check only response headers
curl -s -D - -o /dev/null \
  -H "Authorization: Bearer $UPSTAGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "solar-pro", "messages": [{"role": "user", "content": "Hello"}]}' \
  https://api.upstage.ai/v1/solar/chat/completions \
  | grep -i "X-Upstage-RateLimit"
```

### FAQ

#### Q: Are all 15 headers included in every API response?

No. Only the rate limit headers configured for the specific model are included by category.

- Chat, Embedding models: RPM + TPM headers (up to 10 headers)
- Document Parse, OCR models: RPM + PPM headers (up to 10 headers)
- RPM headers are always included in all API requests.

#### Q: What is the difference between `Reset` and `Retry-After`?

- **Reset**: The time when the rate limit window completely resets. After this time, the entire allowance is fully restored.
- **Retry-After**: Included only when the rate limit is exceeded (429), indicating the earliest time you can retry the request. It is earlier than or equal to the Reset time.

#### Q: Can the Interval value be anything other than `minute`?

In the code, two values are possible: `second` and `minute`. Currently, most rate limits are set in `minute` units, but this may change in the future.

#### Q: Can header values be negative?

The `Remaining` value can be negative if the rate limit is exceeded. This indicates the amount by which the limit has been exceeded in the current window.

## Best practices to handle rate limits

### Implement retry logic with backoff

Implement a retry logic that pauses API calls for a certain period before attempting another request. This ensures that your requests are spaced out enough to avoid hitting the rate limit repeatedly. For instance, if the limit is per minute, you can set a delay before the next request or use exponential backoff, where the wait time increases progressively after each retry.

```python
import time

import openai
from openai import OpenAI  # openai==1.52.2

documents = [
    "Solar embeddings are awesome",
    "Sam is a teacher.",
    "This is another document",
    "Hi, how are you?",
    "Father went into his room",
    "Mauna Kea is an inactive volcano on the island of Hawaiʻi. Its peak is 4,207.3 m above sea level, making it the highest point in Hawaii and second-highest peak of an island on Earth.",
    ...
]

client = OpenAI(
    api_key="UPSTAGE_API_KEY_INJECT",
    base_url="https://api.upstage.ai/v1"
)

embeddings = []

limit_attempts = 2

for i in range(0, len(documents)):
    num_attempts = 0
    wait_time = 1
    while num_attempts < limit_attempts:
        num_attempts += 1

        try:
            response = client.embeddings.create(
                input=documents[i],
                model="embedding-query"
            )

            embeddings += response.data[0].embedding
            print(f"Successfully processed document {i+1} of {len(documents)}")
            print(f"Embedding: {embeddings[i]}")
        except openai.RateLimitError:
            time.sleep(wait_time)
            wait_time *= 2

```

### Use asynchronous APIs

Asynchronous APIs typically support higher rate limits, making them a more efficient option for handling large volumes of requests.
Asynchronous APIs are available for some of our models such as [Document Parse](/docs/capabilities/parse/handling-large-documents#asynchronous-api).
This approach helps distribute API calls over time, reducing the risk of exceeding rate limits while optimizing performance.

### Batch processing

Instead of sending frequent individual API requests, consider using batch processing. By grouping multiple requests into a single batch, you can reduce the number of API calls and stay within the rate limit. This is particularly useful for large-scale embeddings operations where multiple requests need to be sent in a short time.

```python
from openai import OpenAI  # openai==1.52.2

documents = [
    "Solar embeddings are awesome",
    "Sam is a teacher.",
    "This is another document",
    "Hi, how are you?",
    "Father went into his room",
    "Mauna Kea is an inactive volcano on the island of Hawaiʻi. Its peak is 4,207.3 m above sea level, making it the highest point in Hawaii and second-highest peak of an island on Earth.",
    ...
]

client = OpenAI(
    api_key="UPSTAGE_API_KEY_INJECT",
    base_url="https://api.upstage.ai/v1"
)

batch_size = 32
embeddings = []

for i in range(0, len(documents), batch_size):
    response = client.embeddings.create(
        input=documents[i:i + batch_size],
        model="embedding-query"
    )

    for datum in response.data:
        embeddings += datum.embedding
        print(f"Successfully processed document {i+1} of {len(documents)}")
        print(f"Embedding: {embeddings[i]}")

```

### Caching strategy

If your API requests frequently return the same data, implementing a caching strategy can greatly reduce the number of requests. This is particularly beneficial in scenarios like embeddings.

Store the results of frequent requests and serve them from the cache instead of making repeated API calls. This reduces the load on the API and helps in staying within the allowed limits.

```python
from openai import OpenAI  # openai==1.52.2

documents = [
    "Solar embeddings are awesome",
    "Sam is a teacher.",
    "This is another document",
    "Hi, how are you?",
    "Father went into his room",
    "Mauna Kea is an inactive volcano on the island of Hawaiʻi. Its peak is 4,207.3 m above sea level, making it the highest point in Hawaii and second-highest peak of an island on Earth.",
    ...
]

client = OpenAI(
    api_key="UPSTAGE_API_KEY_INJECT",
    base_url="https://api.upstage.ai/v1"
)

cache = {}

embeddings = []

for i in range(0, len(documents)):
    document = documents[i]

    if document not in cache:
        response = client.embeddings.create(
            input=document,
            model="embedding-query"
        )
        cache[document] = response.data[0].embedding

    embeddings += cache[document]
    print(f"Successfully processed document {i+1} of {len(documents)}")
    print(f"Embedding: {embeddings[i]}")
```

## Still need a higher rate limit?

Rate limits are provided based on your [commitment tier](https://upstage.ai/pricing/api). Higher tiers unlock increased rate limits and additional benefits.

If you need higher limits right away, you can upgrade your tier by [purchasing credits](https://console.upstage.ai/billing/credit):

- **One-time purchase**: Benefits last for one month from the time the tier is activated.
- **Monthly/Annual auto-recharge**: Benefits renew with each billing cycle, keeping your tier active continuously.

For custom enterprise agreements, please [contact us](https://www.upstage.ai/contact-us?utm_medium=console\&utm_source=docs\&utm_content=rate-limits) with your requirements and we'll have a business representative reach out to you.
