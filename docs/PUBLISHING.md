# Publishing guide

The platform intentionally avoids automated `npm publish` or release tagging. Publishing is a manual, audited flow so we can
walk through npm auth, dist inspection, and GitHub tagging before anything goes live. This document captures the exact steps
for every package in the monorepo.

## 1. Authenticate with npm (manual)

```bash
npm logout                 # optional if you want to ensure a clean session
npm login --scope=@mtc-platform
```

Make sure your npm token has publish permissions for the `@mtc-platform` scope (or the alternative scope supplied via
`--scope`).

## 2. Build everything

From the repo root:

```bash
npm install
npm run build:all
```

`build:all` runs the admin starter, plugin SDK, admin CLI, and the sample Stripe plugin builds sequentially.

## 3. Prepare tarballs (no automatic publish)

Use the helper scripts to create `.tgz` files. They stop before calling `npm publish`:

- `scripts/publish-single.sh <package-dir>` – builds + packs a single package
- `scripts/publish-all.sh` – iterates over admin, plugin SDK, admin CLI, and `examples/stripe-plugin`

Each run prints the exact `npm publish` command, along with the tag + push instructions. The tarballs land in
`<package>/dist/releases/` so you can inspect them before uploading.

## 4. Optional: `mtc-admin plugin publish:prepare`

When working inside a plugin (new or sample) you can call the CLI directly instead of the bash scripts:

```bash
cd plugins/stripe-gateway
npx mtc-admin plugin publish:prepare .
```

It mirrors `publish-single.sh`: builds, packs into `dist/releases`, and prints manual instructions.

## 5. Manual publish workflow

For each tarball you created:

```bash
cd packages/admin-cli   # or the specific package directory
npm publish dist/releases/<file>.tgz --access public
```

Repeat for:

1. `packages/admin`
2. `packages/plugin-sdk`
3. `packages/admin-cli`
4. Any sample plugins you want to share publicly (e.g. `examples/stripe-plugin`)

## 6. GitHub push checklist

1. Commit the generated `dist/` artifacts for every package. These are required for consumers installing from GitHub.
2. Use the commit message: **`feat: production-ready MTC Platform admin`**.
3. Tag each package once published: `git tag -a <package-name>@<version> -m "release: <package-name> v<version>"`.
4. Push the branch and tags to GitHub: `git push origin HEAD --tags`.

## 7. Version bumps

Use `scripts/version-bump.sh <new-version>` to update `package.json` files across the repo. Follow up with a changelog / PR.

## 8. Final verification

- Install the CLI via `npx @mtc-platform/admin-cli --help` and confirm the version number
- Install the admin starter via `npm create mtc-admin@latest` (after publishing the CLI)
- Re-run `npm run build:all` locally to ensure no untracked files remain

> ✅ Manual publishing ensures we review every artifact and keeps the release process compliant with internal governance
> while still providing convenient scripts to remove the repetitive shell work.
