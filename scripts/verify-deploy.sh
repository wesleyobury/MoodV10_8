#!/usr/bin/env bash
#
# verify-deploy.sh — binary verification of a preview/prod deploy.
#
# Run this AFTER hitting "Deploy" (or after restarting Metro for a preview).
# Prints the served bundle hash + the current git SHA. If the bundle hash
# matches the one printed on your previous deploy, your changes DID NOT ship.
#
# Usage:
#   ./scripts/verify-deploy.sh                  # default: preview URL, iOS bundle
#   ./scripts/verify-deploy.sh <url>            # check a specific URL
#   ./scripts/verify-deploy.sh <url> ios|web    # pick platform
#
set -euo pipefail

URL="${1:-https://free-tier-limit-2.preview.emergentagent.com}"
PLATFORM="${2:-ios}"

case "$PLATFORM" in
  ios)
    BUNDLE_PATH="/node_modules/expo-router/entry.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable"
    ;;
  android)
    BUNDLE_PATH="/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable"
    ;;
  web)
    BUNDLE_PATH="/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app"
    ;;
  *)
    echo "Unknown platform: $PLATFORM (expected: ios|android|web)" >&2
    exit 1
    ;;
esac

FULL_URL="${URL}${BUNDLE_PATH}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "📦 Fetching bundle: $FULL_URL"
if ! curl -fsSL --max-time 180 "$FULL_URL" -o "$TMP"; then
  echo "❌ Bundle fetch failed. Is Metro up? Is the URL right?" >&2
  exit 2
fi

BYTES=$(wc -c < "$TMP" | tr -d ' ')
HASH=$(shasum -a 256 "$TMP" | cut -d' ' -f1)

GIT_SHA="(unknown)"
if command -v git >/dev/null 2>&1; then
  if GIT_SHA_TRY=$(git -C "$(dirname "$0")/.." rev-parse --short HEAD 2>/dev/null); then
    GIT_SHA="$GIT_SHA_TRY"
  fi
fi

echo ""
echo "========================================"
echo "  Deploy Verification"
echo "========================================"
echo "  URL          : $URL"
echo "  Platform     : $PLATFORM"
echo "  Bundle bytes : $BYTES"
echo "  Bundle sha256: $HASH"
echo "  Git SHA      : $GIT_SHA"
echo "  Timestamp    : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "========================================"
echo ""
echo "✅ If this sha256 differs from your previous deploy's, the deploy shipped."
echo "❌ If it's identical, nothing actually changed — try again or check cache."
