# OpenAI / GPT-6 Luna Decisions

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

OpenAI documents a public-beta Decisions API at `POST https://api.openai.com/v1/decisions`, currently using model `gpt-6-luna`. The native interface is analogous to Jev, but not wire-compatible: it sends `input` and an ordered `questions` array, with `predicate`, `choice`, and `score` types. Predicates return `probability`; Choice uses an array of typed values/descriptions; Score uses `levels`. Answers are ordered, optionally named, and any question can return `type: refusal`.

The API reference documents 1–200 questions and up to 128 images. Input costs $0.10/M tokens, with no output or cache-read/write charges; regional and long-context multipliers can apply. OpenAI's speed comparison is a vendor claim, not a local benchmark.

Documentation conflict: the guide says images must be inline base64 and hosted URLs are unsupported; the API reference says publicly accessible HTTP(S) image URLs are allowed. Preserve this discrepancy rather than promise URL support. Use inline images for a conservative prototype until an authenticated probe resolves it.

OpenRouter lists `openai/gpt-6-luna-decisions` behind its normalized Decisions interface. That router model ID is distinct from the native `gpt-6-luna` identifier. A shared client needs an explicit native adapter, including refusal handling, not just a base URL change.

## Sources and local captures

- [Guide](https://developers.openai.com/api/docs/guides/decisions) · [local capture](../sources/openai/decisions-guide.md)
- [API reference](https://developers.openai.com/api/reference/python/resources/decisions/methods/create) · [local capture](../sources/openai/decisions-reference.md)
- [Router listing](https://openrouter.ai/openai/gpt-6-luna-decisions) · [local capture](../sources/openrouter/openai--gpt-6-luna-decisions.md)
