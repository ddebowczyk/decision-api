NEW

**Saturday 17 Oct, 09:00:** basal-omni-1.0-ultra (31B, also FP8) and the experimental basal-omni-1.1-max on Hugging Face. Engine basal 2.1 is available now ([GitHub v2.1.0](https://github.com/rkinas/basal/releases/tag/v2.1.0)). Publication on Hugging Face in progress.

**Available now:** [basal-omni-1.0-ultra](https://huggingface.co/Remek/basal-omni-1.0-ultra) (31B, also [FP8](https://huggingface.co/Remek/basal-omni-1.0-ultra-FP8)) and the experimental [basal-omni-1.1-max](https://huggingface.co/Remek/basal-omni-1.1-max) on Hugging Face. Engine basal 2.1: [GitHub v2.1.0](https://github.com/rkinas/basal/releases/tag/v2.1.0).

[Read about ultra and basal 2.1 →](https://basal.si5.pl/en/blog/basal-2-1/)

[Release article↗](https://basal.si5.pl/en/blog/basal-2-1/)

BASAL 2.0 + BASAL-OMNI

# Decisions from text. Now also from images and audio.

**basal-2.0** reads text. **basal-omni** also accepts images and recordings. You define the questions and allowed answers. The model chooses between them — locally, with a confidence estimate.

[Meet both families](https://basal.si5.pl/en/#modele) [Compare results ↗](https://basal.si5.pl/en/#werdykt)

🇵🇱 Polish · 🇬🇧 EnglishOpen weights · Apache 2.0

FROM DATA TO ACTION local

Textemail · document · context

↓

TEXT MODELS**basal-2.0**

mini (1.5B) - 4.5B - max (11B)

Text Image Audio

↓

MULTIMODAL MODELS**basal-omni**

mini (4B) - max (12B)

↓

ONE DECISION INTERFACE**Your questions. Structured answers.**

CategoryUrgencyNext action

System-1 models · a classifier defined with every request

01 / CHOOSE YOUR MODEL

## Two families. A shared language of decisions.

The same dynamic classifier concept. Choose text models for fast automation, or multimodal models when the answer is in an image or recording.

TEXTMain release

### basal-2.0

Fast decisions in your workflow.

Messages, documents, RAG and the agent's next tool. Up to 255 options per question, multiple questions about shared context. Polish foundation: Bielik.

[**mini**1.5B](https://huggingface.co/Remek/basal-2.0-mini)[**basal-2.0**4.5B](https://huggingface.co/Remek/basal-2.0-4.5B)[**max**11B](https://huggingface.co/Remek/basal-2.0-max)

Weights on Hugging Face: [basal-2.0 collection](https://huggingface.co/collections/Remek/basal-20-6acd1712a8e443c86cd576fc) · bf16, FP8, GGUF, MLX

NVIDIA GPU · Mac / MLX · Ollama / llama.cpp

[Run a text model](https://basal.si5.pl/en/#start)

TEXT + IMAGE + AUDIOExperimental

### basal-omni1.0

Decisions from what you see and hear, too.

A document scan, a product photo, a recorded customer request. Send the media and ask about its content, without a separate OCR or transcription step. Foundation: Gemma 4.

[**mini · 4B effective (E4B)**basal-omni-1.0-mini](https://huggingface.co/Remek/basal-omni-1.0-mini)[**max · 12B**basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max)**ultra · 31B**from Saturday 17 Oct, 09:00**max 1.1 · tasks**from Saturday 17 Oct, 09:00

Weights on Hugging Face: [basal-omni-1.0 collection](https://huggingface.co/collections/Remek/basal-omni-10-6acea28e8b5baed2db475c1f) · bf16. New from Saturday 17 October, 09:00: ultra (31B, also FP8 for vLLM) and the experimental max 1.1, trained on the tasks of engine 2.1.

NVIDIA GPU · bf16 / eager · ok. 16 GB mini, 24 GB max, GPU 80 GB ultra

[Run a multimodal model](https://basal.si5.pl/en/#start)

basal-omni is our first release with media: images and audio use the base model's capabilities without additional multimodal training. Calibration comes from text. ultra reads text and images, not audio. [Check results and limitations →](https://basal.si5.pl/en/benchmark/#multimodalne)

02 / HOW BASAL WORKS

## The classifier changes with your question.

You don't train a separate model for every list of categories. You describe them in the request. The next question can address an entirely different process.

01

### Provide the data

Text for basal-2.0. Text, images or audio for basal-omni.

“The shipment arrived damaged”

02

### Ask your questions

Which team? How urgent? Which topics? Several questions about one context in the same call.

Sales · Complaints · Logistics

03

### Use the decision

Get the result and probabilities. Your application takes the next step or hands the case to a person.

Complaints → support queue

`choice` one option`noul` yes / no`score` rating`multi` multiple labels`act` action with costs`tool` agent tool`classify``verify``compress``extract` tasks · basal 2.1[All schemas ↗](https://basal.si5.pl/en/inference-server/#schematy)

IN PRACTICE

## Where can you use basal? Examples in brief.

Wherever the next step of a process depends on what a document, message or recording says. You describe the question and the allowed answers; the model returns a decision with a confidence level.

[DOCUMENTS / ORDERS

### Order fulfilment check

Verify an order’s paperwork: the document flow and amount mismatches. Bring together accounting, production documents and delivery notes. The model recognises the documents and reads their fields; your application compares the amounts and flags discrepancies to resolve.

Order · Delivery note · Invoice · Other document**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#omni-documents)
[EMAIL / TICKETS

### Handling messages and tickets

Route a message to a team, rate its urgency and recognise its topics. Several questions about one email in a single call.

Team · Urgency 1–5 · Topics**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#inbox)
[CONTRACTS / RULES

### Following company rules

Check a complaint, an application or a contract against rules written in plain language, without training a new classifier.

“Is the damage report missing?” → yes / no**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#claims)
[KNOWLEDGE / RAG

### Answers grounded in sources

Check whether retrieved passages answer the question and whether a generative model’s answer is supported by the source before the user sees it.

Supported · Partly · Not supported**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#rag)
[AGENTS / AUTOMATION

### An agent’s next step

Choose an action or a tool from OpenAI or MCP definitions. Send uncertain cases to a human.

find\_order · send\_email · to a human**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#mcp-agents)
[IMAGES AND AUDIO / BASAL-OMNI

### Scans, photos and recordings

Ask the same questions about an invoice scan, a photo of a damaged parcel or a call recording. Experimental release.

Outage · Refund · Call back**See it in Basal Lab ↗**](https://basal.si5.pl/en/basal-lab/#omni-calls)

[18 scenarios with sample API requests ↗](https://basal.si5.pl/en/use-cases/)

[![An animated guide to typed decision models](/assets/films/typed-decision-model.jpg?v=6)▶](https://basal.si5.pl/en/how-it-works/)

FILM / 14:51 · PL / EN SUBTITLES

## An intelligent IF / CASE. Explained step by step.

From one message to a decision: dynamic classification, probabilities, costs and basal’s six question types.

[See how a decision model works →](https://basal.si5.pl/en/how-it-works/)

[![Explainer film on every basal question schema](/assets/films/basal-schematy.jpg?v=1)▶](https://basal.si5.pl/en/inference-server/#film-schematy)

FILM / 15:59 · NAPISY PL / EN

## Every question schema and the basal 2.1 tasks. Explained step by step.

Every question type with a full JSON example: from choice, noul and score through multi, act and tool to SOAM, calibration and the classify, verify, compress and extract tasks.

[Watch the film on schemas and tasks →](https://basal.si5.pl/en/inference-server/#film-schematy)

03 / RESULTS YOU CAN CHECK

## Text and multimodality. Two kinds of evaluation.

[Full results and methodology](https://basal.si5.pl/en/benchmark/)

Text Werdykt · 5,000 decisionsImages and audio basal-omni · 5 probes

### Both families on the same text test.

Werdykt to nasz ukryty benchmark: 10 kategorii po polsku i angielsku. Pokazujemy sześć modeli basal oraz punkty odniesienia — model API, otwarty model, Jev 1.14, Liquid d1-ultra i Respan Span-02 w dwóch ustawieniach: z rozumowaniem i bez niego (jeden przebieg, jak basal).

**5 000**decisions · the same protocol

**basal-2.0** focuses on speed and hardware flexibility. **basal-omni** also handles text; its ultra (31B) has the highest accuracy in the basal family.

These are text results. Image and audio quality are shown in the other tab.

[See all systems ↗](https://basal.si5.pl/en/benchmark/#werdykt)

PL+ENPolishEnglish

ACCURACY · MEAN ACROSS 20 CELLSHIGHER IS BETTER ↗

Time and cost: shorter bars are better. Each scale runs from zero to the maximum in this comparison.

Werdykt PL+EN: basal-omni-max 82.28%, omni-mini 76.88%. basal-2.0: max 78.40%, 4.5B 72.86%, mini 61.84%. [Results and measurement conditions →](https://basal.si5.pl/en/benchmark/)

Werdykt measures text decisions. Full data and comparison conditions are on the benchmark page.

### What does the model read from images and recordings?

Five small Polish probes, from document images to speaker intent. Here, the input is an actual image or audio recording.

**mini · max · ultra**on the same questions; ultra images only

Ultra reads images best but takes no audio. Max does better than mini on document images. Mini handles recordings better. Model size is no substitute for testing your task.

Experimental release. Small sample, text-based calibration. The full table compares media with text and the base model.

[Full multimodal results ↗](https://basal.si5.pl/en/benchmark/#multimodalne)

omni-mini · 4B omni-max · 12B omni-ultra · 31B

Accuracy from media · 0–100% scale · higher is better

Find all five probes in the [multimodal table →](https://basal.si5.pl/en/benchmark/#multimodalne).

omni-probe-pl · 160 + 150 image questions, 140 + 100 + 45 audio questions. These are separate probes, not Werdykt results.

04 / SEE WHAT YOU CAN BUILD

## From data to action.

[All videos in Basal Lab ↗](https://basal.si5.pl/en/basal-lab/)

[![Dynamic classifier demonstration in a B2B workflow](/assets/lab/dynamic-classifier.jpg)

TEXT / B2B WORKFLOW

### One model. A sequence of decisions.

The previous answer changes the question, operation type and next set of options.

**See how it works ↗**](https://basal.si5.pl/en/basal-lab/#dynamic-classifier)
[![Demonstration of decisions from document images](/assets/lab/omni-documents.jpg)

IMAGE / DOCUMENTS

### Ask about what's on the scan.

The document image goes into the model. Questions turn its content into decisions.

**Watch document analysis ↗**](https://basal.si5.pl/en/basal-lab/#omni-documents)
[![Demonstration of Polish conversation analysis](/assets/lab/omni-calls.jpg)

AUDIO / CUSTOMER SERVICE

### Hear the customer's intent.

A recording, questions about its meaning and the selected follow-up path.

**Listen and see the result ↗**](https://basal.si5.pl/en/basal-lab/#omni-calls)

[**New: Codex + basal + Claude Code via MCP**Three Herdr panes. Real decisions. A cost check before action.Watch the film →](https://basal.si5.pl/en/basal-lab/#mcp-agents)

The recordings show earlier model versions. Each case lists the version and actual measurements. Videos are in Polish. [Open the use case catalog →](https://basal.si5.pl/en/use-cases/)

05 / START BUILDING

## One engine. Two model families.

Run basal-2.0 for text or basal-omni for images and audio. Both accept questions through `POST /v1/systemone`. Switch models, keep the same integration.

Python, TypeScript or plain HTTP n8n and your own applications Computation and data on your hardware

Engine basal 2.1 (v2.1.0) is available. basal-omni-1.0-ultra and basal-omni-1.1-max: Saturday, 17 October, 09:00 (Warsaw).

[Full documentation](https://github.com/rkinas/basal#quick-start)

Text · GPU
Apple Silicon
Ollama
Python
TypeScript
cURL
Omni · media
Tasks · 2.1

Copy

```
# 1. Create an environment (requires uv)
uv venv --python 3.12 --allow-existing ~/basal-env
source ~/basal-env/bin/activate

# 2. Install PyTorch and the engine
uv pip install torch==2.11.0 \
  --index-url https://download.pytorch.org/whl/cu128
uv pip install "basal[fp8] @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"

# 3. Start the model (bf16; FP8 port: Remek/basal-2.0-4.5B-FP8 --mode fp8)
basal-serve --model Remek/basal-2.0-4.5B \
  --mode fast --template-prefix off --port 8000
```

TERMINAL · LINUX / WSL + NVIDIA GPUv2.1.0

Install
[uv](https://docs.astral.sh/uv/getting-started/installation/)
and a driver supporting CUDA 12.8 (B300 and HP ZGX Nano (Nvidia DGX Spark): cu130). The first start compiles the model for a few minutes. All GPUs:
[hardware guide](https://github.com/rkinas/basal/blob/main/docs/HARDWARE.md).

GOOD TO KNOW

## Which basal fits your project?

Text or multimodal?

Choose basal-2.0 for fast text decisions on GPU, Mac or through Ollama. Choose basal-omni for image or audio input. Omni also answers text questions, but currently runs only on NVIDIA GPUs in eager mode.

Does the model write answers like a chatbot?

By default, it returns a typed decision and probabilities for the allowed answers. Use a generative model to write an email or summary; basal can select a path, assess the input or check the result. The release article describes the experimental thinking mode in basal-2.0 4.5B.

What is new in basal 2.1?

Engine v2.1.0 adds four experimental tasks on the same API: classify (labels with a rubric each), verify (whether statements follow from the text), compress (the parts a question needs) and extract (JSON schema fields copied exactly from the document). The model does not write text: a task is built from its decisions. On Saturday 17 October basal-omni-1.0-ultra (31B) and the experimental task model basal-omni-1.1-max arrive. [See the tasks →](https://basal.si5.pl/en/inference-server/#zadania)

Which media does basal-omni support?

Images and audio recordings up to 30 seconds, including alongside text in one request (ultra: images only). This release does not accept video files directly. Your application can extract frames and the audio track first.

Does data have to leave the company?

No. After downloading the weights, you run the model on your own hardware and control the application and its connections. Inference itself needs no external API.

What does the confidence level mean?

It is a calibrated model estimate, not a guarantee of correctness. Choose a threshold using examples from your own process. basal-omni uses calibration fitted on text; it needs separate validation on images and recordings. [Explore calibration measurements →](https://basal.si5.pl/en/benchmark/#pewnosc)

LAUNCH / WEDNESDAY, 14 OCTOBER

## Explore the full release.

basal-2.0 and basal-omni: models, results, calibration and practical API examples. All the details in one article.

[Read about basal 2.0 and omni](https://basal.si5.pl/en/blog/basal-2-0/)

Building with basal? [Share your use case ↗](https://basal.si5.pl/en/share/)

[See who uses basal →](https://basal.si5.pl/en/community/)
