#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd -P)"
: "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to the worker metadata directory}"
PORT="${PORT:-3000}"

run_timed() {
  local label="$1"
  shift
  printf '[timing] %s\n' "$label"
  /usr/bin/time -p "$@"
}

run_timed 'prepare worker metadata directory' mkdir -p "$OPENCODE_WEB_DIR"
dependency_hash="$(/usr/bin/time -p bash -c 'cat "$@" | sha256sum | cut -d" " -f1' _ package.json package-lock.json)"
dependency_stamp="$OPENCODE_WEB_DIR/dependencies.sha256"
if [[ ! -x node_modules/.bin/vite || ! -f "$dependency_stamp" || "$(cat "$dependency_stamp")" != "$dependency_hash" ]]; then
  run_timed 'install dependencies' npm ci --no-audit --no-fund
  run_timed 'record dependency fingerprint' node --input-type=module -e 'import { writeFileSync } from "node:fs"; writeFileSync(process.argv[1], process.argv[2] + "\\n")' "$dependency_stamp" "$dependency_hash"
fi

run_timed 'build static site' npm run build -- --base ./
run_timed 'write deployment metadata' node --input-type=module -e 'import { writeFileSync } from "node:fs"; writeFileSync(process.argv[1], JSON.stringify({ project: process.argv[2], directory: process.argv[3] }))' "$OPENCODE_WEB_DIR/deployment-output.json" "$PROJECT_DIR" "$PROJECT_DIR/dist"

export PORT
printf '[timing] serve built static site on port %s (foreground)\n' "$PORT"
exec /usr/bin/time -p npm run preview -- --host 0.0.0.0 --port "$PORT" --strictPort
