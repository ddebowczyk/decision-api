/**
 * Stable identities: versioned, domain-separated SHA-256 over canonical JSON.
 *
 * A definition identity covers its name, revision, mode and every question in
 * order, including option and level order. The input schema is not hashed;
 * the application-owned `revision` stands for it.
 *
 * @since 0.1.0
 */
import type * as Decision from "./Decision.ts"
import * as Wire from "../wire/Wire.ts"

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
])

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

/**
 * SHA-256 of the UTF-8 bytes of a string, as lowercase hex. Pure and
 * synchronous, so identities work on every runtime without `node:crypto`.
 *
 * @since 0.1.0
 */
export const sha256 = (text: string): string => {
  const data = new TextEncoder().encode(text)
  const bitLength = data.length * 8
  const padded = new Uint8Array(((data.length + 9 + 63) >> 6) << 6)
  padded.set(data)
  padded[data.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000))
  view.setUint32(padded.length - 4, bitLength >>> 0)
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const w = new Uint32Array(64)
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15]!, b = w[i - 2]!
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10)
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, hh] = h as unknown as [number, number, number, number, number, number, number, number]
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + w[i]!) >>> 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    h[0] = h[0]! + a
    h[1] = h[1]! + b
    h[2] = h[2]! + c
    h[3] = h[3]! + d
    h[4] = h[4]! + e
    h[5] = h[5]! + f
    h[6] = h[6]! + g
    h[7] = h[7]! + hh
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("")
}

const tagged = (domain: string, body: Wire.Value): string => `${domain}:${sha256(`${domain}\n${Wire.canonical(body)}`)}`

/** Drop `undefined` fields and phantom type slots so questions hash as data. */
const plain = (u: unknown): Wire.Value => {
  if (u === null || typeof u !== "object") return u as Wire.Value
  if (Array.isArray(u)) return u.map(plain)
  return Object.fromEntries(
    Object.entries(u).filter(([k, v]) => v !== undefined && k !== "~types").map(([k, v]) => [k, plain(v)])
  )
}

/**
 * Identity of a definition: `def1:<sha256>`.
 *
 * @since 0.1.0
 */
export const definition = (d: Decision.Any): string =>
  tagged("def1", {
    name: d.name,
    revision: d.revision,
    mode: d.mode,
    questions: d.questions.map(([id, q]) => [id, plain(q)])
  })

/**
 * Identity of an encoded input: `inp1:<sha256>`. Plain-object key order does
 * not matter; array order does.
 *
 * @since 0.1.0
 */
export const input = (encoded: Wire.Value): string => tagged("inp1", encoded)

/**
 * The parts that decide what a provider is asked.
 *
 * @since 0.1.0
 */
export interface ExecutionParts {
  readonly capabilities?: string
  readonly request?: Wire.Value
  readonly definition: string
  readonly input: string
  readonly provider: string
  readonly deployment: string
  readonly model: string
  readonly lowerings: ReadonlyArray<string>
}

/**
 * Identity of one execution: the same definition and input sent the same way
 * to the same deployment and model. `exe1:<sha256>`.
 *
 * @since 0.1.0
 */
export const execution = (parts: ExecutionParts): string =>
  tagged("exe1", { ...parts, lowerings: [...parts.lowerings] })
