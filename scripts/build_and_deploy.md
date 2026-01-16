# Build & deploy (quick guide)

This is a short guide to build the frontend with Vite and deploy the output to the server web root.

- Build output: `./dist` (see `vite.config.ts`)
- Deploy target: `/data/sites/doitandshare.com/www`

## Quick (recommended)

Run these on the server, from the repo path.

### Option 1: Clean + build + deploy

```bash
cd /data/sites/doitandshare.com/Frontend-Aimaker; \
sudo git pull; \
sudo sh ./scripts/build_and_deploy.sh -c
```

### Option 2: Build + deploy (no clean)

```bash
cd /data/sites/doitandshare.com/Frontend-Aimaker; \
sudo git pull; \
sudo sh ./scripts/build_and_deploy.sh
```

The wrapper will optionally clean (`scripts/clean.sh`), build (`scripts/vite_build_simple.sh`), then deploy (`scripts/deploy.sh`).

## Manual build only

```bash
npm install
npm run build -- --mode doitandshare
```

Notes:
- Mode `doitandshare` loads `.env.doitandshare` (e.g., sets `VITE_API_URL=https://back.doitandshare.com/`).
- Output goes to `./dist`.

## Manual deploy (copy) only

Run this after a successful build (i.e., when `./dist` exists).

Using rsync (preferred):

```bash
sudo rsync -a --delete ./dist/ /data/sites/doitandshare.com/www/
```

Fallback without rsync:

```bash
sudo mkdir -p /data/sites/doitandshare.com/www
sudo rm -rf /data/sites/doitandshare.com/www/*
sudo cp -a ./dist/. /data/sites/doitandshare.com/www/
```

Alternatively, use the script:

```bash
sudo ./scripts/deploy.sh
```

## Additional notes
- Use `sudo` if your user lacks permissions for `/data/sites/doitandshare.com/www`.
- Adjust paths or mode as needed for other environments.
