#!/usr/bin/env bash
# preflight-build.sh — fail loudly before burning an EAS build cycle
set -euo pipefail

cd "$(dirname "$0")/.."  # always run from frontend/

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
fail() { echo "${RED}✗ $1${RESET}"; exit 1; }
ok()   { echo "${GREEN}✓ $1${RESET}"; }
warn() { echo "${YELLOW}⚠ $1${RESET}"; }

echo "── Preflight checks for EAS build ──"

# 1. Git working tree clean
if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  fail "Uncommitted or untracked changes. EAS archives from git — commit or stash first."
fi
ok "Git tree clean"

# 2. Local branch fully pushed
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
if [[ -z "$REMOTE" ]]; then
  fail "No upstream branch set. Push the branch first: git push -u origin <branch>"
fi
if [[ "$LOCAL" != "$REMOTE" ]]; then
  fail "Local commits not pushed. Run: git push"
fi
ok "Branch pushed to remote"

# 3. .easignore at both expected locations
REPO_ROOT=$(git rev-parse --show-toplevel)
[[ -f "$REPO_ROOT/.easignore" ]] || fail "Missing .easignore at repo root ($REPO_ROOT)"
[[ -f ".easignore" ]] || fail "Missing .easignore at frontend/"
ok ".easignore present at both repo root and frontend/"

# 4. .easignore must list node_modules + ios + android
for IG in "$REPO_ROOT/.easignore" "./.easignore"; do
  grep -q "node_modules" "$IG" || fail "$IG missing node_modules entry"
  grep -q "ios" "$IG"           || fail "$IG missing ios entry"
done
ok ".easignore exclusions correct"

# 5. ios/ and android/ NOT tracked in git (would force bare workflow)
if git ls-files ios/ | grep -q .; then
  fail "ios/ is tracked in git — will trigger bare workflow on EAS. Delete and commit."
fi
if git ls-files android/ | grep -q .; then
  fail "android/ is tracked in git — will trigger bare workflow on EAS. Delete and commit."
fi
ok "ios/ and android/ not tracked (managed workflow preserved)"

# 6. Local Expo modules tracked + have required files
for MOD in modules/mood-healthkit modules/mood-storekit; do
  [[ -d "$MOD" ]] || fail "$MOD directory missing"
  git ls-files "$MOD" | grep -q "package.json"            || fail "$MOD/package.json not tracked"
  git ls-files "$MOD" | grep -q "expo-module.config.json" || fail "$MOD/expo-module.config.json not tracked"
  git ls-files "$MOD" | grep -q "\.podspec$"              || fail "$MOD/*.podspec not tracked (CocoaPods needs this)"
  git ls-files "$MOD" | grep -qE "\.(swift|m|h)$"         || fail "$MOD has no tracked native source files"
done
ok "Local modules tracked with all required files"

# 7. package.json wiring
node -e "
const p = require('./package.json');
const sp = p.expo?.autolinking?.searchPaths || [];
if (!sp.includes('./modules')) { console.error('✗ package.json: expo.autolinking.searchPaths must include \"./modules\"'); process.exit(1); }
const badDeps = Object.keys(p.dependencies || {}).filter(k => /^mood-/.test(k));
if (badDeps.length) { console.error('✗ package.json: remove these from dependencies (use searchPaths instead): ' + badDeps.join(', ')); process.exit(1); }
" || exit 1
ok "package.json autolinking config correct"

# 8. Local autolinking can actually see the modules
echo "── Running autolinking probe (slow) ──"
# Note: subcommand is `search` in SDK 54 (older docs reference `search-modules`,
# which was removed). Stripping ANSI color codes so grep matches reliably.
OUT=$(npx --no-install expo-modules-autolinking search --platform ios 2>&1 | sed -r 's/\x1b\[[0-9;]*m//g')
echo "$OUT" | grep -q "mood-healthkit" || fail "expo-modules-autolinking does not see mood-healthkit"
echo "$OUT" | grep -q "mood-storekit"  || fail "expo-modules-autolinking does not see mood-storekit"
# Reject duplicates — the EXACT bug that killed builds 51-54
if echo "$OUT" | grep -A3 "'mood-healthkit'" | grep -q "duplicates: \[$"; then :; else
  echo "$OUT" | grep -A20 "'mood-healthkit'" | grep -q "duplicates: \[\]" || \
    fail "mood-healthkit has DUPLICATES — remove file: deps OR remove searchPaths (not both)"
fi
ok "Autolinking sees both custom modules with no duplicates"

echo ""
echo "${GREEN}── All preflight checks passed. Safe to run eas build. ──${RESET}"
