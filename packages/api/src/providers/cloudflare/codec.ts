import type { Codec } from "../../wire/Codec.ts"
import * as SystemOne from "../../wire/SystemOne.ts"

const mib = 1024 * 1024

export const codec: Codec = {
  ...SystemOne.codec,
  id: "clef-system-one",
  images: {
    estimateTokens: (images) => images.length * 1024,
    preflight: (images) => {
      if (images.length > 4 || images.reduce((sum, image) => sum + image.bytes, 0) > 8 * mib) {
        return [{ problem: "Clef accepts at most four images and 8 MiB of decoded image data", hint: "Send fewer or smaller images" }]
      }
      return images.flatMap((image, index) =>
        image.bytes > 4 * mib || image.width * image.height > 16_000_000
          ? [{ problem: `image ${index + 1} exceeds Clef's image limits`, hint: "Use images up to 4 MiB and 16 megapixels each" }]
          : []
      )
    }
  },
  encode: (spec) => SystemOne.encode(spec, spec.images?.length
    ? [["images", spec.images.map((image) => `data:image/${image.format};base64,${image.dataBase64}`)]]
    : [])
}
