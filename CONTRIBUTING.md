# Contributing to Sardine Can

## Setup

Use Node.js 22.18 or newer.

```sh
git clone https://github.com/jal-co/sardinecan.git
cd sardinecan
npm ci
npm run dev
```

## Making changes

1. Branch from `main` and keep changes scoped.
2. Follow the existing React, Tailwind, and shared UI component patterns.
3. Run `npm test` and `npm run build`.
4. For renderer or artwork changes, check the browser preview, template selection, uploads, print scaling, pull-tab placement, and PNG/SVG exports. Check mobile layouts when changing the interface.
5. Use Conventional Commits (`feat: ...`, `fix: ...`) and open a pull request against `main`.

The app runs entirely in the browser. Do not commit credentials or user-uploaded artwork. Include new bundled artwork only when you have permission to distribute it.

## Deployment

Cloudflare setup is documented in [README.md](README.md#cloudflare). With the Git integration connected, pushes to `main` build and deploy the app automatically. Domain configuration is separate.

## License

Contributions are licensed under the [MIT license](LICENSE), as in StampStudio.

## Releases

Add a changeset for user-facing changes with `npm run changeset`. Choose `patch` for fixes or `minor` for features and describe the change for users. Internal refactors, documentation, and test-only changes can use `npm run changeset -- --empty`.

On pushes to `main`, the release workflow opens or updates a `chore: version packages` pull request. That PR consumes the changesets, bumps `package.json` and the lockfile, and updates `CHANGELOG.md`. Review and merge it when ready to release. Do not edit version numbers or generated changelog entries manually.

After the version PR merges, the workflow creates a `vX.Y.Z` tag and GitHub release using that version's changelog entry. Re-running it does not duplicate an existing release. The package stays private and is never published to npm.

Cloudflare still deploys every push to `main`, including ordinary feature merges. Releases mark versions; they do not gate deployments. The studio displays the version from `package.json`.

GitHub Actions must have **Allow GitHub Actions to create and approve pull requests** enabled under **Settings → Actions → General → Workflow permissions**. The workflows request their own scoped permissions; the repository's default token permissions can remain read-only. Version PRs created with `GITHUB_TOKEN` do not trigger other Actions workflows automatically. Run the **CI** workflow manually against `changeset-release/main` before merging a version PR.
