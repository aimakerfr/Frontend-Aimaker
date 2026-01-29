#!/bin/bash
set -euo pipefail

# Vite build script
# - Cleans workspace
# - Installs dependencies (npm install)
# - Runs npm run build:doitandshare (Vite build)

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "[vite_build] Starting build in: $ROOT_DIR"
pwd

echo "[vite_build] Running cleanup (scripts/clean.sh) ..."
sudo bash "$ROOT_DIR"/scripts/clean.sh

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

echo "[vite_build] Installing dependencies (npm install) ..."
npm install

echo "[vite_build] Building with mode 'doitandshare' (npm run build:doitandshare) ..."
npm run build:doitandshare

echo "[vite_build] Build complete. Output available in ./dist"
