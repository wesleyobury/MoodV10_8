#!/usr/bin/env bash
# dev-v3.sh — one command to test the V3 dev build against your LOCAL backend.
#
# Prereq: the backend is already running on port 8001 in another window:
#   cd backend && source ~/.venvs/mood/bin/activate
#   JWT_SECRET=dev-only-secret uvicorn server:app --host 0.0.0.0 --port 8001
#
# This script: starts a fresh Cloudflare quick tunnel to the backend, writes
# its URL into frontend/.env (API only; Metro is NOT pointed at the tunnel),
# checks /api/health, then starts Metro for the dev client. Ctrl+C stops both.
# Quick tunnels die when the Mac sleeps: just run this again.
# When finished testing: yarn env:prod
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -s -m 5 http://localhost:8001/api/health >/dev/null; then
  echo "✗ Backend is not answering on http://localhost:8001. Start it first (see the top of this script)."
  exit 1
fi

LOG=$(mktemp)
cloudflared tunnel --url http://localhost:8001 >"$LOG" 2>&1 &
CF_PID=$!
trap 'kill $CF_PID 2>/dev/null || true' EXIT

URL=""
for _ in $(seq 1 40); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1 || true)
  [[ -n "$URL" ]] && break
  sleep 1
done
[[ -z "$URL" ]] && { cat "$LOG"; echo "✗ cloudflared did not give a URL"; exit 1; }

printf "EXPO_PUBLIC_API_URL=%s\nEXPO_PUBLIC_BACKEND_URL=%s\nEXPO_USE_FAST_RESOLVER=1\nEXPO_USE_STATIC=false\n" "$URL" "$URL" > .env
echo "→ Tunnel: $URL (written to .env)"

for _ in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$URL/api/health" || true)
  [[ "$CODE" == "200" ]] && break
  sleep 2
done
[[ "$CODE" == "200" ]] || { echo "✗ Tunnel not reachable yet ($CODE). Run the script again."; exit 1; }
echo "✓ Backend reachable through the tunnel"

npx expo start --dev-client --clear "$@"
