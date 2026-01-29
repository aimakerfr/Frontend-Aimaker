#!/bin/sh

# Usage: build_and_deploy.sh [--clean-then-simple|-c] [deploy-options]
#   --clean-then-simple / -c  -> runs 'sudo bash ./scripts/clean.sh' first, then build, then deploy
#   deploy-options            -> forwarded to scripts/deploy.sh (e.g., -a, --target /custom/path)

# If requested, run clean then delegate to simple build script
if [ "${1:-}" = "--clean-then-simple" ] || [ "${1:-}" = "-c" ]; then
  echo "[build_and_deploy] --clean-then-simple flag detected: running cleanup, then simple build..."
  sudo bash ./scripts/clean.sh || exit 1
  shift
fi

echo "[build_and_deploy] Running scripts/vite_build.sh (build only)"
sudo bash ./scripts/vite_build.sh || exit 1

echo "[build_and_deploy] Running scripts/deploy.sh (deploy)"
sudo bash ./scripts/deploy.sh "$@" || exit 1

# Legacy inline logic has been replaced by the two scripts above.
