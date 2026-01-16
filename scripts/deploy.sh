#!/bin/bash

TARGET_DIR="/data/sites/doitandshare.com/www"

echo "[deploy] Starting deployment from /dist to $TARGET_DIR"

if [[ ! -d "./dist" ]]; then
  echo "ERROR: dist directory not found. Run the build first (scripts/vite_build_simple.sh)." >&2
  exit 1
fi

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  echo "[deploy] Using rsync to sync files ..."
  rsync -a --delete ./dist/ "$TARGET_DIR"/
else
  echo "[deploy] rsync not found; falling back to rm+cp ..."
  rm -rf "$TARGET_DIR":?/*
  cp -a ./dist/. "$TARGET_DIR"/
fi

echo "[deploy] Deployment finished: $TARGET_DIR"
