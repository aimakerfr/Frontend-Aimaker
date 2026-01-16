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

From the project root:

```bash
bash scripts/vite_build.sh
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

## Notes
- The output directory is configured in `vite.config.ts` (`build.outDir: 'dist'`). If you change it, update the script accordingly.
- Ensure environment variables for your build (e.g., `VITE_API_URL`) are set before running the script if your project relies on them.
- The script is idempotent for deployment when `rsync` is available; it will delete files in the target that no longer exist in `dist`.
