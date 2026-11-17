> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Pricing

> Monthly plans, charged per token and per search.

Paid plans include their monthly price in usage; Free includes a small amount. Calls are charged at your plan's rates per input token, output token and search.

## Plans

Every plan includes every decision kind, [extraction](https://docs.levanto.ai/extract.md), [streaming](https://docs.levanto.ai/stream.md), [images](https://docs.levanto.ai/decision-model/images.md), [grounding](https://docs.levanto.ai/decision-model/grounding.md) and [reasoning](https://docs.levanto.ai/decision-model/reasoning.md).

Your plan and rates: [Billing page](https://platform.levanto.ai). Enterprise volume: [team@levanto.ai](mailto:team@levanto.ai).

## What counts

* **Input tokens**: everything Sage reads, including [images](https://docs.levanto.ai/decision-model/images.md). A decision reads its content once per question, once per tag in [Tags](https://docs.levanto.ai/decision-model/tags.md), and once per item in [Sort](https://docs.levanto.ai/decision-model/sort.md). A [stream](https://docs.levanto.ai/stream.md) counts only the text that's new since the last update, plus the questions.
* **Output tokens**: what Sage sends back from [extraction](https://docs.levanto.ai/extract.md) and [streaming](https://docs.levanto.ai/stream.md), plus thinking when Sage [reasons](https://docs.levanto.ai/decision-model/reasoning.md). A decision's answer is free.
* **Searches**: each [grounding](https://docs.levanto.ai/decision-model/grounding.md) search that runs.

Every response reports its tokens in `meta.usage` (a stream's decision frames, in `usage`). To count a decision before sending, post the same body to `POST /usage/estimate`. It returns a range when reasoning or search may run; images are not included.

Unused usage doesn't roll over. When it runs out, calls return **402** until the next period or an upgrade. No seats, no overage invoices.

## Spend less

* Send only the content a question needs.
* One [Choice](https://docs.levanto.ai/decision-model/choice.md) question often replaces several Yes/No questions.
* Leave [reasoning](https://docs.levanto.ai/decision-model/reasoning.md) off unless a question needs it.
* Ask only for the fields you need: extraction output grows with every field.
* In a stream, keep questions short: they count on every update.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.