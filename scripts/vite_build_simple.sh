#!/bin/bash

# Vite simple build script
# - Assumes deps are already installed
# - Runs npm run build (Vite build)
# - Note: Deployment is now handled by scripts/deploy.sh

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR" || exit

echo "[vite_build_simple] Starting simple build in: $ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

echo "[vite_build_simple] Installing dependencies (npm install) ..."
npm install

echo "[vite_build_simple] Building with mode 'doitandshare' (npm run build -- --mode doitandshare) ..."
npm run build -- --mode doitandshare

echo "[vite_build_simple] Build complete. Output available in ./dist"
