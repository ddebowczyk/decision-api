import type * as Deployment from "../providers/deployment.ts"
import type * as Codec from "../wire/Codec.ts"
import { codec as openAiDecisions } from "../providers/openai/codec.ts"
import { codec as classifierDev } from "../providers/classifier-dev/codec.ts"
import { codec as respan } from "../providers/respan/codec.ts"
import { codec as systemOne } from "../wire/SystemOne.ts"
import { codec as typesafe } from "../providers/typesafe/codec.ts"
import { codec as clef } from "../providers/cloudflare/codec.ts"
import { codec as sageNative } from "../providers/levanto/native-codec.ts"
import { codec as sageSystemOne } from "../providers/levanto/system-one-codec.ts"

const codecs: { readonly [K in Deployment.Codec]: Codec.Codec } = {
  "system-one": systemOne,
  "typesafe-system-one": typesafe,
  "clef-system-one": clef,
  "levanto-system-one": sageSystemOne,
  "levanto-native-batch": sageNative,
  "openai-decisions": openAiDecisions,
  respan,
  "classifier-dev": classifierDev
}

/** The codec a deployment speaks. @since 0.1.0 */
export const codecFor = (d: Deployment.Snapshot): Codec.Codec => codecs[d.codec]
