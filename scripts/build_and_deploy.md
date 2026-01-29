# Build & deploy (quick guide)

This is a short guide to build the frontend with Vite and deploy the output to the server web root.

- Build output: `./dist` (see `vite.config.ts`)
- Deploy target: `/data/sites/doitandshare.com/build`

## I. Main Deployment Process (recommended)

Run these on the server, from the repo path. The wrapper runs a clean (via `vite_build.sh`) before building.

### Option 1: Clean + build + deploy (defaults to `/build`)

```bash
cd /data/sites/doitandshare.com/Frontend-Aimaker; \
sudo git pull; \
sudo bash ./scripts/build_and_deploy.sh
```

### Option 2: Deploy to a custom target

```bash
cd /data/sites/doitandshare.com/Frontend-Aimaker; \
sudo git pull; \
sudo bash ./scripts/build_and_deploy.sh --target /path/to/your/dir
```

The wrapper cleans (`scripts/clean.sh`), builds (`scripts/vite_build.sh`), then deploys (`scripts/deploy.sh`). Extra flags are forwarded to `deploy.sh` (e.g., `-a` or `--target`).

## II. Individual scripts

1. Clean

```bash
sudo bash ./scripts/clean.sh
```

2. Clean + Build (Vite build always runs clean first)

```bash
sudo bash ./scripts/vite_build.sh
```

3. Deploy to custom target (e.g., `/data/sites/doitandshare.com/build`)

```bash
sudo bash ./scripts/deploy.sh --target /data/sites/doitandshare.com/build
```

## III. Manual build only

```bash
sudo npm install
sudo npm run build -- --mode doitandshare
```

Notes:
- Mode `doitandshare` loads `.env.doitandshare` (e.g., sets `VITE_API_URL=https://back.doitandshare.com/`).
- Output goes to `./dist`.

## IV. Manual deploy (copy) only

Run this after a successful build (i.e., when `./dist` exists).

Using rsync (preferred):

```bash
sudo rsync -a --delete ./dist/ /data/sites/doitandshare.com/build/
```

Fallback without rsync:

```bash
sudo mkdir -p /data/sites/doitandshare.com/build
sudo rm -rf /data/sites/doitandshare.com/build/*
sudo cp -a ./dist/. /data/sites/doitandshare.com/build/
```

Alternatively, use the script (supports `-a` for `/build` or `--target <dir>` for custom locations):

```bash
sudo bash ./scripts/deploy.sh
```

## V. Additional notes
- Use `sudo` if your user lacks permissions for `/data/sites/doitandshare.com/build`.
- Adjust paths or mode as needed for other environments.
