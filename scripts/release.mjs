import { readFileSync } from "node:fs"

export async function publishRelease(github, context) {
  const { version } = JSON.parse(readFileSync("package.json", "utf8"))
  const changelog = readFileSync("CHANGELOG.md", "utf8")
  const section = changelog
    .split(/^## /m)
    .find((entry) => entry.split("\n")[0].trim() === version)
  if (!section) throw new Error(`Missing changelog entry for ${version}`)
  const body = section.slice(section.indexOf("\n") + 1).trim()
  if (!body) throw new Error(`Empty changelog entry for ${version}`)
  const tag = `v${version}`
  try {
    await github.rest.repos.getReleaseByTag({ ...context.repo, tag })
    return
  } catch (error) {
    if (error.status !== 404) throw error
  }
  await github.rest.repos.createRelease({
    ...context.repo,
    tag_name: tag,
    target_commitish: context.sha,
    name: tag,
    body,
    draft: false,
    prerelease: version.includes("-"),
  })
}
