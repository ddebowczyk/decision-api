/** System One replies for the Triage fixture, shaped like the live captures. */
export const typesafeTriage = {
  model: "jev-1.13.0",
  answers: {
    refund: { type: "noul", noul: 0.97 },
    team: { type: "choice", choice: "billing", confidence: 0.9, probabilities: { billing: 0.92, technical: 0.05, sales: 0.03 } },
    urgency: { type: "score", score: 1.1, confidence: 0.5, legend: { "0": "routine", "1": "soon", "2": "immediate" }, probabilities: { "0": 0.2, "1": 0.5, "2": 0.3 } }
  },
  usage: { input_tokens: 300, output_tokens: 40 }
}

/** One question per call, as Perplexity answers after `split-for-isolation`. */
export const perplexityOne = (id: "refund" | "team" | "urgency", withUsage = true) => ({
  model: "pplx-decider-latest",
  answers: { [id]: typesafeTriage.answers[id] },
  ...(withUsage ? { usage: { input_tokens: 100, output_tokens: 1 } } : {})
})
