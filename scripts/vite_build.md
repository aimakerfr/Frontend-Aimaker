# Vite build & deploy script

This document explains how to use `scripts/vite_build.sh` to build the frontend with Vite and deploy the output to the web root on the server.

## What the script does
- Cleans the project using `scripts/clean.sh`.
- Installs dependencies with `npm install`.
- Runs the Vite build (`npm run build`), which outputs to `./dist` (see `vite.config.ts`).
- Deploys the contents of `./dist` to `/data/sites/doitandshare.com/www`.
  - Uses `rsync -a --delete` if available (preferred for speed and removing stale files).
  - Falls back to removing old files and copying with `cp -a`.

## Prerequisites
- Node.js/npm available on the machine running the script.
- Sufficient permissions to write to `/data/sites/doitandshare.com/www`.
- Optional but recommended: `rsync` installed.

## How to run

Use this first snippet from the server/project path (example):

```bash
cd /data/sites/doitandshare.com/frontend_project/Frontend-Aimaker
sudo git pull
chmod +x scripts/vite_build.sh
./scripts/vite_build.sh --clean-then-simple
```

From the project root (when you are already inside the repo directory):

```bash
bash scripts/vite_build.sh
```

This script builds with Vite mode `doitandshare`, which makes Vite load the env file `.env.doitandshare`.
That file sets:

```bash
VITE_API_URL=https://back.doitandshare.com/
```

If you run Vite manually, use:

```bash
npm run build -- --mode doitandshare
```

### Run clean first, then a simple build

You can ask `vite_build.sh` to run the cleanup first and then delegate to a simpler build script that does just `npm run build` and deploy:

```bash
bash scripts/vite_build.sh --clean-then-simple
```

Shorthand:

```bash
bash scripts/vite_build.sh -c
```

Because the cleanup uses `sudo`, you might need to run the whole command with elevated privileges depending on your environment:

```bash
sudo bash scripts/vite_build.sh --clean-then-simple
```

If you need elevated permissions for the deployment step (writing to `/data/sites/doitandshare.com/www`), run with `sudo`:

```bash
sudo bash scripts/vite_build.sh
```

Or, make the script executable and run it directly:

```bash
chmod +x scripts/vite_build.sh
./scripts/vite_build.sh
```

With `sudo`:

```bash
sudo ./scripts/vite_build.sh
```

Or with the clean-then-simple flag:

```bash
sudo ./scripts/vite_build.sh --clean-then-simple
```

## Notes
- The output directory is configured in `vite.config.ts` (`build.outDir: 'dist'`). If you change it, update the script accordingly.
- The build script now uses `.env.doitandshare` automatically via `--mode doitandshare`, ensuring `VITE_API_URL` is set to `https://back.doitandshare.com/` during the build.
- The script is idempotent for deployment when `rsync` is available; it will delete files in the target that no longer exist in `dist`.

### What does the simple build do now?
- `scripts/vite_build_simple.sh` installs dependencies and builds only:
  - Installs dependencies with `npm install`.
  - Runs `npm run build -- --mode doitandshare` (loading `.env.doitandshare`).

### How is deployment done now?
- Deployment is handled by a separate script: `scripts/deploy_vite_build.sh`.
- The wrapper `scripts/vite_build.sh` will:
  1. Optionally run cleanup when `--clean-then-simple` (or `-c`) is passed.
  2. Run `scripts/vite_build_simple.sh` to produce `./dist`.
  3. Run `scripts/deploy_vite_build.sh` to sync `./dist` to `/data/sites/doitandshare.com/www`.

You can also run deployment manually if you have already built:

```bash
bash scripts/deploy_vite_build.sh
```
