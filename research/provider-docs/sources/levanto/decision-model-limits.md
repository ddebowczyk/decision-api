> ## Documentation Index
> Fetch the complete documentation index at: https://docs.levanto.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Limits and errors

> Size limits, status codes and error bodies.

## Counts

| Kind | Field | Min | Max |
| - | - | -: | -: |
| **choice** | `options` | 2 | 256 (20 with an image) |
| **scale** | `levels` | 2 | 26, distinct whole numbers |
| **sort** | `content.value` items | 2 | 120 |
| **tags** | `tags` | 1 | 120 |

## Request size

The whole request must fit your plan's context: about 32K tokens, or 128K with extended context (see [Pricing](https://docs.levanto.ai/pricing.md)). That counts content, instructions, options, rubric lines, list items, tags and search results.

Oversized requests fail; they are never truncated. Very long content can return 503 first, so stay well under the limit.

## Images

At most 4 MiB decoded, 8192 px on the longest edge, 4096² pixels in total. Remote URLs, Sort, list items and grounding are not supported. See [Images (beta)](https://docs.levanto.ai/decision-model/images.md).

## Reasoning

6 seconds and a length limit per answer. Hitting either is not an error; see [Reasoning](https://docs.levanto.ai/decision-model/reasoning.md).

## Extraction and streaming

See the limits on [Extraction](https://docs.levanto.ai/extract.md#usage-and-limits) and [Streaming decisions](https://docs.levanto.ai/stream.md#limits).

## Status codes

| Status | Meaning | Example body |
| - | - | - |
| `400` | Invalid request, or a limit above | `{"detail": "content: Field required"}` |
| `401` | Missing or invalid API key | `{"detail": "API key required. Provide a valid Levanto API key."}` |
| `402` | This period's included usage is used up | `{"detail": "This period's included usage is used up. Upgrade your plan at https://platform.levanto.ai or wait for the next period."}` |
| `413` | Extraction only: the document is too long. Split it | `{"detail": "content plus field definitions exceed 16384 tokens; split the content"}` |
| `503` | Loading or temporarily unavailable | `{"detail": "Service is still loading."}` |

Extraction can also return `429` when Sage is busy: retry after the seconds in the `Retry-After` header.

A `null` answer is a 200, not an error. Route it to a human; don't retry.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.