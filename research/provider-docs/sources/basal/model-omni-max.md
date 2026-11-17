---
license: apache-2.0
language:
- pl
- en
base_model: Remek/basal-omni-1.0-max
library_name: transformers
pipeline_tag: text-generation
tags:
- typed-decisions
- decision-making
- classification
- extraction
- calibration
- polish
- gemma4
- experimental
---

# basal-omni-1.1-max (experimental task model)

[![GitHub](https://img.shields.io/badge/GitHub-rkinas%2Fbasal%20%E2%80%94%20inference%20engine-black?logo=github)](https://github.com/rkinas/basal)
[![Website](https://img.shields.io/badge/web-basal.si5.pl-0a7d5a)](https://basal.si5.pl/)

**basal-omni-1.1-max (12B)** is [basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max) with one short
round of extra training on three of the **task formats of basal 2.1**: `verify`, `compress` and `extract` (`classify`
was not trained; its results carry over). It is better at the tasks and slightly behind 1.0-max on general decisions, so **basal-omni-1.0-max stays the default
model**; use 1.1-max when the tasks are your main use, and check it on your own data.

Like every basal model it does not write text: it reads a *state* (a message, a document, retrieved passages, an agent
trace) and answers typed questions about it with a **calibrated probability for each allowed answer**, in one forward
pass. The tasks are built from those decisions by the engine (see [Tasks](#tasks)).

| | basal-omni-1.1-max | basal-omni-1.0-max |
|---|---|---|
| tasks (6 test sets, mean) | **85.1** | 83.5 |
| Werdykt v1 (general decisions, PL + EN) | 0.821 | **0.823** |
| EN external panel (10 public tasks) | 0.766 | **0.789** |
| recommended for | `classify`, `verify`, `compress`, `extract` | everything else (default) |

## Results

Both models served with the basal engine on one H100 (`--mode eager`, bf16, one option order), each with its own
calibration file, on the same items with the same clients.

### Tasks

Measured with basal-serve 2.1:

| task | set | n | 1.1-max | 1.0-max |
|---|---|---|---|---|
| classify | CLINC150 "plus" test: accuracy (151 labels, including out-of-scope) | 1,000 | **86.4%** | 85.4% |
| classify | BANKING77 test: accuracy (77 labels) | 1,000 | 74.0% | **74.6%** |
| verify | VitaminC (3-way): accuracy | 1,000 | **84.3%** | 80.3% |
| verify | RAGTruth, response vs source (binary): accuracy | 1,000 | **81.6%** | 80.3% |
| compress | QASPER paragraphs, keep 30% of the characters: needed paragraphs kept | 248 | **93.1%** | 90.1% |
| extract | synthetic PL / EN invoices, 12 fields: fields correct | 400 | **91.4%** | 90.1% |
| extract | documents in layouts never used in training: fields correct | 400 | **89.3%** | 84.8% |

- **What it saw in training:** the train splits of VitaminC and QASPER, and synthetic documents for `extract` from a
  different generator than the test invoices. CLINC150, BANKING77 and RAGTruth were not used in training, so those
  three rows are results on unseen datasets.
- **Overlap check:** 27 test items (12 VitaminC, 15 QASPER) share a 13-word span with training rows. Without them the
  gains are +4.2 points on VitaminC (paired 95% interval +2.1 to +6.2) and +2.7 on QASPER (+0.8 to +4.9); the mean of
  the six sets is still 85.1.
- **Whole documents:** all 12 invoice fields correct on 60.5% of invoices (1.0-max 52.5%); on the unseen layouts 38.8%
  of documents fully correct (1.0-max 22.8%).
- **Automation:** `automated` is certified for `classify` at a 5% target error: on a held-out labelled split, 38.5% of
  answers were automated, and 2.2% of those were wrong. No threshold could be certified for `classify` at 1% or for
  `verify`; there `automated` is `null`: review those answers, or fit `task_thresholds` on your own labelled data.

### General decisions

| benchmark | 1.1-max | 1.0-max |
|---|---|---|
| Werdykt v1, macro (hidden PL + EN, 10 categories × 2 languages) | 0.821 | 0.823 |
| PL decisions (held-out test of basal-1.0, 7,081 items) | 0.945 | 0.954 |
| PL general (knowledge, exams, reading; 3,079 items) | 0.803 | 0.810 |
| PL-Real (300 real Polish documents) | 0.980 | 0.980 |
| EN corpus test (1,479 items) | 0.721 | 0.724 |
| EN external panel (10 public English decision tasks, 3,842 items) | 0.766 | 0.789 |
| LEK, Polish medical exam (4,727) / English version (3,151) | 74.4 / 80.2 | 75.0 / 80.9 |
| Coverage at 1% error (calibration test, per question type) | 47.1% (0.77% error) | 47.4% (0.47% error) |

- **Werdykt v1:** 0.821 (95% interval 0.811–0.830; Polish 0.819, English 0.822), −0.2 points against 1.0-max, inside
  the interval. Served with `--deterministic`; on this model the default mode gave the same answer on 2,000 of 2,000
  items. Its probabilities are slightly better calibrated (ECE 0.051 vs 0.054), but it automates fewer decisions at
  the 1% target: 57.7% at 1.23% observed error (1.0-max 60.1% at 1.45%).
- **ContractNLI:** the largest loss, 0.583 against 0.720 (−13.7 points, paired 95% interval −19.3 to −7.7). On plain
  entailment choices 1.1-max too often picks "does not mention enough" (189 of 300 items, 1.0-max 117): the `verify`
  training made "not stated" more likely. For entailment questions outside `verify`, use 1.0-max.

## Quick start

**1. Install** into a fresh [uv](https://docs.astral.sh/uv/) environment:

```bash
uv venv --python 3.12 --allow-existing ~/basal-env && source ~/basal-env/bin/activate
uv pip install torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cu128
uv pip install "basal[media] @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"
```

**2. Start the server.** It prints `basal: model ... ready`:

```bash
basal-serve --model Remek/basal-omni-1.1-max --mode eager --media on --port 8000
```

The `eager` mode (PyTorch, bf16, about 24 GB of GPU memory), as for 1.0-max.

**3. Ask questions** (`choice`, `noul`, `score`, `multi`, `act`, `tool` and the tasks below), exactly as with
1.0-max. Full API: [API](https://github.com/rkinas/basal#api).

**Faster, text only: `--mode vllm`.** With vLLM 0.31.0 (its PyPI build needs NVIDIA driver 580 or newer), in its own
environment:

```bash
uv venv --python 3.12 --allow-existing ~/basal-vllm && source ~/basal-vllm/bin/activate
uv pip install vllm==0.31.0 "basal @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"
basal-serve --model Remek/basal-omni-1.1-max --mode vllm --max-len 16384 --gpu-memory 0.9 --port 8000
```

- On one H100 (`basal-loadtest`, 16 requests in flight, latency p50 / p95): one question per request 16.7 decisions/s,
  65 / 93 ms (eager: 4.77, 183 / 348 ms); 5 questions over one 3,000–10,000-token state 10.8 questions/s, 0.50 /
  0.90 s per request (eager: 0.72, 8.8 / 14.1 s).
- It uses `CALIBRATION.vllm.json`, fitted for this path. Against `--mode eager` it gives the same answer on 98.9% of
  our dev decisions (99.97% where eager's top answer leads by 0.2 or more), accuracy +0.1 point. It automates 47.0% of
  decisions at the 1% target (eager 47.1%) and 82.7% at the 5% target (eager 86.0%; the vLLM file's 5% thresholds are
  stricter).
- Text only (no `"media"`), one option order, and no `--deterministic`: vLLM batches requests its own way, so a
  decision near a tie can change with the load. One request at a time, basal 2.1 returns the same probabilities as
  2.0, bit for bit; with 32 requests in flight, vLLM's batching changes about 1% of top answers between any two runs.
  The tasks were measured in `--mode eager`.

## Tasks

basal 2.1 adds four task types on the same `POST /v1/basal` API (*experimental*: the API may change in a minor
release):
- **`classify`:** labels with a rubric each.
- **`verify`:** statements about the text; each one is supported, contradicted or not stated.
- **`compress`:** keeps the sentences, lines or paragraphs that a question needs.
- **`extract`:** fills the fields of a JSON schema, copied exactly from the text with character offsets.

Each task is expanded into the model's own decisions over one shared input, so every answer comes with calibrated
probabilities. Details: [TASKS.md](https://github.com/rkinas/basal/blob/v2.1.0/docs/TASKS.md).

```bash
curl -s localhost:8000/v1/basal -H 'content-type: application/json' -d '{
  "state": "I was charged twice for my card payment yesterday.",
  "questions": {"intent": {"type": "classify", "none": true, "labels": [
    {"name": "card_payment_duplicate", "rubric": "a card payment was taken more than once"},
    {"name": "card_lost", "rubric": "the card is lost or stolen"},
    {"name": "refund_status", "rubric": "asks about a refund in progress"}]}}}'
```

The answer (`answers.intent`, rounded to 4 places):

```json
{"type": "classify", "label": "card_payment_duplicate", "top_label": "card_payment_duplicate",
 "scores": {"card_payment_duplicate": 0.9995, "card_lost": 0.0002, "refund_status": 0.0000, "none": 0.0003},
 "confidence": 0.9995, "automated": {"0.01": null, "0.05": true}, "experimental": true}
```

`"0.05": true`: the confidence is above the threshold certified for `classify` at a 5% target error, so the answer
may be used without review at that rate.

## Images and audio

The same as [basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max#images-and-audio): with `--media on`,
images and audio go in `"media"` and every question type reads them, zero-shot (the extra training was text only).
Media answers were not re-measured for 1.1-max; `extract` does not read text fields from images yet.

## Speed

The same architecture as 1.0-max. On Werdykt's 5,000 items (16 concurrent clients, one H100, `--mode eager`): 4.12
decisions/s, 86 ms p50 / 1.40 s p95 (1.0-max: 4.17, 76 ms / 1.36 s). `classify` is one decision; the other tasks cost
one decision per claim (`verify`), unit (`compress`) or field (`extract`, in two packed rounds), all over one shared
state.

## Files

- `model.safetensors`, tokenizer, `chat_template.jinja`, `processor_config.json`: the model (Gemma 4 architecture,
  12B, 262k vocabulary; the image and audio encoders are included and unchanged).
- `CALIBRATION.json`: per-type temperatures and certified confidence thresholds for 1% / 5% error, fitted on the served
  engine (`--mode eager`, bf16, one option order), and `task_thresholds` (`classify` at 5%).
- `CALIBRATION.o2.json`: the same for `--orders 2`, without task thresholds (`automated` is `null` for tasks there).
- `CALIBRATION.vllm.json`: the same for `--mode vllm` (one option order), without task thresholds.
- `basal.json`: prompt format 2 and the readout protocol.
- `SHA256SUMS`: checksums of every file.

## Training

- **Start:** basal-omni-1.0-max (merged weights).
- **Method:** LoRA (rank 32) on the language-model layers, learning rate 2e-5, one epoch of 84,998 decisions (1,325
  steps of 64), merged into the weights. The vision and audio parts were not trained.
- **Data:** 39,998 task decisions in the engine's own task prompts (`extract` line and span choices on synthetic
  documents 28,000; claim verification from the VitaminC train split 7,945; paragraph relevance from the QASPER train
  split 4,053) and 45,000 decisions replayed from the same data as 1.0-max, against forgetting.
- **Calibration:** refitted for this model on the same calibration data and with the same checks as 1.0-max
  (per-type temperatures and certified thresholds); task thresholds fitted on separate labelled task splits (70% fit /
  30% certify).

## Limitations

- **Experimental**, and not the default: for general decisions basal-omni-1.0-max is slightly better (see Results).
- **Entailment outside `verify`:** ContractNLI −13.7 points; plain entailment choices lean to "not stated".
- **Automation:** fewer decisions automated at the 1% target than 1.0-max on Werdykt (57.7% vs 60.1%); for tasks, only
  `classify` at 5% has a certified threshold.
- **`extract`:** currency is the weakest invoice field (62.5%); no arrays of strings or objects (line items) yet; no
  text fields read from images.
- **Exact arithmetic and thresholds** are a weak spot of one-pass decisions: compute them in code.
- **Review:** decisions with serious consequences for people should be reviewed by a person.

## Citation

```bibtex
@software{kinas2026basal21,
  title   = {basal-2.1: typed-decision models and inference engine for Polish and English},
  author  = {Kinas, Remigiusz},
  year    = {2026},
  version = {2.1.0},
  url     = {https://github.com/rkinas/basal}
}

@techreport{kinas2026basal,
  title       = {basal-1.0: Reliable, Highly Optimized Typed Decisions for Polish},
  author      = {Kinas, Remigiusz},
  institution = {ai5},
  year        = {2026},
  type        = {Technical report},
  doi         = {10.5281/zenodo.23022986},
  url         = {https://doi.org/10.5281/zenodo.23022986}
}
```

## License and attribution

Apache-2.0. Fine-tuned from [Remek/basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max), itself
fine-tuned from [google/gemma-4-12B-it](https://huggingface.co/google/gemma-4-12B-it) (Apache-2.0).
