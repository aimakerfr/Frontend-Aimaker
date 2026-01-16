#!/bin/bash

# Vite simple build script
# - Assumes deps are already installed
# - Runs npm run build (Vite build)

echo "[vite_build_simple] Starting simple build in: $ROOT_DIR"
pwd

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

echo "[vite_build_simple] Installing dependencies (npm install) ..."
npm install

echo "[vite_build_simple] Building with mode 'doitandshare' (npm run build -- --mode doitandshare) ..."
npm run build -- --mode doitandshare

echo "[vite_build_simple] Build complete. Output available in ./dist"
