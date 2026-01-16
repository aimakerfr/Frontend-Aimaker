#!/usr/bin/env bash
set -euo pipefail

# Vite clean build script
# - Removes node_modules and package-lock.json
# - Re-installs dependencies with npm
# - Runs npm run build (Vite build)

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "[vite_build] Starting clean build in: $ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

echo "[vite_build] Running cleanup ..."
sh ./scripts/clean.sh

echo "[vite_build] Installing dependencies (npm install) ..."
npm install

echo "[vite_build] Building (npm run build) ..."
npm run build

echo "[vite_build] Build complete. Output available in ./dist"
