> ## Documentation Index
> Fetch the complete documentation index at: https://docs.inceptionlabs.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a decision

> Evaluate named questions against a shared state with Mercury Decide. Supports binary probability (`noul`), categorical choice, and ordinal score questions. Returns answers and token usage. Streaming is not supported.

Images: put chat-style parts such as `{"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}` anywhere in `state` or a question's `instructions` (not in `criteria`). Images must be base64 PNG, JPEG, WebP, or GIF data URLs (remote URLs are not supported), at most 10 MiB each and 16 per upstream request. The complete JSON request, including base64 encoding, is also subject to the gateway's whole-request body limit (20 MiB by default).


## OpenAPI

````yaml https://api.inceptionlabs.ai/openapi.json post /v1/decisions
openapi: 3.1.0
info:
  title: Inception API
  version: 1.0.0
  description: >-
    Inception Labs LLM API — chat, FIM, and edit completions powered by Mercury
    diffusion language models. OpenAI-compatible request/response shapes with
    extensions for diffusion-specific features.
  contact:
    name: Inception Labs
    url: https://docs.inceptionlabs.ai
    email: support@inceptionlabs.ai
  license:
    name: Proprietary
  x-logo:
    url: https://docs.inceptionlabs.ai/logo.png
servers:
  - url: https://api.inceptionlabs.ai
    description: Production
security:
  - BearerAuth: []
tags:
  - name: Decisions
    description: Structured decisions with Mercury Decide.
  - name: Chat
    description: Chat completion endpoints (OpenAI-compatible).
  - name: FIM
    description: Fill-in-the-middle code completion endpoints.
  - name: Edit
    description: Code edit completion endpoints.
  - name: Models
    description: List available models.
