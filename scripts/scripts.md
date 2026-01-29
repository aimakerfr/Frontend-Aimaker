# Scripts Guide

This document describes the shell scripts in the `scripts/` directory, their business logic, and quick run snippets.

I. clean.sh
- Purpose: Project cleanup. Removes `node_modules`, `package-lock.json`, and `dist` to ensure a fresh state.
- Business logic:
  - Resolves project root (one level up from `scripts/`).
  - Deletes `node_modules/`, `package-lock.json`, and `dist/` if they exist.
- Quick run:
  - bash scripts/clean.sh
  - sudo may be required if files were created with elevated permissions.

II. vite_build.sh
- Purpose: Install dependencies and build the frontend with Vite in the `doitandshare` mode.
- Business logic:
  - Resolves project root.
  - Verifies `npm` availability.
  - Runs `npm install`.
  - Runs `npm run build -- --mode doitandshare` and outputs to `./dist`.
- Quick run:
  - bash scripts/vite_build.sh

III. deploy.sh
- Purpose: Deploy the built assets in `./dist` to the server web root.
- Business logic:
  - Resolves project root.
  - Checks that `./dist` exists; aborts if missing.
  - Default target directory: `/data/sites/doitandshare.com/www`.
  - `-a/--alternative` sets target to `/data/sites/doitandshare.com/build`.
  - `-t/--target <dir>` (or positional `<dir>`) overrides the target directory.
  - If `rsync` is available: `rsync -a --delete ./dist/ <target>/`.
  - Else: falls back to `rm -rf` + `cp -a` to mirror contents.
- Quick run:
  - sudo bash scripts/deploy.sh
  - sudo bash scripts/deploy.sh -a                     # deploy to /build
  - sudo bash scripts/deploy.sh --target /custom/path  # custom target
  - Note: Requires permissions to write to the chosen target directory.

IV. build_and_deploy.sh
- Purpose: Wrapper to optionally clean, then build, then deploy — all in one.
- Business logic:
  - Resolves project root.
  - Optional flag `--clean-then-simple` or `-c` to run `scripts/clean.sh` first.
  - Runs `scripts/vite_build.sh` to build.
  - Forwards any remaining args to `scripts/deploy.sh` (e.g., `-a`, `--target`).
- Quick run:
  - sudo bash scripts/build_and_deploy.sh                 # build + deploy
  - sudo bash scripts/build_and_deploy.sh -c              # clean + build + deploy
  - sudo bash scripts/build_and_deploy.sh -a              # build + deploy to /build
  - sudo bash scripts/build_and_deploy.sh -c --target /custom/path

V. vite_dev.sh
- Purpose: Start a clean development environment and launch Vite dev server.
- Business logic:
  - Uses strict shell options (`set -euo pipefail`).
  - Resolves project root and verifies `npm` availability.
  - Runs cleanup via `scripts/clean.sh`.
  - Installs dependencies with `npm install`.
  - Launches dev server with `npm start`.
  - Notes Vite port via `VITE_PORT` from `.env` if set.
- Quick run:
  - bash scripts/vite_dev.sh

Notes
- Paths and modes are tailored for the `doitandshare` deployment target. Adjust as needed for other environments.
- Use `sudo` when interacting with locations requiring elevated permissions (e.g., deployment directory).