import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

export const root = fileURLToPath(new URL("../../", import.meta.url))
export const run = (command, args) =>
  execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim()

export const main = async (action) => {
  try {
    await action()
  } catch (error) {
    console.error(`error: ${JSON.stringify(error instanceof Error ? error.message : String(error))}`)
    process.exitCode = 1
  }
}
