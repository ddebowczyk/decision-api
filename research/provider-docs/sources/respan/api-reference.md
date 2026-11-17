> For clean Markdown of any page, append .md to the page URL.
> For a complete documentation index, see https://respan.ai/docs/llms.txt.
> For AI client integration (Claude Code, Cursor, etc.), connect to the MCP server at https://respan.ai/docs/_mcp/server.

# Run span-01

POST https://api.respan.ai/api/v1/scores
Content-Type: application/json

Run inference with Span-01, Respan's first-party classification model for agent traces. Provide an interaction in `span` and plain-language definitions in `behaviors`. Your application can use the model's predictions for evaluations, guardrails, routing, and monitoring.

For each definition, the model returns the probabilities that it is present, absent, or not observable; the three probabilities sum to approximately 1. The example classifies a support interaction for user frustration and an assistant apology. Replace those definitions to apply the model to your own use case.

Reference: https://respan.ai/docs/apis/gateway/run-span-01

## Authentication

- `Authorization` header (bearer token, required) — Use your Respan API key for Respan API authentication. Enter only the Respan API key value; clients send Authorization: Bearer \<RESPAN\_API\_KEY>. For /api/responses, provider credentials such as Perplexity, OpenAI, or Azure OpenAI go in Settings -> Providers or respan\_params.credential\_override in the request body, not in this authentication field.

## Request

### Body (application/json)

This endpoint expects a Span1ScoreRequest.

- `span` (Span1Span, required) — The interaction to classify: preceding messages in input and the target turn in output.
- `behaviors` (list of Span1Behavior, required) — The rubric: one ID and plain-language definition per behavior. There is no per-request behavior-count cap. Definitions count toward usage.input_tokens.
- `model` (string, optional, default: span-01-free) — Use span-01-free or span-01-pro. Omit for span-01-free.
- `respan_params` (Span1ScoreRequestRespanParams, optional) — Optional Respan gateway parameters for logging and attribution. These are removed before the request reaches the scorer. See the Respan gateway parameters guide for other supported fields.

## Response

### 200

Behavior probabilities for the submitted span. The example is the captured response to the request shown.

- `model` (enum, required) — The model used for inference.
  - Allowed values: `span-01-free`, `span-01-pro`
- `results` (list of Span1BehaviorResult, required) — One result per behavior, in the same order as the request. Match each result using its id.
- `usage` (Span1ScoreResponseUsage, optional) — Token usage, when reported by the scorer. May be omitted if the scorer does not report token counts.

## Errors

### 400 Bad Request Error

Invalid request, including an unknown model or stream: true. Correct the request before retrying. Validation errors from the scorer are returned unchanged.

- `map from string to any`

### 402 Payment Required Error

The organization does not have sufficient Respan credits to call span-01-pro. Add credits or use span-01-free if Span-01 access is enabled for your organization.

- `map from string to any`

### 403 Forbidden Error

Missing, invalid, or expired Respan API key, or Span-01 access is not enabled for the organization. Read the detail message to distinguish an authentication failure from an access refusal. Contact Respan to request access to either tier.

- `map from string to any`

### 413 Content Too Large Error

The scorer rejected a span that is too large. Shorten the span and retry. The scorer's response body is returned unchanged.

- `map from string to any`

### 422 Unprocessable Entity Error

The scorer could not validate the span or behaviors, for example a behavior definition shorter than 3 characters. Correct the payload using the returned validation details.

- `map from string to any`

### 424 Failed Dependency Error

Respan could not reach the scorer. Retry with exponential backoff.

- `map from string to any`

### 429 Too Many Requests Error

A tier limit, the combined endpoint limit, or shared service capacity was reached. Span-01 tier and capacity refusals include code and Retry-After: 1; other rate-limit responses may have a different body. A refusal caused by the free model's daily cap requires waiting until 00:00 UTC or switching to span-01-pro with credits.

- `detail` (string, optional) — Explanation of the limit, including the affected tier and reset guidance when applicable. The message may use the internal tier names lite and pro.
- `code` (string, optional) — behavior_scorer_tier_limit for the per-tier minute or daily limit; behavior_scorer_at_capacity for shared service capacity. May be absent for other rate-limit responses.

### 503 Service Unavailable Error

The scorer is unavailable or overloaded, or scoring is not configured on this deployment. Scorer responses are returned unchanged, including Retry-After when provided. Retry transient failures with exponential backoff; contact Respan for persistent availability or configuration errors.

- `map from string to any`

### 504 Gateway Timeout Error

The scorer did not respond before the timeout. Retry with exponential backoff; shorten the span if timeouts persist.

- `map from string to any`

## Types

### Span1Span

