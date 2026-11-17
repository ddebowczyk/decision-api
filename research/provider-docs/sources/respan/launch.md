[<- Blog](https://www.respan.ai/blog)

Model researchSep 24, 2026

# Span-01The first hyper-parallel reasoning classifierbuilt for unseen challenges

Behavior benchmarkOverall F1 ↑

Behaviors

User frustration

Laziness

Unsafe

Jailbreak

Win

Escalation

Refund

Respan

84.3

Span-01

OpenAI

81.5

GPT-6 Luna

TypeSafe

71.5

Jev 1.13.0

F1

True single-forward classification with extraordinary behavior detection across long production traces.

Span-01 brings frontier-level judgment to every trace without token-by-token generation. Span-01 Lite makes the same workflow completely free.

![Frank Chen](/llm-observability/frank-chen.png)

Frank ChenSeptember 24, 2026

[Playground ↓](https://www.respan.ai/blog/introducing-span-1#playground)[View quickstart ↗](https://www.respan.ai/docs/documentation/span-01/quickstart)

Jev proved that decision models can make classification fast and practical.

But can a classifier preserve frontier-level reasoning, generalize to unseen definitions, and carry that reasoning across long traces in one true forward pass?

Span-01 is built to reason over new natural-language definitions, then return direct probabilities across every definition in parallel.

[![Your browser does not support video playback.](/blog/respan-span-poster-no-size.jpg)](/blog/respan-span-web.mp4)

## Reason first. Classify once.

The difficult part of classification is not returning a label. It is applying a definition the model has never seen to context it has never encountered.

We train general classification reasoning with RLAIF before specializing Span-01 for behavior detection. Instead of memorizing a fixed taxonomy, it executes unseen behavior definitions across new behaviors and domains.

At inference, hyper-parallel definition branches evaluate multiple unseen behaviors over the same trace context. Hybrid attention is central to preserving that reasoning in long, complex traces.

**One true forward pass.** No token-by-token generation. Span-01 returns direct present, absent, and not\_observable probabilities.

## Frontier-level judgment.

The first test was whether a dedicated classifier could retain the judgment quality of frontier models. Across nine models and both English and multilingual behavior detection, Span-01 ranks first overall. Span-01 Lite also outperforms Jev and Sonnet 5.

Span-01

### Behavior benchmark

Overall F1

Pareto

### Quality vs. cost

Overall behavior F1 vs. normalized inference cost

Overall is the unweighted mean of English and multilingual F1. Raindrop uses macro F1 (n=61), normalized from $0.003/event at 1,000 tokens/event; the $299/month base fee is excluded.

[Browse the dataset ↗](https://huggingface.co/datasets/respanai/behavior-benchmark)

## Built for the behaviors production teams actually monitor.

Aggregate scores can hide the behaviors that matter in production. We separated safety, reliability, grounding, agent behavior, and response quality to see where the signal holds. Span-01 outperforms Jev and Sonnet 5 overall, while a full frontier model remains the strongest ceiling.

Span-01

### Production behavior benchmark

Behavior detection across safety, reliability, grounding, and quality

| Behavior domain | Span-01 | Jev | Sonnet 5 | GPT-6 Sol |
| --- | --- | --- | --- | --- |
| Jailbreak and prompt injection | 0.779 | 0.752 | 0.709 | 0.878 |
| Safety and refusals | 0.803 | 0.751 | 0.785 | 0.911 |
| Privacy and secrets | 1.000 | 0.948 | 0.901 | 0.935 |
| Hallucination and grounding | 0.796 | 0.673 | 0.756 | 0.903 |
| Agent and tool reliability | 0.845 | 0.691 | 0.677 | 0.861 |
| Task and instruction following | 0.702 | 0.671 | 0.621 | 0.821 |
| Response quality | 0.771 | 0.691 | 0.722 | 0.956 |
| Overall | 0.806 | 0.716 | 0.719 | 0.885 |

## Decision models judged by Span-01.

We then inverted the benchmark and used Span-01 as the evaluation layer for 11 emerging decision models across accuracy, consistency, injection resistance, and calibration.

Span-01 does not appear in this ranking. It produced the evaluation signal!

Span-01

### Decision models judged by Span-01

11 models across accuracy, consistency, injection resistance, and calibration

| Model | Accuracy ↑ | Paired flip rate | Injection ASR | ECE |
| --- | --- | --- | --- | --- |
| Jev 1.13.0 | 0.932 | 0.021 | 0.063 | 0.045 |
| Tev1 4B | 0.901 | 0.052 | 0.042 | 0.031 |
| Kev 4B | 0.833 | 0.060 | 0.078 | 0.070 |
| Decider 2B v10 | 0.747 | 0.128 | 0.208 | 0.074 |
| AlexWortega OpenJev 4B v5 | 0.744 | 0.116 | 0.089 | 0.118 |
| Bosun v3.1 1.7B | 0.680 | 0.208 | 0.323 | 0.089 |
| Tiny-Jev 0.6B | 0.646 | 0.128 | 0.224 | 0.267 |
| Laya | 0.542 | 0.298 | 0.396 | 0.092 |
| MoJev 0.85B | 0.501 | 0.150 | 0.307 | 0.129 |
| Open-Jev DeBERTa v3 large | 0.472 | 0.194 | 0.385 | 0.147 |
| Von 1.2 | 0.422 | 0.242 | 0.297 | 0.071 |

Paired flip rate measures consistency under equivalent variants. Injection ASR is attack success rate. ECE is expected calibration error.

Live comparison

## Try Span-01 against Jev.

Behavior to detectHuman supportUser frustrationCustom behavior…

User messageI have been missing my account benefits for two weeks. I already tried refreshing the app. Can you help resolve this?

Assistant reply (optional)As a valued customer, you are entitled to these benefits. I will escalate this matter to our backend team, and they will email you within five days. Thank you for your patience.

Compare live models ↗10 comparisons / IP / 10 min

Span-01

—

Jev

—

Classifier economics

## Judge every trace.

Model

Input

Output

Span-01 Lite

Free

Free

Span-01

$0.02 / 1M

Free

Public access

## Now it's time to get rid of LLM-as-a-judge.

Span-01 is public now. Follow the quickstart to run it on your own traces and behavior definitions.

[View Span-01 quickstart](https://www.respan.ai/docs/documentation/span-01/quickstart)
