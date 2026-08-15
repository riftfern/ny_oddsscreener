#!/usr/bin/env bash
# Mock demo / Loom. Does not go through turbo.
# turbo run dev loads apps/api/.env into the API task, so a live
# USE_MOCK_DATA=false there used to override this script and burn credits.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export USE_MOCK_DATA=true
export REQUIRE_AUTH=false
export DEV_PLAN=pro
export VITE_DEV_PLAN=pro
export VITE_REQUIRE_AUTH=false

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "LineEdge demo (MOCK) — http://localhost:3000   API :3001"
if [ -n "${LAN_IP}" ]; then
  echo "Phone on same Wi‑Fi — http://${LAN_IP}:3000"
fi
echo "USE_MOCK_DATA=true — apps/api/.env cannot flip this back to live"

# Same two-process recipe as the Gate 7 handoff, one script.
# Env is on the child command line so dotenv.config() will not override it.
(
  cd "$ROOT/apps/api"
  exec env USE_MOCK_DATA=true REQUIRE_AUTH=false DEV_PLAN=pro pnpm exec tsx watch src/index.ts
) &
API_PID=$!

(
  cd "$ROOT/apps/web"
  exec env VITE_DEV_PLAN=pro VITE_REQUIRE_AUTH=false pnpm exec vite
) &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  wait "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