- `input` (list of Span1Message, required) — Conversation messages leading up to the turn being evaluated, in chronological order.
- `output` (Span1Message, required) — The single turn to evaluate in the context of span.input, usually the assistant's reply.

### Span1Behavior

- `id` (string, required) — Your identifier for this behavior. It is echoed in the corresponding result so you can match scores to definitions.
- `definition` (string, required) — A plain-language description of the behavior to detect. State clearly whose behavior to judge and what to look for. Definitions shorter than 3 characters are rejected by the scorer.

### Span1ScoreRequestRespanParams

Optional Respan gateway parameters for logging and attribution. These are removed before the request reaches the scorer. See the Respan gateway parameters guide for other supported fields.

- `customer_identifier` (string, optional) — Your end-user or customer identifier for attributing this scoring call in Respan.
- `metadata` (map from string to any, optional) — Custom metadata attached to the scoring log.

### Span1BehaviorResult

Probabilities for one behavior. The three values sum to approximately 1; small differences may occur from rounding.

- `id` (string, required) — The id supplied for this behavior in the request.
- `p_present` (double, required) — Probability that the behavior is present in the supplied span.
- `p_absent` (double, required) — Probability that the behavior is absent from the supplied span.
- `p_not_observable` (double, required) — Probability that the span does not provide enough evidence to determine whether the behavior is present or absent.

### Span1ScoreResponseUsage

Token usage, when reported by the scorer. May be omitted if the scorer does not report token counts.

- `input_tokens` (integer, required) — Total input tokens for the span plus all behavior definitions. span-01-pro is billed on this count; for span-01-free it is informational. Output is free.

### Span1Message

A conversation message with a speaker role and text content.

- `role` (string, optional) — The speaker of this message, for example user or assistant.
- `content` (string, optional) — The text of the message to evaluate.

## Examples

**Request**

```json
{
  "span": {
    "input": [
      {
        "role": "user",
        "content": "This is the third time my order is late."
      }
    ],
    "output": {
      "role": "assistant",
      "content": "I am sorry, let me check on that for you."
    }
  },
  "behaviors": [
    {
      "id": "frustrated",
      "definition": "The user expresses frustration or anger."
    },
    {
      "id": "apology",
      "definition": "The assistant apologizes for a problem."
    }
  ],
  "model": "span-01-free",
  "respan_params": {
    "customer_identifier": "acme-1042"
  }
}
```

**Response**

```json
{
  "model": "span-01-free",
  "results": [
    {
      "id": "frustrated",
      "p_present": 0.4459707,
      "p_absent": 0.53500557,
      "p_not_observable": 0.019023689
    },
    {
      "id": "apology",
      "p_present": 0.9433637,
      "p_absent": 0.04003837,
      "p_not_observable": 0.016597953
    }
  ],
  "usage": {
    "input_tokens": 39
  }
}
```

**SDK Code**

```python Respan Models_scoreSpanBehaviors_example
import requests

url = "https://api.respan.ai/api/v1/scores"

payload = {
    "span": {
        "input": [
            {
                "role": "user",
                "content": "This is the third time my order is late."
            }
        ],
        "output": {
            "role": "assistant",
            "content": "I am sorry, let me check on that for you."
        }
    },
    "behaviors": [
        {
            "id": "frustrated",
            "definition": "The user expresses frustration or anger."
        },
        {
            "id": "apology",
            "definition": "The assistant apologizes for a problem."
        }
    ],
    "model": "span-01-free",
    "respan_params": { "customer_identifier": "acme-1042" }
}
headers = {
    "Authorization": "Bearer <respanApiKey>",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```javascript Respan Models_scoreSpanBehaviors_example
const url = 'https://api.respan.ai/api/v1/scores';
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <respanApiKey>', 'Content-Type': 'application/json'},
  body: '{"span":{"input":[{"role":"user","content":"This is the third time my order is late."}],"output":{"role":"assistant","content":"I am sorry, let me check on that for you."}},"behaviors":[{"id":"frustrated","definition":"The user expresses frustration or anger."},{"id":"apology","definition":"The assistant apologizes for a problem."}],"model":"span-01-free","respan_params":{"customer_identifier":"acme-1042"}}'
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

