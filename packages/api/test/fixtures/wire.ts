import { readFileSync } from "node:fs"

/** A captured wire body from `test/fixtures/wire/`, as text. */
export const text = (name: string): string =>
  readFileSync(new URL(`./wire/${name}.json`, import.meta.url), "utf8").trim()

/** A captured wire body, parsed. */
export const json = (name: string): unknown => JSON.parse(text(name))
