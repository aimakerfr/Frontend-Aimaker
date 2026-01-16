#!/usr/bin/env bash
set -euo pipefail

# Deployment script for Vite build output
# - Copies ./dist to /data/sites/doitandshare.com/www

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

TARGET_DIR="/data/sites/doitandshare.com/www"

echo "[deploy_vite_build] Starting deployment from $ROOT_DIR/dist to $TARGET_DIR"

if [[ ! -d "./dist" ]]; then
  echo "ERROR: dist directory not found. Run the build first (scripts/vite_build_simple.sh)." >&2
  exit 1
fi

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  echo "[deploy_vite_build] Using rsync to sync files ..."
  rsync -a --delete ./dist/ "$TARGET_DIR"/
else
  echo "[deploy_vite_build] rsync not found; falling back to rm+cp ..."
  rm -rf "$TARGET_DIR"/*
  cp -a ./dist/. "$TARGET_DIR"/
fi

echo "[deploy_vite_build] Deployment finished: $TARGET_DIR"
