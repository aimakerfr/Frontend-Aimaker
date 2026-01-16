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

# Deploy build output to target directory
TARGET_DIR="/data/sites/doitandshare.com/www"
echo "[vite_build] Deploying ./dist to $TARGET_DIR ..."

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  # Use rsync for efficient sync and to remove stale files
  rsync -a --delete ./dist/ "$TARGET_DIR"/
else
  # Fallback to cp; manually remove old contents first to avoid stale files
  rm -rf "$TARGET_DIR"/*
  cp -a ./dist/. "$TARGET_DIR"/
fi

echo "[vite_build] Deployment finished: $TARGET_DIR"
