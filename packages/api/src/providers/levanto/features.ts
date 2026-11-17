import type { Feature } from "../Capabilities.ts"

// These declarations describe provider features beyond today's portable codec.
export const sageFeatures: Readonly<Record<string, Feature>> = Object.fromEntries([
  "native-abstention", "numeric-scale-levels", "sort", "tags", "reasoning",
  "latency-mode", "grounding", "images", "decision-batch", "extraction",
  "extraction-batch", "streaming", "usage-estimate", "model-catalog", "readiness"
].map((name) => [name, { support: "supported", adapterSupport: name === "reasoning" || name === "native-abstention" ? "supported" : "unsupported" }]))
