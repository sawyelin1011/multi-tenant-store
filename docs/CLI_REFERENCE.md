# MTC Admin CLI Reference

`mtc-admin` bundles the workflows required to ship a branded admin workspace together with production-ready plugins. It is
installed automatically via the monorepo, but it is also designed to run through `npx mtc-admin` after you build/publish the
CLI package.

## Global flags

Most commands accept a consistent set of brand overrides so you can white-label generated assets without editing templates
by hand:

| Flag                | Description                              |
| ------------------- | ---------------------------------------- |
| `--brand`           | Display name used inside generated UIs   |
| `--scope`           | NPM scope applied to package manifests   |
| `--platform-name`   | Platform display name override           |
| `--docs-url`        | Documentation URL used in templates      |
| `--support-email`   | Support email injected into READMEs/UIs |

## Commands

### `mtc-admin create-app <name>`

Scaffolds the React + shadcn admin starter from `packages/admin`.

```bash
npx mtc-admin create-app my-admin \
  --brand "Acme Commerce" \
  --scope acme-commerce
```

The command copies the starter into `./my-admin`, updates `package.json`, and rewrites `src/config/brand.json` so the UI is
pre-branded. Follow-up commands are printed in the terminal (`npm install`, `npm run dev`).

### `mtc-admin plugin scaffold --type <type> <name>`

Creates a new plugin that already wires up manifests, hooks, admin UI entries, and sample migrations for the selected type.

```bash
npx mtc-admin plugin scaffold stripe-gateway \
  --type payment \
  --directory ./plugins \
  --brand "Acme" \
  --scope acme
```

Type values: `payment`, `auth`, `analytics`, `integration`, `ui`, `workflow`, `delivery`, `email`, `cms`, `utility`.

Each scaffold includes:

- `plugin.json` with sample hooks + admin components
- Source files for hooks, API routes, widgets, and migrations
- `README.md`, `tsconfig.json`, and a scoped `package.json`

### `mtc-admin plugin add component <plugin-path> <component-name>`

Drops a new admin component into `src/admin/components` and registers it in `plugin.json`.

```bash
npx mtc-admin plugin add component ./plugins/stripe-gateway gateway-runtime --kind widget --dashboard analytics
```

Use `--kind menu` to register the component as a navigation item instead of a dashboard widget.

### `mtc-admin plugin dev [plugin-path]`

Runs `npm run dev` inside the plugin directory (defaults to the current working directory).

### `mtc-admin plugin build [plugin-path]`

Runs `npm run build` inside the plugin directory.

### `mtc-admin plugin publish:prepare [plugin-path]`

Builds the plugin (unless `--skip-build` is supplied) and runs `npm pack --pack-destination dist/releases`. It never calls
`npm publish`; instead, it prints the manual steps (publish, tag, push) so you can handle releases yourself.

### `mtc-admin plugin migration:create <plugin-path> <name>`

Creates a timestamped SQL migration under `migrations/` and appends the relative path to `plugin.json > database_migrations`.

```bash
npx mtc-admin plugin migration:create ./plugins/stripe-gateway add-charge-table --table stripe_charges
```

### `mtc-admin plugin dev/build/publish` quick start

```bash
cd plugins/stripe-gateway
npx mtc-admin plugin dev .        # watch + compile
npx mtc-admin plugin build .      # production build
npx mtc-admin plugin publish:prepare .
```

> **Tip:** `npm run build:all` at the repo root will build the admin starter, CLI, SDK, and the sample plugins in one shot.
