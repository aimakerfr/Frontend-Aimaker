#!/bin/bash

# Vite clean build script
# - Removes node_modules and package-lock.json
# - Re-installs dependencies with npm
# - Runs npm run build (Vite build)

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR" || exit

echo "[vite_build] Starting clean build in: $ROOT_DIR"

# Usage: vite_build.sh [--clean-then-simple]
#   --clean-then-simple  -> runs 'sudo sh ./scripts/clean.sh' first, then delegates to vite_build_simple.sh

# If requested, run clean then delegate to simple build script
if [[ "${1:-}" == "--clean-then-simple" || "${1:-}" == "-c" ]]; then
  echo "[vite_build] --clean-then-simple flag detected: running cleanup, then simple build..."
  sudo sh ./scripts/clean.sh
fi
echo "[vite_build] Running scripts/vite_build_simple.sh (build only)"
sudo sh ./scripts/vite_build_simple.sh || exit 1

echo "[vite_build] Running scripts/deploy_vite_build.sh (deploy)"
sudo sh ./scripts/deploy_vite_build.sh || exit 1

# The legacy inline build+deploy logic has been removed in favor of the two scripts above.
