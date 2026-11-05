#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"
: "${CAPTURE_URL:?CAPTURE_URL must be the exact preview URL}"
: "${CAPTURE_DIR:?CAPTURE_DIR must point outside the project source}"

printf '[timing] prepare capture directory\n'
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-header.topbar}"
export CAPTURE_STRICT=1

printf '[timing] capture desktop and mobile views from %s\n' "$CAPTURE_URL"
exec /usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"
