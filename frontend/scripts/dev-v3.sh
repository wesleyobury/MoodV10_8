#!/usr/bin/env bash
# dev-v3.sh — test the V3 dev build against your LOCAL backend. One command.
#
# Prereq: the backend is running on port 8001 in another window:
#   cd backend && source ~/.venvs/mood/bin/activate
#   JWT_SECRET=dev-only-secret uvicorn server:app --host 0.0.0.0 --port 8001
#
# Default: phone and Mac on the same Wi-Fi. The app talks to the backend at
# http://<your Mac's Wi-Fi IP>:8001 (no tunnel), then Metro starts for the
# dev client. Ctrl+C stops it. When finished testing: yarn env:prod
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -s -m 5 http://localhost:8001/api/health >/dev/null; then
  echo "✗ Backend is not answering on http://localhost:8001. Start it first (see the top of this script)."
  exit 1
fi

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
[[ -z "$IP" ]] && { echo "✗ Couldn't find your Mac's Wi-Fi IP. Is Wi-Fi on?"; exit 1; }
URL="http://$IP:8001"

if ! curl -s -m 5 "$URL/api/health" >/dev/null; then
  echo "✗ Backend not reachable at $URL. In System Settings > Network > Firewall, allow Python, then run again."
  exit 1
fi

printf "EXPO_PUBLIC_API_URL=%s\nEXPO_PUBLIC_BACKEND_URL=%s\nEXPO_USE_FAST_RESOLVER=1\nEXPO_USE_STATIC=false\n" "$URL" "$URL" > .env
echo "✓ Backend: $URL (written to .env)"
echo "→ On your iPhone (same Wi-Fi): swipe MOOD away, then scan the QR code below."

npx expo start --dev-client --clear "$@"
