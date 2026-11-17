/** An image carried alongside the state, in caller-supplied order. */
export interface Input {
  readonly format: "png" | "jpeg"
  readonly dataBase64: string
}

export interface Prepared extends Input {
  readonly bytes: number
  readonly width: number
  readonly height: number
}

const dimensions = (format: Input["format"], binary: string): readonly [number, number] => {
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const data = new DataView(bytes.buffer)
  if (format === "png" && bytes.length >= 24 && data.getBigUint64(0) === 0x89504e470d0a1a0an && data.getUint32(12) === 0x49484452) {
    return [data.getUint32(16), data.getUint32(20)]
  }
  if (format === "jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset + 4 <= bytes.length;) {
      if (bytes[offset++] !== 0xff) break
      while (bytes[offset] === 0xff) offset++
      const marker = bytes[offset++]!
      if (offset + 2 > bytes.length || marker === 0xda || marker === 0xd9) break
      const length = data.getUint16(offset)
      if (length < 2 || offset + length > bytes.length) break
      if (length >= 8 && marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return [data.getUint16(offset + 5), data.getUint16(offset + 3)]
      }
      offset += length
    }
  }
  throw new TypeError(`Invalid ${format} image header`)
}

export const prepare = (image: Input): Prepared => {
  const decoded = atob(image.dataBase64)
  if (btoa(decoded) !== image.dataBase64) throw new TypeError("Image data must be canonical padded base64")
  const [width, height] = dimensions(image.format, decoded)
  if (width === 0 || height === 0) throw new TypeError("Image dimensions must be positive")
  return { format: image.format, dataBase64: image.dataBase64, bytes: decoded.length, width, height }
}
