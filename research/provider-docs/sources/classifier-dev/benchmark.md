---
title: classifier.dev benchmark
description: Measured accuracy, calibration, cost and latency.
canonical: https://classifier.dev/benchmark
last-updated: 2026-09-22
---

# classifier.dev/benchmark

Every number here comes from a real run, and the cost column is what the providers actually billed. Measured 2026-09-17. The eval code is in the repository (eval/), so all of this is re-runnable.

## Against the model it runs on

The fast tier is Jev, TypeSafe's decision model. The smart tier is Jev plus a reasoning model re-asking only the answers Jev put under 0.7 confidence. So the question this service has to answer is whether it beats calling Jev yourself. Two public test sets, 400 items each, measured live over the public API with no key on 2026-09-18. "unsure" is accuracy on just the items Jev was unsure about — the only ones the smart tier touches.

```
                                        AG News             emotion
                                     all   unsure(49)    all  unsure(122)
-------------------------------------------------------------------------
jev alone = classifier.dev fast    87.5%        65.3%  61.8%        36.9%
classifier.dev smart               90.0%        83.7%  62.7%        41.8%
```

The fast tier is Jev, packed a thousand to a request, so the table shows one row for both. Measured separately it scored the same within noise (fast 87.3% vs 87.5%, 62.0% vs 61.8%), and every one of its 42 disagreements with Jev alone was on an item one side had already put under 0.7 confidence. The smart tier re-asked 43 / 126 of 400 items and took about 68 / 171 ms per item amortised. Calling Jev yourself costs about $0.005 / $0.004 per thousand and needs a TypeSafe key; this service costs nothing and needs none.

Read it with the noise in mind: on 400 items, a gap under about 5 points overall is not evidence, and the unsure columns rest on fewer items still. Re-run: npm run vs-jev (eval/vs_jev.py).

## Single label

Two public test sets, 400 items each. AG News is four-way topic; emotion is six-way and genuinely hard, because sadness, fear and anger blur.

```
model                              AG News   emotion   ms/item   $/1k
---------------------------------------------------------------------
jev-1.13 (classifier-fast)          87.7%     60.5%       2      0.005
qwen3.7-flash, reasoning            87.5%       *      3,445     0.040
ling-3.0-flash                      82.0%     57.0%     731      0.002
granite-4.0-h-micro (before)        63.2%     52.5%     594      0.002
```

The ms/item for jev is amortised: 400 items ride in one request that returns in about 650ms. The others are one call per item.

The last row is what this service was quietly serving until 2026-09-17. Its primary model had been delisted upstream, every request 404'd against it and fell through to granite, and nothing in the deployed numbers said so.

## Calibration

Accuracy by the confidence the model attached to its own answer.

```
                      n     accuracy          n     accuracy
confidence         AG News             emotion
---------------------------------------------------------------
[0.9, 1.0]        323      91.6%       200      82.0%
[0.7, 0.9)         27      85.2%        79      49.4%
[0.5, 0.7)         28      64.3%        52      36.5%
[0.0, 0.5)         22      63.6%        69      29.0%
```

For comparison, the previous model's logprob "confidence" put 348 of 400 news items at or above 0.9 and was right on 68% of them.

ESCALATION (the smart tier)

Only the items Jev put under 0.7 confidence are re-asked. What matters is how a second model does on exactly those, not overall.

```
                              emotion, 122 uncertain    news, 49 uncertain
model                          acc      -> whole set     acc    -> whole set
------------------------------------------------------------------------------
jev alone                     36.9%        61.8%        65.3%      87.5%
gemini-3.8-flash  (smart)     43.4%        63.7%        85.7%      90.0%
qwen3.8-flash                 36.1%        61.5%        79.6%      89.2%
qwen3.7-flash                 ~37%         61.0%        ~66%       87.7%
deepseek-v4-flash             36.9%        61.8%        34.7%      83.8%
mercury-2.5                   26.2%        58.5%        38.8%      84.3%
claude-fable-5.1              71.3%        72.3%        91.8%      90.7%
gpt-6-astra                   54.9%        67.2%        69.4%      88.0%
```

Most cheap models are no better than Jev on the cases Jev finds hard; the frontier models are, at about $2 per thousand escalations. The smart tier calls gemini-3.8-flash, the fast model that helped on both sets: about $0.70 per thousand escalated items, 2.3 seconds each.

## Multi label

Seven hand-written tasks, 12 to 50 labels each, 3 runs. Macro P/R/F1.

```
configuration                          P      R      F1     latency   $/1k
--------------------------------------------------------------------------
jev, one yes/no per label, >= 0.7    0.81   0.99   0.887     232ms   0.053
ling-3.0 sweep + second pass          0.90   0.74   0.799   1,538ms   0.008
mercury-2.5 sweep + second pass       0.92   0.72   0.797     945ms   0.038
granite-4.0 sweep + second pass       0.71   0.46   0.546   1,575ms   0.017
jev candidates re-judged by qwen3.7   0.43 (parse failures) 23,000ms
```

Read eval/README.md before quoting these: n=7, one annotator, no held-out split. Gaps of 0.03 are noise; the gaps above are not.

## Throughput

Twelve concurrent requests of 300 inputs each against the decision model: 3,600 classifications in 2.7 seconds wall clock, no throttling. A single request of 1,000 short inputs returns in about 1.5 seconds.

## Caveats

Public benchmarks are likely present in training data, so treat the accuracy figures as optimistic. Use them to rank the models; they will not predict what you see on your own task. The calibration table is the one to trust, because it says how much to believe a given answer.

If you want help measuring your own data, the offer of a call stands: https://cal.com/michaelsf/coffee

Built by @michael_chomsky — https://x.com/michael_chomsky
