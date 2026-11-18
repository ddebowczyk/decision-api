import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { main, root } from "../lib/process.mjs"

const manifestPath = resolve(root, "packages/api/package.json")
const sourcePath = resolve(root, "packages/api/src/index.ts")
const versionPattern = /^export const version = "(\d+\.\d+\.\d+)" as const$/m

export const manifest = () => JSON.parse(readFileSync(manifestPath, "utf8"))

const partsOf = (version) => {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version ?? "")) {
    throw new Error("Expected a stable semantic version such as 0.3.0")
  }
  const parts = version.split(".").map(Number)
  if (!parts.every(Number.isSafeInteger)) throw new Error("Version component exceeds the safe integer range")
  return parts
}

export const checkedVersion = () => {
  const version = manifest().version
  partsOf(version)
  const sourceVersion = readFileSync(sourcePath, "utf8").match(versionPattern)?.[1]
  if (sourceVersion !== version) throw new Error("Package manifest and exported version disagree")
  return version
}

const setVersion = (current, next) => {
  const parts = partsOf(next)
  const old = partsOf(current)
  const firstChange = parts.findIndex((part, index) => part !== old[index])
  if (firstChange === -1) return current
  if (parts[firstChange] < old[firstChange]) throw new Error("Version must increase")
  const source = readFileSync(sourcePath, "utf8")
  const oldManifest = readFileSync(manifestPath, "utf8")
  const nextManifest = oldManifest.replace(`"version": "${current}"`, `"version": "${next}"`)
  if (nextManifest === oldManifest) throw new Error("Expected the package manifest to contain its current version")
  writeFileSync(manifestPath, nextManifest)
  try {
    writeFileSync(sourcePath, source.replace(versionPattern, `export const version = "${next}" as const`))
  } catch (error) {
    writeFileSync(manifestPath, oldManifest)
    throw error
  }
  return checkedVersion()
}

const commands = ["show", "check", "bump", "set"]
export const versionCommand = ([command = "show", argument, ...rest]) => {
  if (command === "--help") {
    console.log('usage: "just version [show | check | bump <major|minor|patch> | set <version>]"')
    return
  }
  if (!commands.includes(command) || rest.length || (["show", "check"].includes(command) && argument !== undefined)) {
    throw new Error("Run just version --help for usage")
  }
  const current = checkedVersion()
  let version = current
  if (command === "set") version = setVersion(current, argument)
  if (command === "bump") {
    const index = ["major", "minor", "patch"].indexOf(argument)
    if (index < 0) throw new Error("Expected major, minor, or patch")
    const next = partsOf(current).map((part, i) => i > index ? 0 : i === index ? part + 1 : part).join(".")
    version = setVersion(current, next)
  }
  console.log(`version: ${JSON.stringify(version)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(() => versionCommand(process.argv.slice(2)))
}
