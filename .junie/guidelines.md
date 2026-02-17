# Project Guidelines

## Overview
- Monorepo frontend (TypeScript + React) built with `vite`.
- Main code lives in `apps/` (app UIs) and `core/` (shared code).
- Docs live in `docs/` and root `*.md` files (see `README.md`, `QUICKSTART.md`, `ARCHITECTURE.md`).

## Repo structure (high level)
- `apps/`: Vite + React application UIs (routing, views/screens, UI components).
  - Example apps: `apps/fablab`, `apps/auth`.
- `core/`: shared TypeScript library used by the apps.
  - Contains cross-app logic like `api/` (HTTP client + API types), `auth/` (hooks/store/token refresh), and domain modules that fetch and process data.

## `apps/fablab` (high level)
- `FabLabApp.tsx`: app shell + routing (Sidebar/Header layout and feature routes).
- `components/`: shared UI used across FabLab views (e.g., `Sidebar`, `Header`, chat/context).
- `views/`: feature-area screens, grouped by domain (e.g., `library/`, `notebook/`, `prompt/`, `assistant/`, `projects/`, `project/`, `public/`, `server-tools/`, `rag_multimodal/`).
  - Feature folders often contain their own `components/`, `services/`, `types.ts` (and sometimes `constants/`).
- `services/`: FabLab-scoped services (calls/wrappers used by the app).
- `language/`: i18n context, translations, and locale resources.
- `types.ts`: shared FabLab types.

## How to work in this repo (development only)
- Prefer the smallest possible change that solves the issue.
- Keep changes scoped to the relevant app under `apps/` and shared logic in `core/`.
- Match existing code style in the touched file (formatting, imports, naming).

## Verification (development)
- If you change TypeScript/React code, ensure it type-checks and builds.
- Run the shortest relevant check:
  - `npm test` (if present) or the closest scoped test command.
  - Otherwise `npm run build` (or the project’s existing build script in `package.json`).

## Out of scope
- Do not add deployment/runbook instructions here (see `DEPLOY.md` and `scripts/`).