```go Respan Models_scoreSpanBehaviors_example
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://api.respan.ai/api/v1/scores"

	payload := strings.NewReader("{\n  \"span\": {\n    \"input\": [\n      {\n        \"role\": \"user\",\n        \"content\": \"This is the third time my order is late.\"\n      }\n    ],\n    \"output\": {\n      \"role\": \"assistant\",\n      \"content\": \"I am sorry, let me check on that for you.\"\n    }\n  },\n  \"behaviors\": [\n    {\n      \"id\": \"frustrated\",\n      \"definition\": \"The user expresses frustration or anger.\"\n    },\n    {\n      \"id\": \"apology\",\n      \"definition\": \"The assistant apologizes for a problem.\"\n    }\n  ],\n  \"model\": \"span-01-free\",\n  \"respan_params\": {\n    \"customer_identifier\": \"acme-1042\"\n  }\n}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Authorization", "Bearer <respanApiKey>")
	req.Header.Add("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby Respan Models_scoreSpanBehaviors_example
require 'uri'
require 'net/http'

url = URI("https://api.respan.ai/api/v1/scores")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <respanApiKey>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"span\": {\n    \"input\": [\n      {\n        \"role\": \"user\",\n        \"content\": \"This is the third time my order is late.\"\n      }\n    ],\n    \"output\": {\n      \"role\": \"assistant\",\n      \"content\": \"I am sorry, let me check on that for you.\"\n    }\n  },\n  \"behaviors\": [\n    {\n      \"id\": \"frustrated\",\n      \"definition\": \"The user expresses frustration or anger.\"\n    },\n    {\n      \"id\": \"apology\",\n      \"definition\": \"The assistant apologizes for a problem.\"\n    }\n  ],\n  \"model\": \"span-01-free\",\n  \"respan_params\": {\n    \"customer_identifier\": \"acme-1042\"\n  }\n}"

response = http.request(request)
puts response.read_body
```

```java Respan Models_scoreSpanBehaviors_example
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.respan.ai/api/v1/scores")
  .header("Authorization", "Bearer <respanApiKey>")
  .header("Content-Type", "application/json")
  .body("{\n  \"span\": {\n    \"input\": [\n      {\n        \"role\": \"user\",\n        \"content\": \"This is the third time my order is late.\"\n      }\n    ],\n    \"output\": {\n      \"role\": \"assistant\",\n      \"content\": \"I am sorry, let me check on that for you.\"\n    }\n  },\n  \"behaviors\": [\n    {\n      \"id\": \"frustrated\",\n      \"definition\": \"The user expresses frustration or anger.\"\n    },\n    {\n      \"id\": \"apology\",\n      \"definition\": \"The assistant apologizes for a problem.\"\n    }\n  ],\n  \"model\": \"span-01-free\",\n  \"respan_params\": {\n    \"customer_identifier\": \"acme-1042\"\n  }\n}")
  .asString();
```

```php Respan Models_scoreSpanBehaviors_example
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.respan.ai/api/v1/scores', [
  'body' => '{
  "span": {
    "input": [
      {
        "role": "user",
        "content": "This is the third time my order is late."
      }
    ],
    "output": {
      "role": "assistant",
      "content": "I am sorry, let me check on that for you."
    }
  },
  "behaviors": [
    {
      "id": "frustrated",
      "definition": "The user expresses frustration or anger."
    },
    {
      "id": "apology",
      "definition": "The assistant apologizes for a problem."
    }
  ],
  "model": "span-01-free",
  "respan_params": {
    "customer_identifier": "acme-1042"
  }
}',
  'headers' => [
    'Authorization' => 'Bearer <respanApiKey>',
    'Content-Type' => 'application/json',
  ],
]);

echo $response->getBody();
```

```csharp Respan Models_scoreSpanBehaviors_example
using RestSharp;

var client = new RestClient("https://api.respan.ai/api/v1/scores");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <respanApiKey>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"span\": {\n    \"input\": [\n      {\n        \"role\": \"user\",\n        \"content\": \"This is the third time my order is late.\"\n      }\n    ],\n    \"output\": {\n      \"role\": \"assistant\",\n      \"content\": \"I am sorry, let me check on that for you.\"\n    }\n  },\n  \"behaviors\": [\n    {\n      \"id\": \"frustrated\",\n      \"definition\": \"The user expresses frustration or anger.\"\n    },\n    {\n      \"id\": \"apology\",\n      \"definition\": \"The assistant apologizes for a problem.\"\n    }\n  ],\n  \"model\": \"span-01-free\",\n  \"respan_params\": {\n    \"customer_identifier\": \"acme-1042\"\n  }\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift Respan Models_scoreSpanBehaviors_example
import Foundation

let headers = [
  "Authorization": "Bearer <respanApiKey>",
  "Content-Type": "application/json"
]
let parameters = [
  "span": [
    "input": [
      [
        "role": "user",
        "content": "This is the third time my order is late."
      ]
    ],
    "output": [
      "role": "assistant",
      "content": "I am sorry, let me check on that for you."
    ]
  ],
  "behaviors": [
    [
      "id": "frustrated",
      "definition": "The user expresses frustration or anger."
    ],
    [
      "id": "apology",
      "definition": "The assistant apologizes for a problem."
    ]
  ],
  "model": "span-01-free",
  "respan_params": ["customer_identifier": "acme-1042"]
] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.respan.ai/api/v1/scores")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```
