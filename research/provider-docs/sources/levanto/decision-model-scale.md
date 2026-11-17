> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Scale decisions

> Score content against your own rubric.

Write your own rubric: 2 to 26 levels, each a distinct whole number (for example `0`–`4` or `1`–`5`), with a description of what it means.

## Request

```json theme={"theme":"github-light"}
{
  "content": "Candidate explained our product roadmap clearly but struggled to answer questions about database scaling tradeoffs.",
  "question": {
    "id": "interview_score",
    "kind": "scale",
    "instructions": "How strong was this candidate in the technical interview?",
    "levels": [
      {"level": 0, "description": "Not qualified — fundamental gaps in required skills"},
      {"level": 1, "description": "Weak — significant concerns about core competencies"},
      {"level": 2, "description": "Mixed — some strengths but notable gaps remain"},
      {"level": 3, "description": "Solid — meets the bar with minor areas to probe"},
      {"level": 4, "description": "Strong hire — clearly exceeds expectations for the role"}
    ]
  }
}
```

## Response

```json theme={"theme":"github-light"}
{
  "id": "interview_score",
  "kind": "scale",
  "result": {
    "expectation": 1.98,
    "confidence": 0.74,
    "probabilities": [
      {"level": 0, "probability": 0.0},
      {"level": 1, "probability": 0.05},
      {"level": 2, "probability": 0.9},
      {"level": 3, "probability": 0.05},
      {"level": 4, "probability": 0.0}
    ]
  },
  "meta": { "model": "levanto-sage-2", "latency_ms": 164.2 }
}
```

| Field | Description |
| - | - |
| `expectation` | Expected level, in your levels' units |
| `confidence` | How sure Sage is of the score, separate from the score itself |
| `probabilities` | Each level's probability, in request order. They sum to 1 |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.