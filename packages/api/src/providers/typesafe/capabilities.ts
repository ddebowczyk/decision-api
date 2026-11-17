import type { Declaration } from "../Capabilities.ts"
import type { Snapshot } from "../deployment.ts"

export const forModel = (deployment: Snapshot, row: Declaration): Declaration => {
  const pinned = deployment.aliases[row.model] ?? row.model
  if (pinned !== "jev-1.13.0" && pinned !== "jev-1.14.0") return row
  const images = {
    support: "supported",
    adapterSupport: "supported",
    constraints: { experimental: true, placement: "before-state" }
  } as const
  if (pinned === "jev-1.13.0") return { ...row, features: { images } }
  return {
    ...row,
    features: { images, box: { ...images, constraints: { experimental: true, imageRequired: true } } },
    capabilities: {
      ...row.capabilities,
      primitives: [...row.capabilities.primitives, { kind: "box", version: "1", minOutcomes: 0, maxOutcomes: "unknown" }]
    }
  }
}
