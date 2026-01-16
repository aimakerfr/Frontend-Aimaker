#!/bin/bash

# Build & Deploy wrapper script
# - Optionally cleans project (when --clean-then-simple or -c is passed)
# - Runs scripts/vite_build.sh to install deps and build (Vite)
# - Runs scripts/deploy.sh to deploy ./dist to /data/sites/doitandshare.com/www

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR" || exit

echo "[build_and_deploy] Starting in: $ROOT_DIR"

# Usage: build_and_deploy.sh [--clean-then-simple|-c]
#   --clean-then-simple / -c  -> runs 'sudo sh ./scripts/clean.sh' first, then build, then deploy

# If requested, run clean then delegate to simple build script
if [[ "${1:-}" == "--clean-then-simple" || "${1:-}" == "-c" ]]; then
  echo "[build_and_deploy] --clean-then-simple flag detected: running cleanup, then simple build..."
  sudo sh ./scripts/clean.sh
fi

echo "[build_and_deploy] Running scripts/vite_build_simple.sh (build only)"
sudo sh ./scripts/vite_build.sh || exit 1

echo "[build_and_deploy] Running scripts/deploy.sh (deploy)"
sudo sh ./scripts/deploy.sh || exit 1

# Legacy inline logic has been replaced by the two scripts above.
