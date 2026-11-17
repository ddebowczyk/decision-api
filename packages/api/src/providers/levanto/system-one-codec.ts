import type { Codec } from "../../wire/Codec.ts"
import * as SystemOne from "../../wire/SystemOne.ts"

export const codec: Codec = {
  ...SystemOne.codec,
  id: "levanto-system-one",
  reasoning: true,
  encode: (spec) => SystemOne.encode(spec, spec.reasoning === undefined ? [] : [["reasoning", spec.reasoning]])
}
