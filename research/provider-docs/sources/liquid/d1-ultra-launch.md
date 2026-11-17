[News](https://www.liquid.ai/news)/[Models](https://www.liquid.ai/news/models)

![d1-ultra: Introducing the World’s Best Decision Model](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fimage%2520(4)-mh23DVnFm2EDs4US6gJskniHIMwVY4.png&w=3840&q=75)![d1-ultra: Introducing the World’s Best Decision Model](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fimage%2520(5)-BzWyvgejrC9dj6l1CBcjB84wn7MTbK.png&w=3840&q=75)

# d1-ultra: Introducing the World’s Best Decision Model

OCT 15, 2026

On this page

* [What d1-ultra does](https://www.liquid.ai/blog/d1-ultra#what-d1-ultra-does)
* [Results](https://www.liquid.ai/blog/d1-ultra#results)
* [Availability and Pricing](https://www.liquid.ai/blog/d1-ultra#availability-and-pricing)
* [Citation](https://www.liquid.ai/blog/d1-ultra#citation)

Today, we release d1-ultra, our new multimodal **decision model with state-of-the-art performance**. Most decision models work well on easy and common tasks. We built d1-ultra for harder, messier real-world use cases, like spotting a defect on a circuit board against its spec or checking a damage claim against the customer’s photo.

d1-ultra is available today on the [Liquid API](https://console.liquid.ai/) at $0.042 per million input tokens.

![d1 vs jev benchmarks](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fpasted-image-8NU1C1rm5fPkgBq5LVXEAV452UizAW.png&w=3840&q=75)

[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Try on Liquid Console](https://console.liquid.ai/)[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Try on d1 Playground](https://d1.liquid.ai/)

## What d1-ultra does

Decision models answer questions about a situation with a probability for each possible answer. d1-ultra takes unstructured data (text, images, or both) and one or more questions as input. It reads this input in one forward pass and returns the probabilities, without generating any tokens.  
![how d1 ultra decision model works](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fpasted-image-OkEYa9ETZ4Th9aGZhQyfHbq9yqZNA1.png&w=3840&q=75)

d1-ultra answers the same three question types as d1:

* **noul**: a yes/no question, answered with a probability from 0 to 1.
* **Choice**: one label from many, with a probability per label.
* **Score**: a position on a scale.

## Results

Compared to d1, we based d1-ultra on a larger open-weight model with a series of Liquid-specific heavy customizations. It provides significant gains when combined with our training pipeline, especially on knowledge-related tasks.

We compared it to our previous model d1 and Jev 1.14 across 112 unique evaluations.

![d1-ultra benchmarks](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fpasted-image-0tsr5y0tZiDTTr8HyWuan4HFEqRuji.png&w=3840&q=75)

Accuracy is not enough: decision models also output probabilities that must be properly calibrated. We realized that most decision models are overconfident in their responses. That’s why we specifically trained d1-ultra to produce more reliable probabilities.

![d1-ultra confidence vs accuracy](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fpasted-image-hJKI5qYBAKCpK0tJ83PZ22osJplw2Z.png&w=3840&q=75)

d1-ultra outperforms Jev 1.14 across all tasks, delivering better-calibrated answers and higher accuracy at the same price. To see how it works in practice, you can find more demos running on d1-ultra in the [d1 Playground](http://d1.liquid.ai/).

d1-ultra also outperforms all other decision models [Artificial Analysis Decision Index](https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index) by at least 8 points."

![d1-ultra on AADI](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fimage-UIG519rNOHuSuMnv1MEAe92RpYqdUh.png&w=3840&q=75)

## Availability and Pricing

d1-ultra is available on the [Liquid AI API](http://console.liquid.ai/). Create your API key and start building today. d1-ultra will soon be available through [Vercel](https://vercel.com/ai-gateway/models/d1) and [OpenRouter](https://openrouter.ai/liquid/d1).

The model reads text, images, or both at the same time, like in this example:

```
import base64, os, requests

image = base64.b64encode(open("board.jpg", "rb").read()).decode()

response = requests.post(
    "https://api.liquid.ai/decisions/v1/systemone",
    headers={"Authorization": f"Bearer {os.environ['LIQUID_API_KEY']}"},
    json={
        "model": "d1-ultra",
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

d1-ultra is billed on input tokens only, with no output tokens. Images are counted as input tokens at the same rate as text: 1.5 tokens per 32×32-pixel patch, so a 1024×1024 image costs 1,536 tokens. Each question is billed as its own prompt, including its text and all images.

d1-ultra is our most capable decision model so far. We’re committed to continuing our work on decision models across a range of sizes, with new features, higher decision quality, and lower latency, and we plan to provide regular updates.

[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Try on Liquid Console](https://console.liquid.ai/)[![Liquid AI logo](/_next/image?url=https%3A%2F%2Faypchzzf9pftwuto.public.blob.vercel-storage.com%2Fliquid-logo-xIjdtFz2499igEZp35jOGE8qF8wpBA&w=48&q=75)Read our docs](https://docs.liquid.ai/lfm/models/decision-models)

## **Citation**

For citations, please use the following reference or BibTeX:

Liquid AI, "d1-ultra: State-of-the-Art Decision Model", Liquid AI Blog, Oct 2026.

```
@article{liquidAI2026d1-ultra,
  author = {Liquid AI},
  title = {d1-ultra: State-of-the-Art Decision Model},
  journal = {Liquid AI Blog},
  year = {2026},
  note = {www.liquid.ai/blog/d1-ultra},
}
```

Share on social:

For press inquiries, email us at [press@liquid.ai](mailto:press@liquid.ai)
