[News](https://www.liquid.ai/news)/[Models](https://www.liquid.ai/news/models)

![Introducing d1: The most capable decision model, now with vision](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fdecision-model-d1-hero-93ya1hzrkDaJiY0U1HcpS7aFCtpMbC.png&w=3840&q=75)![Introducing d1: The most capable decision model, now with vision](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fdecision-model-d1-hero-dark-GYLdgA16cwOQ1KYlMIrgUzXvAyylkE.png&w=3840&q=75)

# Introducing d1: The most capable decision model, now with vision

OCT 5, 2026

On this page

* [How the d1 decision model works](https://www.liquid.ai/blog/d1-decision-model#how-the-d1-decision-model-works)
* [d1 in action](https://www.liquid.ai/blog/d1-decision-model#d1-in-action)
* [Availability and pricing](https://www.liquid.ai/blog/d1-decision-model#availability-and-pricing)
* [Citation](https://www.liquid.ai/blog/d1-decision-model#citation)

Today, we introduce **d1, our first decision model**, now supporting both text and images. With [last week's experimental release](https://x.com/liquidai/status/2105003472332693869), d1 became the first model to rival Jev on text decisions, and it is now the first to extend these capabilities to images. You can try it today at[console.liquid.ai](http://console.liquid.ai/) and in the [d1 Playground](http://d1.liquid.ai/).

We tested d1 against GPT-6.1 Sol and Claude Opus 5.5 on six real applications, from filtering support tickets to inspecting circuit boards. d1 matches or beats GPT-6.1 Sol on four of them. It costs 19x to 200x less than both models and answers significantly faster on every task.

## How the d1 decision model works

Decision models answer questions about a situation with a probability for each possible answer. The d1 decision model takes unstructured data (e.g., text, images, or both) and one or more questions as input, reads them in one forward pass, and returns the probabilities, without generating any tokens. A text decision takes 200 to 300 ms, fast enough for real-time applications.

![How the d1 decision model turns text and image inputs into decisions](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fhow-d1-works-e23JxeOaJYWC3cwW4NSqPk6Kr7U4tv.png&w=3840&q=75)

Figure 2: How the d1 decision model turns text and image inputs into decisions.

d1 answers three types of questions:

* **Noul**: a yes/no question, answered with a probability between 0 and 1.
* **Choice**: pick one label among many, answered with a probability per label.
* **Score**: a position on a scale, weighted by the probability of each level.

One request can ask several questions about the same state, saving input tokens.

## d1 in action

Decision models can replace expensive calls to language models when the answer is a structured decision. They also enable a variety of new use cases, some shown in this section. Every demo below runs live in the [d1 Playground](http://d1.liquid.ai/).

[](https://aypchzzf9pftwuto.public.blob.vercel-storage.com/d1-inspection-chip-r83Uwkz1xLIoyTtJeXNyZVlJg7knZo.mp4)

**Visual inspection.** This industrial application reviews parts from four production lines that pass under a camera: circuit boards, candles, cashews, and chewing gum (public VisA dataset). d1 sorts good and defective parts with 85-97% accuracy. The most interesting part is that the model was never trained for this. Thanks to its excellent generalizability, it understands the task from a short description.

[](https://aypchzzf9pftwuto.public.blob.vercel-storage.com/applications-9E6G8suTU0atzNjDA221HBk3a2YNao.mp4)

**Text applications.** Five applications use d1 for every decision:

* **Smart Filter:** d1 becomes a function in a SQL query, `WHERE d1(ticket, 'the customer wants to cancel)`. It answers yes or no for each of 150 support tickets.
* **Code Search:** d1 browses the Hugging Face transformers repository (6,511 files) one folder at a time, down to the function that answers a question.
* **Smart Folders:** d1 files each new document into a folder, then a subfolder. It files search questions the same way, so keyword search only looks in one subfolder.
* **Web Agent:** d1 operates a flight-search website from a one-sentence goal. At each step, it picks the next action among everything the page allows.
* **Context Compaction:** d1 reads each tool output in a coding agent's session and keeps, trims, or drops it for the next task. It removes 52% of the tokens and keeps every output the task needs.

We adapted four of these applications from the following open-source projects: [pg-jev](https://github.com/realZachi/pg-jev), [jevgrep](https://github.com/dzhng/jevgrep), [jev-ultrafast](https://github.com/browser-use/jev-ultrafast), and [fast-jev-compaction](https://github.com/tamaratran/fast-jev-compaction).

[](https://aypchzzf9pftwuto.public.blob.vercel-storage.com/games-ql06VjRaeft1WcmIinflgAdQ0w2Dm6.mp4)

**Games.** d1 plays eight classic games live and picks every move. Vision helps it in two ways:

* **Better decisions**: Tetris can be fully described in text, but adding the screen raises d1's score from 70 to 81 cleared lines.
* **Simpler integration**: In Wordle, d1 reads the board directly from a screenshot. Developers don't need to write a text version of the game, and d1 still solved 12 of 12 games in 3.8 guesses on average.

d1 also handles purely visual tasks. In Quick, Draw!, it guesses what a player's doodle shows among 62 words, and recognizes 5.2 of 6 drawings (random guessing gets 0.6).

## Availability and pricing

Start building today with the d1 decision model, available on the [Liquid AI API](http://console.liquid.ai/) as `d1`. Create an API key at [console.liquid.ai](https://console.liquid.ai/) (Dashboard > API Keys).

To use vision, you can simply send images as base64 data URLs in `images`:

```
import base64, os, requests

image = base64.b64encode(open("board.jpg", "rb").read()).decode()

response = requests.post(
    "https://api.liquid.ai/decisions/v1/systemone",
    headers={"Authorization": f"Bearer {os.environ['LIQUID_API_KEY']}"},
    json={
        "model": "d1",
        "images": [f"data:image/jpeg;base64,{image}"],
        "state": "Camera image of a circuit board on the production line.",
        "questions": 
            {"defect": {
                "type": "noul", 
                "instructions": "Does this circuit board have a defect?"
             }
         },
    },
)

print(response.json()["answers"]["defect"]["noul"])
```

The full API reference is in the [decision models documentation](https://docs.liquid.ai/lfm/models/decision-models).

d1 is billed on input tokens only, with no output tokens. Images are counted as input tokens at the same rate as text: 1.5 tokens per 32×32-pixel patch, so a 1024×1024 image costs 1,536 tokens. Each question is billed as its own prompt, including its text and all images.

d1 is also available through [Vercel](https://vercel.com/ai-gateway/models/d1) and [OpenRouter](https://openrouter.ai/liquid/d1), with text only for now. Vision is coming to both soon.

This is an exciting time for creativity and exploration in AI, and d1 is only the beginning. We're continuing our work on decision models across a range of sizes, with new features, higher decision quality, and lower latency, and we plan to release open weights for upcoming models on Hugging Face soon.

[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Try on Liquid Console](https://console.liquid.ai/)[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Read our docs](https://docs.liquid.ai/lfm/models/decision-models)

## Citation

For citations, please use the following reference or BibTeX:

Liquid AI, "Introducing d1: The most capable decision model, now with vision", Liquid AI Blog, Oct 2026.

```
@article{liquidAI2026d1,
  author = {Liquid AI},
  title = {Introducing d1: The most capable decision model, now with vision},
  journal = {Liquid AI Blog},
  year = {2026},
  note = {www.liquid.ai/blog/d1-decision-model},
}
```

*Methodology. We ran each application once per model on October 5, 2026, with the d1 Playground's comparison script. GPT-6.1 Sol and Claude Opus 5.5 get each request as one chat message and answer in JSON, at their default reasoning setting. Where many questions share one input, such as the filter's tickets or the folders' passages, the chat models answer them in batches. Costs use list prices, without prompt-cache discounts. d1's costs use $0.04 per million input tokens. Time is per run, with up to 8 requests in flight. A Smart Filter run is one query over 150 tickets. A Smart Folders run files 105 passages, and its cost is per 1,000 passages. The filter's quality is its F1 score against hand labels, which counts both missed and wrong matches. The other text applications count the goals, questions, passages or needed outputs handled correctly. We wrote six of the 15 code questions and two of the four compaction sessions after d1's pipeline was set. In Visual Inspection, every model sees a good part from the same line next to the part to inspect.*

Share on social:

For press inquiries, email us at [press@liquid.ai](mailto:press@liquid.ai)
