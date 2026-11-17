import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { main, root, run } from "./process.mjs"
import { checkedVersion, manifest } from "./version.mjs"

export const pack = (destination) => {
  const version = checkedVersion()
  const staging = mkdtempSync(join(tmpdir(), "decision-api-package-"))
  const filename = `decisions-api-${version}.tgz`
  try {
    const api = resolve(root, "packages/api")
    run("corepack", ["pnpm", "--dir", api, "exec", "tsc", "-p", "tsconfig.build.json", "--outDir", join(staging, "dist")])
    const { devDependencies: _dev, scripts: _scripts, exports, ...pkg } = manifest()
    const entries = Object.fromEntries(Object.entries(exports).map(([entry, source]) => [
      entry, {
        types: source.replace("./src/", "./dist/").replace(/\.ts$/, ".d.ts"),
        default: source.replace("./src/", "./dist/").replace(/\.ts$/, ".js")
      }
    ]))
    copyFileSync(join(api, "README.md"), join(staging, "README.md"))
    writeFileSync(join(staging, "package.json"), JSON.stringify({ ...pkg, files: ["dist", "README.md"], exports: entries }, null, 2) + "\n")
    mkdirSync(destination, { recursive: true })
    const artifact = resolve(destination, filename)
    run("corepack", ["pnpm", "--dir", staging, "pack", "--out", artifact, "--silent"])
    return artifact
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(() => {
    const [destination = "dist", ...rest] = process.argv.slice(2)
    if (destination === "--help") {
      console.log('usage: "just package [output-directory]"')
      return
    }
    if (rest.length) throw new Error("Run just package --help for usage")
    console.log(`artifact: ${JSON.stringify(pack(resolve(root, destination)))}`)
  })
}
