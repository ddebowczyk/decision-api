---
license: apache-2.0
language:
- pl
- en
base_model: speakleash/Bielik-PL-11B-v3.0-Instruct
library_name: transformers
pipeline_tag: text-generation
tags:
- typed-decisions
- decision-making
- classification
- calibration
- polish
---

# basal-2.0-max

[![GitHub](https://img.shields.io/badge/GitHub-rkinas%2Fbasal%20%E2%80%94%20inference%20engine-black?logo=github)](https://github.com/rkinas/basal)
[![Website](https://img.shields.io/badge/web-basal.si5.pl-0a7d5a)](https://basal.si5.pl/)
[![Collection](https://img.shields.io/badge/%F0%9F%A4%97-basal--2.0%20collection-yellow)](https://huggingface.co/collections/Remek/basal-20-6acd1712a8e443c86cd576fc)

**basal-2.0-max** is part of basal-2.0, a family of typed-decision models for Polish and English; it is the most accurate model of the family. Built on Bielik-PL-11B-v3.0-Instruct. Trained further from earlier basal checkpoints.

**What it is.** The model reads a *state* (a message, a document, retrieved passages, an agent trace, a web page as
JSON) and answers a typed question about it (`choice`, yes/no `noul`, `score`, `multi`, `act`, `tool`) by returning a
**calibrated probability for each allowed answer**, in one forward pass, without generating text. The answer never falls
outside the options you give, and the probability says how sure the model is. Because the classes are described in the
request, one model serves many tasks without retraining: routing, rule and policy checks, questions about long
documents, RAG decisions, urgency and risk scores, judging answers, agent and tool decisions, and triage with a
confidence threshold.

| model | params | use |
|---|---|---|
| [basal-2.0-mini](https://huggingface.co/Remek/basal-2.0-mini) | 1.5B | fastest |
| [basal-2.0 (4.5B)](https://huggingface.co/Remek/basal-2.0-4.5B) | 4.5B | main model; experimental thinking mode |
| [basal-2.0-max](https://huggingface.co/Remek/basal-2.0-max) | 11B | most accurate |

Each model also comes as `-FP8` (NVIDIA Hopper and Blackwell), `-GGUF` (Q8_0 and Q5_K_M; Ollama, llama.cpp) and `-MLX-8bit` (Apple Silicon).

## Intended use

- **Good for:** routing messages and documents to one of the options you describe; yes/no checks of rules and policies;
  urgency and risk scores; questions about long documents and retrieved passages (is the answer there, is it relevant);
  judging answers; choosing an agent's next action or tool (a `tool` question over OpenAI or MCP tool definitions picks the tool, not its arguments); triage that hands uncertain cases to a person (an `act`
  question with a defer action and `max_error`).
- **Languages:** Polish and English (the state and the question may be in either).
- **Not for:** writing text or chatting (the model only picks among the options you give); facts that are not in the
  state; decisions with serious consequences for people without human review.

## Quick start

**1. Install** the basal engine v2.0.0 into a fresh [uv](https://docs.astral.sh/uv/) environment (NVIDIA GPU; the cu128 torch
needs a driver for CUDA 12.8 or newer; DGX Spark and B300 use the cu130 build, see [docs/HARDWARE.md](https://github.com/rkinas/basal/blob/v2.0.0/docs/HARDWARE.md)):

```bash
uv venv --python 3.12 --allow-existing ~/basal-env && source ~/basal-env/bin/activate
uv pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cu128
uv pip install "basal[fp8] @ https://github.com/rkinas/basal/archive/refs/tags/v2.0.0.tar.gz"
```

**2. Start the server** and wait for `basal: model ... ready`:

```bash
basal-serve --model Remek/basal-2.0-max --mode fast --port 8000
```

**3. Ask questions** with curl. Several questions about one state go into one request and share the state:

```bash
curl -s localhost:8000/v1/systemone -H 'content-type: application/json' -d '{
  "state": "Klient: od wczoraj nie mogę zalogować się do bankowości internetowej, system pokazuje błąd hasła.",
  "questions": {
    "dept":   {"type": "choice", "instructions": "Do którego działu skierować zgłoszenie?",
               "criteria": {"cards": "Reklamacje kart", "online": "Wsparcie bankowości elektronicznej", "loans": "Kredyty"}},
    "urgent": {"type": "noul", "instructions": "Czy klient nie może korzystać z usługi?"}}}'
```

Each answer has a probability for every option, the chosen key and the confidence:
`"dept": {"type": "choice", "choice": "<key>", "probabilities": {"cards": p, "online": p, "loans": p}, "confidence": p}`.

To send uncertain decisions to a person, ask the same question as an `act` question with a defer action and
`"max_error": 0.05` (`max_error` works on `act` and `tool` questions only):

```bash
curl -s localhost:8000/v1/systemone -H 'content-type: application/json' -d '{
  "state": "Klient: od wczoraj nie mogę zalogować się do bankowości internetowej, system pokazuje błąd hasła.",
  "questions": {
    "dept": {"type": "act", "instructions": "Do którego działu skierować zgłoszenie?",
             "criteria": {"cards": "Reklamacje kart", "online": "Wsparcie bankowości elektronicznej", "loans": "Kredyty"},
             "option_keys": "hide", "costs": {"wrong": 19, "defer": 1}, "max_error": 0.05}}}'
```

The answer is the action with the lowest expected cost (an option key, or `defer`). Below the confidence threshold
certified for 5% error it returns `defer`, names the `refused` action and says `"deferred": true`. `"option_keys":
"hide"` shows the model the option descriptions only, as the calibration was fitted (with the keys shown, answers say
`"calibration": "unvalidated"`); keep the cost of a wrong answer moderate, because a large one defers by expected cost
alone, before `max_error` is applied.

**Or from Python** (the package includes a small client):

```python
from basal.client import Basal
b = Basal("http://127.0.0.1:8000")
state = "Klient: od wczoraj nie mogę zalogować się do bankowości internetowej, system pokazuje błąd hasła."
a = b.choice(state, "Do którego działu skierować zgłoszenie?",
             {"cards": "Reklamacje kart", "online": "Wsparcie bankowości elektronicznej", "loans": "Kredyty"})
print(a["choice"], a["confidence"])
print(b.yes_no(state, "Czy klient nie może korzystać z usługi?")["noul"])   # P(yes)
```

Many items from a file: `basal-run --input items.jsonl --output answers.jsonl`. API and features: [README](https://github.com/rkinas/basal#api).

The same basal engine v2.0.0 also serves the experimental basal-omni-1.0 models (images and audio): [README](https://github.com/rkinas/basal#images-and-audio-basal-omni-experimental).

## Results against basal-1.5

Measured once on the frozen release weights, bf16 (`basal-serve --mode fast`) on one H100, and published as measured, including where basal-2.0 is not better.

| benchmark | basal-1.5 | basal-2.0 | 2.0 - 1.5 | note |
|---|---|---|---|---|
| Werdykt v1, macro [95% CI] | 0.773 [0.762, 0.783] | 0.784 [0.774, 0.795] | +1.1 pt | hidden PL + EN benchmark, 5,000 decisions |
| Werdykt v1, PL / EN | 0.777 / 0.769 | 0.787 / 0.781 | +1.0 / +1.2 pt |  |
| Werdykt calibration error (ECE) | 0.074 | 0.044 | -0.030 | lower is better |
| Werdykt automated at 1% target error | 42.5% at 0.93% observed error | 35.3% at 1.34% observed error |  | share automated, error observed |
| Werdykt automated at 5% target error | 65.6% at 4.99% observed error | 65.6% at 4.51% observed error |  | share automated, error observed |
| Werdykt board rank | 34 | 31 | | of 94 systems on the public board |
| Werdykt speed pass, decisions/s at 16 clients (public board) | 10.2 (c1 p50 67 ms) | 16.2 (c1 p50 37 ms) | x1.6 | basal-1.5 on SGLang, basal-2.0 in basal-serve's default mode; bf16, one H100 80GB |
| Werdykt speed pass, both in basal-serve's default mode | 4.6 (c1 p50 45 ms) | 16.2 (c1 p50 37 ms) | x3.5 | basal-1.5 on its own basal-serve engine |
| Decision Index (JDI 0.2.1) | no index (partial run, 33,846 requests) | 44.07 |  | |
| JDI requests left unanswered | - | 0.00% (0 of 150,317) | | basal-1.5 answers questions with at most 10 options |
| LEK, Polish medical licensing exam, PL / EN (% correct) | 70.0 / 67.6 | 75.6 / 74.1 | +5.6 / +6.5 pt | 5 options |
| PL-Holdout (4,000 items) | 0.8680 | 0.8618 | -0.0063 [-0.0163, +0.0037] | paired |
| Polish decisions (7,081 items) | 0.9396 | 0.9377 | -0.0018 [-0.0075, +0.0037] | paired |
| Polish general (3,079 items; dev label) | 0.7970 | 0.8107 | +0.0136 [+0.0026, +0.0247] | paired |
| English corpus test (1,479 items; dev label) | 0.6613 | 0.6728 | +0.0115 [-0.0061, +0.0311] | paired |
| English panel (10 tasks; mean accuracy) | 0.7365 | 0.7185 | -0.0180 (items -0.0251 [-0.0397, -0.0102]) | mean of tasks; items paired |
| PL-Real-300, doc-clean subset (158 items; primary) | 0.9620 | 0.9747 | +0.0127 [-0.0127, +0.0380] | paired |
| PL-Real-300, all 300 items | 0.9700 | 0.9700 | +0.0000 [-0.0167, +0.0200] | paired |

basal-1.5 is basal-1.5-max, the previous release. **Werdykt** rows are the public board's rows (basal-1.5 served on SGLang, basal-2.0 by basal-serve v2.0.0 in its default mode), each release with its own calibration file, accuracy with `--deterministic`; *automated at X% target error* = a confidence threshold chosen on one half of the items for that error, applied to the other half. The speed pass is the board's (bf16, 16 clients, one H100 80GB; separate pods); the second speed row has basal-1.5 in basal-serve's default mode too. The rank is on the public Werdykt board ([basal.si5.pl/benchmark](https://basal.si5.pl/benchmark/)), 94 systems, one row per system. **All other rows:** both models served by engine v2.0.0 (commit adc4c71) on the same items; differences are paired, with 95% bootstrap intervals. Polish general and the English corpus test were used to choose between training runs, so their numbers are development numbers. LEK questions: NASK-PIB Reassess, 2008-2026 sessions (CC BY-NC-SA 4.0), shown for the basal models only, with no comparison to other systems.

## What is new since basal-1.5

- **Prompt format 2.** Up to 255 options per question (basal-1.5: 10), read in one forward pass with one option order
  by default (basal-1.5 read two orders).
- **Training.** Trained further from earlier basal checkpoints.
- **Calibration.** Temperatures per question type and option-count bucket, fitted on question families the model was
  not trained on.
- **Engine v2.0.0.** Compact batching (+19% decisions/s at 16 clients, +17% at 32, +8% at one client) and a prompt-template cache (+20% at 8 clients) (one H100, bf16, each change left out in turn). They need FlashAttention 3 (Hopper): the Werdykt rows on this card ran with FlashAttention 3; the release check, the port checks, the FP8 speed and the calibration ran with FlashAttention 2, without them. Engine v2.0.0 schedules long requests (over 2,048 tokens) behind short ones: in a mixed load at 32 clients short requests answer in 0.81 s instead of 1.38 s (p50), and long requests take about 7% longer (p50 1.96 s instead of 1.83 s); `--scheduler off` serves in arrival order.

## Ports

Every port is checked against this bf16 model on the development set dev v2: **agreement** is the share of decisions where the port picks the same option. Bars for this tier: agreement 2-10 >= 0.9552, agreement at reference margin >= 0.2 >= 0.9893, accuracy within 1 point, ECE at most +0.01.

| package | agreement with bf16 (options 2-10) | agreement at margin >= 0.2 | accuracy diff | ECE diff | size | speed | gate |
|---|---|---|---|---|---|---|---|
| [FP8](https://huggingface.co/Remek/basal-2.0-max-FP8) | 0.9704 | 0.9948 | +0.0005 | -0.0010 | 12 GB | 19.9 dec/s c16, c1 p50 50 ms (H100) | PASS |
| [GGUF Q8_0](https://huggingface.co/Remek/basal-2.0-max-GGUF) | 0.9925 | 0.9997 | +0.0002 | +0.0018 | 12 GB | not measured in this release | PASS |
| [GGUF Q5_K_M](https://huggingface.co/Remek/basal-2.0-max-GGUF) | 0.9766 | 0.9970 | -0.0001 | +0.0032 | 7.5 GB | not measured in this release | PASS |
| [MLX 8-bit](https://huggingface.co/Remek/basal-2.0-max-MLX-8bit) | 0.9933 | 0.9990 | +0.0017 | +0.0053 | 12 GB | 622 ms c1 p50, 1506 ms for 5 questions (Mac) | PASS |

## Calibration

For every question basal returns a probability for each answer; the confidence is the probability of the answer it picks.
The probabilities are calibrated (a temperature per question type and option-count bucket) on question families that
were never used for training, so they hold on new tasks but are cautious. Held-out numbers below are leave-one-family-out
on the development and test splits.

| basal-2.0-max, held-out | |
|---|---|
| calibration error (ECE) | 0.022 |
| worst question family (ECE) | 0.098 (agent) |
| automated at the 5% error threshold | 41.9% at 2.51% observed error |
| 1% error threshold, shipped file | defers every decision (no 1% threshold certified on the full fit) |

On Werdykt (hidden, measured once, not used to choose the model) the calibration error is 0.044 (basal-1.5: 0.074). The calibration is a file, separate from the weights (`CALIBRATION.json`, one
option order; `CALIBRATION.o2.json`, two orders), so you can swap it or refit it on your own data with `basal-calibrate`.
Fitted with engine v2.0.0 (commit adc4c71).

## Speed

One decision = one question, one option order. Hardware is named on every number.

- Werdykt speed pass (bf16, one H100 80GB): basal-2.0 16.2 decisions/s at 16 clients, c1 p50 37 ms (p95 344 ms) in basal-serve v2.0.0's default mode;
  basal-1.5 10.2 decisions/s at 16 clients, c1 p50 67 ms (p95 477 ms) on SGLang, as on the public board; in basal-serve's default mode basal-1.5 does 4.6 decisions/s at 16 clients, c1 p50 45 ms (p95 1343 ms).
  Separate pods of the same GPU type.
- FP8 package: 19.9 dec/s c16, c1 p50 50 ms (H100); one NVIDIA H100 80GB (cluster node), one option order.
- Measured setup: the Werdykt rows (accuracy and the speed pass) ran on the Werdykt pods with FlashAttention 3 installed, which the engine needs for compact rows and the template prefix (both engine defaults); the release check, the port checks, the FP8 speed and the calibration fits ran with FlashAttention 2, so compact rows and the template prefix were off there. FP8 keeps FlashAttention 2 unless `--attn fa3`.
- Accuracy rows use `--deterministic`; default minus `--deterministic` accuracy on dev v2: bf16 +0.0000, FP8 +0.0008 (run 1; 32 requests in flight); `--deterministic` itself: bf16 200/200 identical at 16 clients, FP8 200/200 identical at 16 clients.

**basal-1.5's other configuration.** basal-1.5 also shipped FP8 checkpoints served by vLLM. On one RunPod H100 (median of
3 fresh servers; synthetic ~1.6k-token states and a 400-request mix, a different workload from the Werdykt speed pass)
the two basal-1.5 configurations measured:

| basal-1.5 configuration | c1 p50 | decisions/s, 16 / 32 clients | mixed traffic, sequential / 32 clients (requests/s) | 16k-token state x 5 questions |
|---|---|---|---|---|
| bf16 on v1.5.0 | 101.6 ms | 9.3 / 9.6 | 1.2 / 1.2 | 35,357 ms |
| FP8 package on v1.5.0 vLLM | 81.4 ms | 19.5 / 20.8 | 11.3 / 45.3 | 597 ms |

basal-2.0 was not measured on that machine, so the speed-ups in the results table hold only against the basal-1.5 rows of the
Werdykt speed pass. For mixed traffic with long, repeated documents, measure both on your own load before you switch.

## Evaluation notes

- **Werdykt (hidden benchmark).** Every training file after basal-1.5 was checked against the Werdykt guard list (exact
  state, rare 13-word shingles, source documents) and builds fail on any hit. The earlier basal checkpoints this model continues started from Bielik-PL-11B-v3.0-Instruct without basal-1.5's training, so it does not inherit basal-1.5's exposure.
- **PL-Real-300.** Training rows of the basal checkpoints between basal-1.5 and basal-2.0 came from 27 of the PL-Real
  source judgments (their guard excluded PL-Real *states*, not the source *documents*); the 2.0 training files add 0.
  The primary PL-Real figure is therefore the **doc-clean subset** (158 items on the other judgments), for both models;
  the full 300 is shown next to it.
- **Selection sets.** Polish general and the English corpus test were used to choose between training runs, so their
  numbers are development numbers. PL-Holdout, PL-Real, LEK, JDI and Werdykt were not used to select basal-2.0.

## Files

- `model.safetensors`, tokenizer, `chat_template.jinja`: the model
- `CALIBRATION.json` (one option order) and `CALIBRATION.o2.json` (two orders): per-type temperatures and confidence thresholds for 1% / 5% error
- `basal.json`: prompt format 2 and readout protocol

## How it works

The model receives a fixed chat prompt with the state, the question and coded options; the decision is the softmax over the next-token logits of the option codes only (one forward pass, fp32 code logits, no text generation), then the per-type calibrated temperature from `CALIBRATION.json`. Confidence thresholds were chosen on calibration data, before testing, for 1% or 5% error among accepted decisions.

## Training

Fine-tuned from Bielik-PL-11B-v3.0-Instruct for typed decisions in Polish and English, trained further from earlier basal checkpoints. LoRA stages, merged.

## Limitations

- Validate on your own documents before relying on it: hidden and held-out sets do not cover every domain.
- Polish world knowledge of a small model is limited: put the relevant facts in the state. Legal rules change.
- Exact arithmetic and thresholds are a weak spot of one-pass decisions: compute them in code (or `"facts": "auto"`).
- The calibration is cautious on unseen tasks: no 1% threshold is certified in the shipped files, so `"max_error": 0.01`
  on an `act` or `tool` question defers every decision; use 0.05, or certify thresholds on your own data with `basal-calibrate`.
- `act` and `multi` over many labels are experimental. Up to 255 options per question (Ollama: 20); the context is
  32,768 tokens. The 2.0 models ship no evidence head.
- Decisions with serious consequences for people should be reviewed by a person.

## Citation

```bibtex
@software{kinas2026basal20,
  title   = {basal-2.0: typed-decision models and inference engine for Polish and English},
  author  = {Kinas, Remigiusz},
  year    = {2026},
  version = {2.0.0},
  url     = {https://github.com/rkinas/basal}
}
```

## License and attribution

Apache-2.0. Fine-tuned from [speakleash/Bielik-PL-11B-v3.0-Instruct](https://huggingface.co/speakleash/Bielik-PL-11B-v3.0-Instruct) (Apache-2.0). Bielik is a project of SpeakLeash and ACK Cyfronet AGH.
