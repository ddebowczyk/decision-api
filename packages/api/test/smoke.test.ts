import { readFileSync } from "node:fs"
import { assert, it } from "@effect/vitest"
import { Effect } from "effect"
import { version } from "../src/index.ts"

it.effect("the package entry point loads under Effect 4", () =>
  Effect.gen(function*() {
    const v = yield* Effect.succeed(version)
    assert.strictEqual(v, JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version)
  }))
