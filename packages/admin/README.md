# MTC Platform Admin Starter

Modern React + shadcn admin starter wired for the Multi-Tenant Commerce (MTC) Platform. The template ships with opinionated
branding hooks, Tailwind CSS, and ready-made layout primitives so teams can white-label the admin workspace in minutes.

## Scripts

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start Vite dev server with hot reloading   |
| `npm run build`   | Type-check then produce production assets |
| `npm run preview` | Preview the production build locally       |

## Features

- React 18 + Vite 5
- Tailwind CSS with shadcn-inspired components
- Brand config stored in `src/config/brand.json`
- Dashboard hero, metrics, and plugin call-to-action blocks
- Layout primitives (sidebar, header) tailored for multi-tenant workflows

## Customisation

Run `npx mtc-admin create-app my-admin --brand "My Company" --scope my-company` to clone the starter and inject branding.
Update `src/config/brand.json` for additional tweaks (navigation, support email, docs link, etc.).
