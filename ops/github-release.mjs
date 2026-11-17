import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { main, root, run } from "./process.mjs"
import { pack } from "./package.mjs"
import { checkedVersion } from "./version.mjs"

const git = (...args) => run("git", args)
const gh = (...args) => run("gh", args)

const target = () => {
  const remote = git("remote", "get-url", "origin")
  const name = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(remote)?.[1]
  if (name === undefined) throw new Error("origin must be a GitHub repository URL")
  const repository = JSON.parse(gh("repo", "view", name, "--json", "nameWithOwner,defaultBranchRef"))
  const branch = repository.defaultBranchRef?.name
  if (git("status", "--porcelain") || !branch || git("branch", "--show-current") !== branch) {
    throw new Error("Release from a clean checkout of the GitHub default branch")
  }
  const commit = git("rev-parse", "HEAD")
  if (git("ls-remote", "origin", `refs/heads/${branch}`).split("\t")[0] !== commit) {
    throw new Error("Push the default branch before releasing")
  }
  return { repo: repository.nameWithOwner, commit }
}

const taggedCommit = (tag) => {
  const ref = `refs/tags/${tag}`
  const rows = git("ls-remote", "origin", ref, ref + "^{}").split("\n")
  return (rows.find((row) => row.endsWith("^{}")) ?? rows[0]).split("\t")[0]
}

const findRelease = (repo, tag) => {
  const json = gh("api", `repos/${repo}/releases`, "--paginate", "--jq", `.[] | select(.tag_name == "${tag}")`)
  return json ? JSON.parse(json) : undefined
}

const checksum = (file) => "sha256:" + createHash("sha256").update(readFileSync(file)).digest("hex")

const verifyAsset = (release, repo, tag, artifact, temporary) => {
  const name = basename(artifact)
  const asset = release.assets.find((item) => item.name === name && item.state === "uploaded")
  if (!asset) throw new Error(`Release ${tag} does not contain an uploaded ${name}`)
  if (asset.digest) {
    if (asset.digest !== checksum(artifact)) throw new Error(`Release ${tag} contains different bytes for ${name}`)
    return
  }
  const downloaded = join(temporary, "download")
  mkdirSync(downloaded, { recursive: true })
  gh("release", "download", tag, "--repo", repo, "--pattern", name, "--dir", downloaded)
  if (checksum(join(downloaded, name)) !== checksum(artifact)) throw new Error(`Release ${tag} contains different bytes for ${name}`)
}

const release = (notesFile) => {
  const tag = "v" + checkedVersion()
  const { repo, commit } = target()
  const previousTag = taggedCommit(tag)
  if (previousTag && previousTag !== commit) throw new Error(`Remote tag ${tag} already points at a different commit`)
  run("just", ["gate"])
  const temporary = mkdtempSync(join(tmpdir(), "decision-api-release-"))
  try {
    const artifact = pack(temporary)
    if (!previousTag) git("push", "origin", `${commit}:refs/tags/${tag}`)
    if (taggedCommit(tag) !== commit) throw new Error(`Cannot verify remote tag ${tag}`)
    let current = findRelease(repo, tag)
    if (!current) {
      const notes = notesFile ? ["--notes-file", resolve(root, notesFile)] : ["--generate-notes"]
      gh("release", "create", tag, "--repo", repo, "--verify-tag", "--draft", "--title", tag, ...notes)
      current = findRelease(repo, tag)
    }
    if (current?.draft && !current.assets.some((asset) => asset.name === basename(artifact))) {
      gh("release", "upload", tag, artifact, "--repo", repo)
      current = findRelease(repo, tag)
    }
    if (!current) throw new Error(`Cannot find release ${tag} after creation`)
    verifyAsset(current, repo, tag, artifact, temporary)
    if (current.draft) gh("release", "edit", tag, "--repo", repo, "--verify-tag", "--draft=false")
    const published = findRelease(repo, tag)
    if (!published || published.draft) throw new Error(`Release ${tag} is not published`)
    console.log(`release: ${JSON.stringify(published.html_url)}\ncommit: ${JSON.stringify(commit)}\nartifactDigest: ${JSON.stringify(checksum(artifact))}`)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

await main(() => {
  const [notes, ...rest] = process.argv.slice(2)
  if (notes === "--help") {
    console.log('usage: "just release [notes-file]"')
    return
  }
  if (rest.length) throw new Error("Run just release --help for usage")
  if (notes) readFileSync(resolve(root, notes))
  release(notes)
})
