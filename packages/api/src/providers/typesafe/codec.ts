import * as Identity from "../../domain/Identity.ts"
import type { Codec } from "../../wire/Codec.ts"
import * as SystemOne from "../../wire/SystemOne.ts"
import * as Wire from "../../wire/Wire.ts"

export const codec: Codec = {
  ...SystemOne.codec,
  id: "typesafe-system-one",
  images: {
    headers: { "TypeSafe-Danger-Zone-Images": "true" },
    preflight: (images) => images.flatMap((image, index) =>
      image.bytes > 16 * 1024 * 1024 || image.width < 280 || image.width > 1568 || image.height < 280 || image.height > 1568
        ? [{ problem: `image ${index + 1} exceeds Jev's size or dimension bounds`, hint: "Use a PNG or JPEG up to 16 MiB with each side between 280 and 1568 pixels" }]
        : []
    )
  },
  encode: (spec) => {
    if (!spec.images?.length) return SystemOne.encode(spec)
    const assets = spec.images.map((image, index) => [
      `__image_${Identity.sha256(image.dataBase64)}_${index}__`,
      { type: "image", format: image.format, data_base64: image.dataBase64 }
    ] as const)
    return SystemOne.encode(
      { ...spec, state: [...assets.map(([reference]) => reference), spec.state] },
      [["assets", Wire.obj(assets)]]
    )
  }
}
