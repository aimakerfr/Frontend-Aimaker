#!/usr/bin/env bash
set -euo pipefail

# Vite dev script
# - Runs cleanup, installs deps, then starts the dev server (npm start)

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "[vite_dev] Starting dev in: $ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

echo "[vite_dev] Running cleanup ..."
bash ./scripts/clean.sh

echo "[vite_dev] Installing dependencies (npm install) ..."
npm install

echo "[vite_dev] Launching dev server (npm start) ..."
echo "[vite_dev] Tip: Vite uses VITE_PORT from .env (current: ${VITE_PORT:-unset})."
npm start