paths:
  /v1/decisions:
    post:
      tags:
        - Decisions
      summary: Create a decision
      description: >-
        Evaluate named questions against a shared state with Mercury Decide.
        Supports binary probability (`noul`), categorical choice, and ordinal
        score questions. Returns answers and token usage. Streaming is not
        supported.


        Images: put chat-style parts such as `{"type": "image_url", "image_url":
        {"url": "data:image/png;base64,..."}}` anywhere in `state` or a
        question's `instructions` (not in `criteria`). Images must be base64
        PNG, JPEG, WebP, or GIF data URLs (remote URLs are not supported), at
        most 10 MiB each and 16 per upstream request. The complete JSON request,
        including base64 encoding, is also subject to the gateway's
        whole-request body limit (20 MiB by default).
      operationId: createDecision
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DecisionRequest'
            example:
              model: mercury-decide
              state:
                message: Please refund the duplicate charge on my account.
              questions:
                billing:
                  type: noul
                  instructions: Is this request about billing?
                team:
                  type: choice
                  criteria:
                    billing: Payments, charges, and refunds
                    support: Technical support and other requests
                urgency:
                  type: score
                  instructions: How urgent is this request?
                  criteria:
                    - Can wait
                    - Needs attention soon
                    - Needs immediate attention
        required: true
      responses:
        '200':
          description: Successful Response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionResponse'
              example:
                model: mercury-decide
                answers:
                  billing:
                    type: noul
                    noul: 0.97
                  team:
                    type: choice
                    choice: billing
                    probabilities:
                      billing: 0.96
                      support: 0.04
                    confidence: 0.96
                  urgency:
                    type: score
                    score: 1.1
                    legend:
                      '0': Can wait
                      '1': Needs attention soon
                      '2': Needs immediate attention
                    probabilities:
                      '0': 0.1
                      '1': 0.7
                      '2': 0.2
                    confidence: 0.7
                usage:
                  input_tokens: 120
                  output_tokens: 3
        '401':
          description: Unauthorized — missing or invalid API key.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError401'
              example:
                error:
                  message: Incorrect API key provided
                  type: authentication_error
                  param: null
                  code: invalid_api_key
        '402':
          description: Payment Required — billing inactive or quota exceeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError402'
              example:
                error:
                  code: account_error
                  type: invalid_request_error
                  message: Account access is unavailable.
        '404':
          description: Not Found — model not available for this account.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError404'
              example:
                error:
                  code: model_not_found
                  type: invalid_request_error
                  message: Decision model not found.
        '413':
          description: Payload Too Large — decision request body exceeds the size limit.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError413'
              example:
                error:
                  code: request_too_large
                  type: invalid_request_error
                  message: Request body is too large.
        '422':
          description: Unprocessable Entity — invalid decision request.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError422'
              examples:
                validation:
                  summary: Invalid request
                  value:
                    detail:
                      - loc:
                          - body
                          - questions
                        msg: Field required
                        type: missing
                upstream:
                  summary: Service validation error
                  value:
                    error:
                      code: upstream_error
                      type: invalid_request_error
                      message: Decision service could not complete the request.
        '429':
          description: Too Many Requests — rate limit exceeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError429'
              example:
                error:
                  code: rate_limit_exceeded
                  type: rate_limit_error
                  message: Request or spending limit exceeded.
        '500':
          description: Internal Server Error.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError500'
              example:
                error:
                  message: Internal server error
                  type: server_error
                  param: null
                  code: server_error
        '502':
          description: Bad Gateway — invalid response from the decision service.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError502'
              example:
                error:
                  code: upstream_error
                  type: server_error
                  message: Decision service returned an invalid response.
        '503':
          description: Service Unavailable — decision service is unavailable.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError503'
              example:
                error:
                  code: upstream_error
                  type: server_error
                  message: Decision service could not complete the request.
        '504':
          description: Gateway Timeout — decision service timed out.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionError504'
              example:
                error:
                  code: upstream_timeout
                  type: server_error
                  message: Decision service timed out.
      security:
        - BearerAuth: []
      x-codeSamples:
        - lang: bash
          label: cURL
          source: >
            curl https://api.inceptionlabs.ai/v1/decisions -H "Authorization:
            Bearer $INCEPTION_API_KEY" -H "Content-Type: application/json" -d '{
              "model": "mercury-decide",
              "state": {
                "message": "Please refund the duplicate charge on my account."
              },
              "questions": {
                "billing": {
                  "type": "noul",
                  "instructions": "Is this request about billing?"
                },
                "team": {
                  "type": "choice",
                  "criteria": {
                    "billing": "Payments, charges, and refunds",
                    "support": "Technical support and other requests"
                  }
                },
                "urgency": {
                  "type": "score",
                  "instructions": "How urgent is this request?",
                  "criteria": [
                    "Can wait",
                    "Needs attention soon",
                    "Needs immediate attention"
                  ]
                }
              }
            }'
        - lang: python
          label: Python
          source: >
            import json

            import os

            import urllib.request


            payload = {
                "model": "mercury-decide",
                "state": {
                    "message": "Please refund the duplicate charge on my account."
                },
                "questions": {
                    "billing": {
                        "type": "noul",
                        "instructions": "Is this request about billing?"
                    },
                    "team": {
                        "type": "choice",
                        "criteria": {
                            "billing": "Payments, charges, and refunds",
                            "support": "Technical support and other requests"
                        }
                    },
                    "urgency": {
                        "type": "score",
                        "instructions": "How urgent is this request?",
                        "criteria": [
                            "Can wait",
                            "Needs attention soon",
                            "Needs immediate attention"
                        ]
                    }
                }
            }

            request =
            urllib.request.Request('https://api.inceptionlabs.ai/v1/decisions',
                data=json.dumps(payload).encode(),
                headers={"Authorization": f"Bearer {os.environ['INCEPTION_API_KEY']}",
                         "Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(request, timeout=60) as response:
                print(json.load(response)["answers"])
        - lang: typescript
          label: TypeScript
          source: >
            const response = await
            fetch('https://api.inceptionlabs.ai/v1/decisions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.INCEPTION_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
              "model": "mercury-decide",
              "state": {
                "message": "Please refund the duplicate charge on my account."
              },
              "questions": {
                "billing": {
                  "type": "noul",
                  "instructions": "Is this request about billing?"
                },
                "team": {
                  "type": "choice",
                  "criteria": {
                    "billing": "Payments, charges, and refunds",
                    "support": "Technical support and other requests"
                  }
                },
                "urgency": {
                  "type": "score",
                  "instructions": "How urgent is this request?",
                  "criteria": [
                    "Can wait",
                    "Needs attention soon",
                    "Needs immediate attention"
                  ]
                }
              }
            }),

            });

            if (!response.ok) throw new Error(await response.text());

            console.log((await response.json()).answers);
