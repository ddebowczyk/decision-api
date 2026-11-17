> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Tags decisions

> A verdict per label: applies, doesn't apply, or null.

## Request

```json theme={"theme":"github-light"}
{
  "content": "Post in a musicians' forum: \"I run a small studio that helps indie artists grow — playlist pitching, monthly-listener growth. First month half price if you mention this post, DM me for case studies.\"",
  "question": {
    "kind": "tags",
    "id": "moderate",
    "instructions": "Tag the moderation issues in this post, under a policy that allows members to promote their own work once.",
    "tags": [
      {"id": "spam",          "name": "spam: unsolicited bulk or repetitive posting; a single genuine offer is not spam"},
      {"id": "promotion",     "name": "promotion: advertises the poster's own product or service"},
      {"id": "scam_or_fraud", "name": "scam_or_fraud: deceptive offer, fake results, or payment trickery"}
    ]
  }
}
```

## Response

```json theme={"theme":"github-light"}
{
  "id": "moderate",
  "kind": "tags",
  "result": {
    "tags": [
      {"id": "spam", "probability": 0.0, "applies": false},
      {"id": "promotion", "probability": 1.0, "applies": true},
      {"id": "scam_or_fraud", "probability": 0.0, "applies": false}
    ]
  },
  "meta": { "model": "levanto-sage-2", "latency_ms": 238.8 }
}
```

| Field | Description |
| - | - |
| `applies` | `true`, `false`, or `null` when too close to call |
| `probability` | Calibrated probability that the tag applies |

## Writing tags

* Write `instructions` as the rule for when a tag applies. Sage judges all tags together, against each other.
* Give each tag a `name`: a short label plus one line, like `"promotion: advertises the poster's own product or service"`. Sage reads the `name`; `id` is the key you get back.
* When two tags are easy to confuse, say what doesn't count: "a single genuine offer is not spam".
* With no `instructions`, Sage asks which tags apply. Braces need no escaping; a `{label}` or `{tag}` placeholder still works.

## Patterns

* `applies: null` means Sage isn't sure whether that tag applies. Don't read it as `false`: send the item to a person, or skip the action that depends on that tag.
* If the answer could be "none", ask a [Yes/No](https://docs.levanto.ai/decision-model/yesno.md) first ("Does this post break any rule?") and read tags only on yes.

`threshold` is deprecated and ignored. For a stricter bar, compare `probability` yourself.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.