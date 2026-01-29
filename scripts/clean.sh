#!/bin/bash

# Project cleanup script
# - Removes node_modules, package-lock.json, and dist (if present)

# Resolve project root (one level up from this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

cd "$ROOT_DIR" || exit

echo "[clean] Cleaning project at: $ROOT_DIR"

if [ -d node_modules ]; then
  echo "[clean] Removing node_modules/ ..."
  sudo rm -rf node_modules
fi

if [ -f package-lock.json ]; then
  echo "[clean] Removing package-lock.json ..."
  sudo rm -f package-lock.json
fi

if [ -d dist ]; then
  echo "[clean] Removing dist/ ..."
  sudo rm -rf dist
fi

echo "[clean] Done."
