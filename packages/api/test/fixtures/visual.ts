import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { Decision, Q, type ImageInput } from "../../src/index.ts"

export const Visual = Decision.make("visual", {
  revision: "1",
  input: Schema.String,
  questions: [["red", Q.boolean("Is the image a solid red square?")]]
})

export const redImage: ImageInput = {
  format: "png",
  dataBase64: readFileSync(new URL("./red.png", import.meta.url)).toString("base64")
}
