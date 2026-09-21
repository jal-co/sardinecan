import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { publishRelease } from "../scripts/release.mjs"

type Release = {
  owner: string
  repo: string
  tag_name: string
  target_commitish: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
}

test("GitHub releases use the current version and notes without republishing or hiding failures", async () => {
  const original = process.cwd()
  const directory = mkdtempSync(join(tmpdir(), "sardinecan-release-"))
  const created: Release[] = []
  let exists = false
  let failure: Error | undefined
  const github = {
    rest: {
      repos: {
        async getReleaseByTag() {
          if (failure) throw failure
          if (!exists)
            throw Object.assign(new Error("Not found"), { status: 404 })
        },
        async createRelease(release: Release) {
          created.push(release)
        },
      },
    },
  }
  const context = {
    repo: { owner: "jal-co", repo: "sardinecan" },
    sha: "release-commit",
  }
  try {
    process.chdir(directory)
    writeFileSync("package.json", JSON.stringify({ version: "0.1.1" }))
    writeFileSync(
      "CHANGELOG.md",
      "# sardinecan\n\n## 0.1.1\n\n### Patch Changes\n\n- New release.\n\n## 0.1.0\n\n- Older release.\n"
    )
    await publishRelease(github, context)
    assert.deepEqual(created, [
      {
        ...context.repo,
        tag_name: "v0.1.1",
        target_commitish: context.sha,
        name: "v0.1.1",
        body: "### Patch Changes\n\n- New release.",
        draft: false,
        prerelease: false,
      },
    ])
    exists = true
    await publishRelease(github, context)
    assert.equal(created.length, 1)
    failure = Object.assign(new Error("Forbidden"), { status: 403 })
    await assert.rejects(publishRelease(github, context), /Forbidden/)
    assert.equal(created.length, 1)
    failure = undefined
    exists = false
    writeFileSync("package.json", JSON.stringify({ version: "0.2.0-beta.1" }))
    await assert.rejects(
      publishRelease(github, context),
      /Missing changelog entry/
    )
    writeFileSync("CHANGELOG.md", "# sardinecan\n\n## 0.2.0-beta.1\n")
    await assert.rejects(
      publishRelease(github, context),
      /Empty changelog entry/
    )
    writeFileSync(
      "CHANGELOG.md",
      "# sardinecan\n\n## 0.2.0-beta.1\n\n- Preview release.\n"
    )
    await publishRelease(github, context)
    assert.equal(created[1].prerelease, true)
  } finally {
    process.chdir(original)
    unlinkSync(join(directory, "package.json"))
    unlinkSync(join(directory, "CHANGELOG.md"))
    rmdirSync(directory)
  }
})
