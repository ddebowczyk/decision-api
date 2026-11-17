> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Extraction

> Words in, data out: typed values, where each was found, and how likely it is.

Send text and say what to find. Sage returns typed values, the exact text each came from, and a probability. A field that isn't in the text comes back `null`.

## Extract fields

```bash theme={"theme":"github-light"}
curl -s https://sage.levanto.ai/v1/extract \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "content": "INVOICE 2026-117\nNordlicht GmbH, Hafenstrasse 4, Hamburg\nBill to: Acme Ltd\n\n2 x Espresso machine service: 480.00 EUR\n1 x Descaling kit: 60.00 EUR\nTotal due: 540.00 EUR\nDue date: 21 November 2026",
  "extract": {
    "vendor": "the company issuing the invoice",
    "total": {"type": "money", "definition": "the amount payable"},
    "due_date": {"type": "date"},
    "products": ["a product or service billed"]
  }
}'
```

`values` is your request, filled in:

```json theme={"theme":"github-light"}
{
  "values": {
    "vendor": "Nordlicht GmbH",
    "total": {"amount": 540.0, "currency": "EUR"},
    "due_date": "2026-11-21",
    "products": ["Espresso machine service", "Descaling kit"]
  },
  "results": { ... },
  "meta": {
    "model": "levanto-sage-2",
    "mode": "fast",
    "usage": {"input_tokens": 265, "output_tokens": 440},
    "latency_ms": 127.3
  }
}
```

`results` has the same keys. Each says where the value was found (`text`, and `start`/`end` as character offsets into `content`) and how likely it is:

```json theme={"theme":"github-light"}
"total": {
  "value": {"amount": 540.0, "currency": "EUR"},
  "text": "540.00 EUR",
  "start": 157,
  "end": 167,
  "probability": 0.9863,
  "probabilities": [
    {"value": {"amount": 540.0, "currency": "EUR"}, "text": "540.00 EUR", "start": 157, "end": 167, "probability": 0.9863},
    {"value": null, "probability": 0.0137}
  ]
}
```

`probabilities` lists every candidate, then `null` (not in the text). They sum to 1, so you can set your own bar.

## Say what to find

The shape of `extract` is the shape of the answer.

| `extract` | You get |
| - | - |
| `{"vendor": "the company issuing the invoice"}` | One text value per field |
| `{"city": ""}` | The same, when the name says it all |
| `{"total": {"type": "money"}}` | One typed value |
| `{"products": ["a product or service billed"]}` | Every mention, in order |
| `"What is the penalty for late delivery?"` | One answer |
| `["What dietary needs are mentioned?"]` | Every answer |

A question works as a field name too: `{"What's the amount of the invoice?": ""}`.

```bash theme={"theme":"github-light"}
curl -s https://sage.levanto.ai/v1/extract \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "content": "Book a table for four at eight tonight. My partner is vegetarian and I cannot eat nuts.",
  "extract": ["What dietary needs are mentioned?"]
}'
```

```json theme={"theme":"github-light"}
{
  "values": ["vegetarian", "cannot eat nuts"],
  "results": {
    "values": [
      {"value": "vegetarian", "text": "vegetarian", "start": 54, "end": 64, "probability": 0.983},
      {"value": "cannot eat nuts", "text": "cannot eat nuts", "start": 71, "end": 86, "probability": 0.8496}
    ]
  },
  "meta": { ... }
}
```

## Types

Set `type` to get a value your code can use directly. Without it, you get the text as written.

| Type | Text | Value |
| - | - | - |
| `text` | `Nordlicht GmbH` | `"Nordlicht GmbH"` |
| `integer` | `12,000 sq ft` | `12000` |
| `decimal` | `19 % USt` | `19` |
| `money` | `1.930,78 €` | `{"amount": 1930.78, "currency": "EUR"}` |
| `date` | `21 November 2026` | `"2026-11-21"` |
| `time` | `14:00 CET` | `"14:00+01:00"` |
| `duration` | `three (3) years` | `"P3Y"` |

Values come only from what the text states: no relative dates, no missing years filled in, no unit or currency conversion. `currency` is `null` when the text names none. Units are dropped; ask for `text` to keep them.

## Not found, not sure

| Case | `value` | `probability` |
| - | - | - |
| Found | the value | how likely it is |
| Not in the text | `null` | how likely it is absent |
| Too close to call | `null` | `null` |

When the text has candidates but none reads as the type, the result also carries `parse_error`, saying what it found.

## Many documents

`POST /v1/extract/batch` takes up to 64 `contents` and one `extract` for all of them. `results` follows the order of `contents`.

```bash theme={"theme":"github-light"}
curl -s https://sage.levanto.ai/v1/extract/batch \
  -H "Authorization: Bearer $SAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "contents": [
    "Two oat lattes and a croissant, pickup at 8:15 for Dana.",
    "One flat white for Marco, pickup at 9:30.",
    "Is the café open on Sunday?"
  ],
  "extract": {
    "customer": "the name of the customer",
    "pickup_time": {"type": "time"},
    "items": ["an item ordered"]
  }
}'
```

```json theme={"theme":"github-light"}
{
  "results": [
    {"ok": true, "values": {"customer": "Dana", "pickup_time": "08:15", "items": ["Two oat lattes", "a croissant"]}, "results": { ... }, "error": null},
    {"ok": true, "values": {"customer": "Marco", "pickup_time": "09:30", "items": ["One flat white"]}, "results": { ... }, "error": null},
    {"ok": true, "values": {"customer": null, "pickup_time": null, "items": []}, "results": { ... }, "error": null}
  ],
  "meta": {"model": "levanto-sage-2", "mode": "fast", "usage": {"input_tokens": 581, "output_tokens": 628}, "latency_ms": 215.4}
}
```

A document that fails (for example, too long) comes back as `{"ok": false, "error": "..."}`. The rest still answer, and the failed one isn't charged.

## Usage and limits

`meta.usage.input_tokens` counts what Sage reads for each document: your content, field names and definitions. `output_tokens` is the size of the response. Ask only for the fields you need.

* Up to 64 fields per request, 64 documents per batch.
* Field names and questions: up to 256 characters, no double quotes or line breaks, unique ignoring case (`_` counts as a space).
* Definitions: up to 4,000 characters.
* Content plus definitions: up to 16,384 tokens. Longer returns **413**: split the document.

See [Limits and errors](https://docs.levanto.ai/decision-model/limits.md) for status codes.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.