#!/bin/bash

DEFAULT_TARGET_DIR="/data/sites/doitandshare.com/build"
ALTERNATIVE_TARGET_DIR="/data/sites/doitandshare.com/build"
TARGET_DIR="$DEFAULT_TARGET_DIR"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [target_dir]

Options:
  -a, --alternative   Use alternative target: $ALTERNATIVE_TARGET_DIR
  -t, --target DIR    Deploy to the specified target directory
  -h, --help          Show this help message

Positional arguments:
  target_dir          Overrides the target directory (same as --target)
EOF
  exit ${1:-0}
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--alternative)
      TARGET_DIR="$ALTERNATIVE_TARGET_DIR"
      shift
      ;;
    -t|--target)
      if [[ -z "${2:-}" ]]; then
        echo "ERROR: --target requires a directory path." >&2
        usage 1
      fi
      TARGET_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage 0
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

echo "[deploy] Starting deployment from /dist to $TARGET_DIR"

if [[ ! -d "./dist" ]]; then
  echo "ERROR: dist directory not found. Run the build first (scripts/vite_build.sh)." >&2
  exit 1
fi

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

if command -v rsync >/dev/null 2>&1; then
  echo "[deploy] Using rsync to sync files ..."
  # Remove index.html and assets to ensure they are replaced, but keep other files
  rm -rf "$TARGET_DIR/index.html" "$TARGET_DIR/assets"
  rsync -a ./dist/ "$TARGET_DIR"/
else
  echo "[deploy] rsync not found; falling back to rm+cp ..."
  # Remove index.html and assets to ensure they are replaced, but keep other files
  rm -rf "$TARGET_DIR/index.html" "$TARGET_DIR/assets"
  cp -a ./dist/. "$TARGET_DIR"/
fi

echo "[deploy] Deployment finished: $TARGET_DIR"
