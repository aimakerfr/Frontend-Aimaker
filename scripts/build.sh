#!/usr/bin/env bash
set -euo pipefail

# Simple Docker build script for Frontend-Aimaker
# Defaults:
#  - Builds a multi-arch (linux/amd64,linux/arm64) image using Docker Buildx
#  - Tags the image as frontend-aimaker:dev
#  - Produces a single OCI archive containing the multi-arch image at ./dist-images/frontend-aimaker-dev.multi-arch.oci.tar
#
# Note: Loading a true multi-arch image into the local Docker engine requires pushing to a registry.
# This script therefore exports an OCI archive. If you need to push later, you can use:
#   docker buildx build --platform "$PLATFORMS" -t "$TAG" -f "$DOCKERFILE" "$CONTEXT" --push

TAG="${TAG:-frontend-aimaker:dev}"
DOCKERFILE="${DOCKERFILE:-./Dockerfile}"
CONTEXT="${CONTEXT:-.}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
OUTPUT_DIR="${OUTPUT_DIR:-./dist-images}"
OUTPUT_FILE="${OUTPUT_FILE:-frontend-aimaker-dev.multi-arch.oci.tar}"

usage() {
  cat <<EOF
Usage: $0 [options]

Options (env var overrides in parentheses):
  --tag <name:tag>           Image tag (TAG) [default: frontend-aimaker:dev]
  --file <Dockerfile>        Dockerfile path (DOCKERFILE) [default: ./Dockerfile]
  --context <dir>            Build context (CONTEXT) [default: .]
  --platforms <list>         Target platforms (PLATFORMS) [default: linux/amd64,linux/arm64]
  --output-dir <dir>         Output directory for OCI archive (OUTPUT_DIR) [default: ./dist-images]
  --output-file <filename>   Output OCI archive filename (OUTPUT_FILE) [default: frontend-aimaker-dev.multi-arch.oci.tar]
  -h, --help                 Show this help

Examples:
  $0
  TAG=frontend-aimaker:dev $0 --platforms linux/arm64
  $0 --tag myrepo/frontend-aimaker:dev --file ./Dockerfile --context .
EOF
}

# Parse simple CLI args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="$2"; shift 2 ;;
    --file)
      DOCKERFILE="$2"; shift 2 ;;
    --context)
      CONTEXT="$2"; shift 2 ;;
    --platforms)
      PLATFORMS="$2"; shift 2 ;;
    --output-dir)
      OUTPUT_DIR="$2"; shift 2 ;;
    --output-file)
      OUTPUT_FILE="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

# Check docker & buildx availability
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not in PATH" >&2
  exit 1
fi

if ! docker buildx version >/dev/null 2>&1; then
  echo "ERROR: docker buildx is not available. Install Docker Desktop >= 2.4 or docker buildx plugin." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Building multi-arch image: $TAG"
echo "  Dockerfile : $DOCKERFILE"
echo "  Context    : $CONTEXT"
echo "  Platforms  : $PLATFORMS"
echo "  Output OCI : $OUTPUT_DIR/$OUTPUT_FILE"

# Build multi-arch into a single OCI archive (no push)
docker buildx build \
  --platform "$PLATFORMS" \
  -t "$TAG" \
  -f "$DOCKERFILE" \
  "$CONTEXT" \
  --output "type=oci,dest=${OUTPUT_DIR}/${OUTPUT_FILE}"

echo "\nBuild complete. OCI archive created at: ${OUTPUT_DIR}/${OUTPUT_FILE}"
echo "To push to a registry instead (not performed by this script), run:"
echo "  docker buildx build --platform $PLATFORMS -t $TAG -f $DOCKERFILE $CONTEXT --push"
