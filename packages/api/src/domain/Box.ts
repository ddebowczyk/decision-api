/** Bounding box edges as fractions of the image dimensions. */
export interface Box {
  readonly top: number
  readonly bottom: number
  readonly left: number
  readonly right: number
}

export const decode = (value: unknown): Box | undefined => {
  if (typeof value !== "object" || value === null) return undefined
  const { top, bottom, left, right } = value as Partial<Box>
  const edge = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1
  if (edge(top) && edge(bottom) && edge(left) && edge(right) && top < bottom && left < right) {
    return { top, bottom, left, right }
  }
  return undefined
}