components:
  schemas:
    DecisionRequest:
      properties:
        model:
          type: string
          minLength: 1
          title: Model
          example: mercury-decide
        state:
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
          title: State
          example:
            message: Please refund the duplicate charge on my account.
        questions:
          additionalProperties:
            oneOf:
              - $ref: '#/components/schemas/NoulQuestion'
              - $ref: '#/components/schemas/ChoiceQuestion'
              - $ref: '#/components/schemas/ScoreQuestion'
            discriminator:
              propertyName: type
              mapping:
                choice: '#/components/schemas/ChoiceQuestion'
                noul: '#/components/schemas/NoulQuestion'
                score: '#/components/schemas/ScoreQuestion'
          type: object
          minProperties: 1
          title: Questions
          example:
            billing:
              type: noul
              instructions: Is this request about billing?
            team:
              type: choice
              criteria:
                billing: Payments, charges, and refunds
                support: Technical support and other requests
            urgency:
              type: score
              instructions: How urgent is this request?
              criteria:
                - Can wait
                - Needs attention soon
                - Needs immediate attention
      type: object
      required:
        - model
        - state
        - questions
      title: DecisionRequest
      example:
        model: mercury-decide
        state:
          message: Please refund the duplicate charge on my account.
        questions:
          billing:
            type: noul
            instructions: Is this request about billing?
          team:
            type: choice
            criteria:
              billing: Payments, charges, and refunds
              support: Technical support and other requests
          urgency:
            type: score
            instructions: How urgent is this request?
            criteria:
              - Can wait
              - Needs attention soon
              - Needs immediate attention
    DecisionResponse:
      properties:
        model:
          type: string
          minLength: 1
          title: Model
        answers:
          additionalProperties:
            oneOf:
              - $ref: '#/components/schemas/NoulAnswer'
              - $ref: '#/components/schemas/ChoiceAnswer'
              - $ref: '#/components/schemas/ScoreAnswer'
            discriminator:
              propertyName: type
              mapping:
                choice: '#/components/schemas/ChoiceAnswer'
                noul: '#/components/schemas/NoulAnswer'
                score: '#/components/schemas/ScoreAnswer'
          type: object
          minProperties: 1
          title: Answers
        usage:
          $ref: '#/components/schemas/DecisionUsage'
      additionalProperties: false
      type: object
      required:
        - model
        - answers
        - usage
      title: DecisionResponse
      example:
        model: mercury-decide
        answers:
          billing:
            type: noul
            noul: 0.97
          team:
            type: choice
            choice: billing
            probabilities:
              billing: 0.96
              support: 0.04
            confidence: 0.96
          urgency:
            type: score
            score: 1.1
            legend:
              '0': Can wait
              '1': Needs attention soon
              '2': Needs immediate attention
            probabilities:
              '0': 0.1
              '1': 0.7
              '2': 0.2
            confidence: 0.7
        usage:
          input_tokens: 120
          output_tokens: 3
    DecisionError401:
      type: object
      title: DecisionError401
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          message: Incorrect API key provided
          type: authentication_error
          param: null
          code: invalid_api_key
    DecisionError402:
      type: object
      title: DecisionError402
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: account_error
          type: invalid_request_error
          message: Account access is unavailable.
    DecisionError404:
      type: object
      title: DecisionError404
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: model_not_found
          type: invalid_request_error
          message: Decision model not found.
    DecisionError413:
      type: object
      title: DecisionError413
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: request_too_large
          type: invalid_request_error
          message: Request body is too large.
    DecisionError422:
      title: DecisionError422
      anyOf:
        - $ref: '#/components/schemas/HTTPValidationError'
        - $ref: '#/components/schemas/DecisionUpstreamValidationError'
      example:
        detail:
          - loc:
              - body
              - questions
            msg: Field required
            type: missing
    DecisionError429:
      type: object
      title: DecisionError429
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: rate_limit_exceeded
          type: rate_limit_error
          message: Request or spending limit exceeded.
    DecisionError500:
      type: object
      title: DecisionError500
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          message: Internal server error
          type: server_error
          param: null
          code: server_error
    DecisionError502:
      type: object
      title: DecisionError502
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: upstream_error
          type: server_error
          message: Decision service returned an invalid response.
    DecisionError503:
      type: object
      title: DecisionError503
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: upstream_error
          type: server_error
          message: Decision service could not complete the request.
    DecisionError504:
      type: object
      title: DecisionError504
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: upstream_timeout
          type: server_error
          message: Decision service timed out.
    JsonValue:
      required: []
    NoulQuestion:
      properties:
        type:
          type: string
          const: noul
          title: Type
        instructions:
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
            - type: 'null'
          title: Instructions
        criteria:
          anyOf:
            - $ref: '#/components/schemas/NoulCriteria'
            - type: 'null'
      type: object
      required:
        - type
      title: NoulQuestion
    ChoiceQuestion:
      properties:
        type:
          type: string
          const: choice
          title: Type
        instructions:
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
            - type: 'null'
          title: Instructions
        criteria:
          additionalProperties:
            anyOf:
              - type: string
              - additionalProperties:
                  $ref: '#/components/schemas/JsonValue'
                type: object
              - items:
                  $ref: '#/components/schemas/JsonValue'
                type: array
              - type: 'null'
          type: object
          maxProperties: 255
          minProperties: 1
          title: Criteria
      type: object
      required:
        - type
        - criteria
      title: ChoiceQuestion
    ScoreQuestion:
      properties:
        type:
          type: string
          const: score
          title: Type
        instructions:
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
            - type: 'null'
          title: Instructions
        criteria:
          items:
            anyOf:
              - type: string
              - additionalProperties:
                  $ref: '#/components/schemas/JsonValue'
                type: object
              - items:
                  $ref: '#/components/schemas/JsonValue'
                type: array
          type: array
          maxItems: 10
          minItems: 1
          title: Criteria
      type: object
      required:
        - type
        - criteria
      title: ScoreQuestion
    NoulAnswer:
      properties:
        type:
          type: string
          const: noul
          title: Type
        noul:
          type: number
          maximum: 1
          minimum: 0
          title: Noul
      additionalProperties: false
      type: object
      required:
        - type
        - noul
      title: NoulAnswer
    ChoiceAnswer:
      properties:
        type:
          type: string
          const: choice
          title: Type
        choice:
          type: string
          title: Choice
        probabilities:
          additionalProperties:
            type: number
            maximum: 1
            minimum: 0
          type: object
          title: Probabilities
        confidence:
          type: number
          maximum: 1
          minimum: 0
          title: Confidence
      additionalProperties: false
      type: object
      required:
        - type
        - choice
        - probabilities
        - confidence
      title: ChoiceAnswer
    ScoreAnswer:
      properties:
        type:
          type: string
          const: score
          title: Type
        score:
          type: number
          minimum: 0
          title: Score
        legend:
          additionalProperties:
            anyOf:
              - type: string
              - additionalProperties:
                  $ref: '#/components/schemas/JsonValue'
                type: object
              - items:
                  $ref: '#/components/schemas/JsonValue'
                type: array
          type: object
          title: Legend
        probabilities:
          additionalProperties:
            type: number
            maximum: 1
            minimum: 0
          type: object
          title: Probabilities
        confidence:
          type: number
          maximum: 1
          minimum: 0
          title: Confidence
      additionalProperties: false
      type: object
      required:
        - type
        - score
        - legend
        - probabilities
        - confidence
      title: ScoreAnswer
    DecisionUsage:
      properties:
        input_tokens:
          type: integer
          minimum: 0
          title: Input Tokens
        output_tokens:
          type: integer
          minimum: 0
          title: Output Tokens
      additionalProperties: false
      type: object
      required:
        - input_tokens
        - output_tokens
      title: DecisionUsage
    ErrorObject:
      type: object
      title: ErrorObject
      required:
        - message
        - type
      properties:
        message:
          type: string
          description: Human-readable error message.
        type:
          type: string
          description: Error category, e.g. `invalid_request_error`, `rate_limit_error`.
        param:
          type:
            - string
            - 'null'
          description: Offending parameter, if applicable.
        code:
          type:
            - string
            - 'null'
          description: Machine-readable error code.
    HTTPValidationError:
      properties:
        detail:
          items:
            $ref: '#/components/schemas/ValidationError'
          type: array
          title: Detail
      type: object
      title: HTTPValidationError
      required: []
    DecisionUpstreamValidationError:
      type: object
      title: DecisionUpstreamValidationError
      required:
        - error
      properties:
        error:
          $ref: '#/components/schemas/ErrorObject'
      example:
        error:
          code: upstream_error
          type: invalid_request_error
          message: Decision service could not complete the request.
    NoulCriteria:
      properties:
        'true':
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
            - type: 'null'
          title: 'True'
        'false':
          anyOf:
            - type: string
            - additionalProperties:
                $ref: '#/components/schemas/JsonValue'
              type: object
            - items:
                $ref: '#/components/schemas/JsonValue'
              type: array
            - type: 'null'
          title: 'False'
      type: object
      title: NoulCriteria
      required: []
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
        msg:
          type: string
          title: Message
        type:
          type: string
          title: Error Type
        input:
          title: Input
        ctx:
          type: object
          title: Context
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      description: >-
        API key provided as a Bearer token: `Authorization: Bearer <api_key>`.
        Get an API key at https://platform.inceptionlabs.ai.

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
