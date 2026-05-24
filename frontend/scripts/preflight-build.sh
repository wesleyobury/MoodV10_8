#!/usr/bin/env bash
# preflight-build.sh — fail loudly before burning an EAS build cycle.
#
# Architecture this script validates (post bug-busters-13 fix):
#   • Local Expo modules live under  frontend/modules/<name>/
#   • NO yarn workspaces, NO file: deps, NO node_modules cp-RL hack.
#   • Expo autolinking auto-scans ./modules by default
#     (see node_modules/expo-modules-autolinking/build/commands/autolinkingOptions.js:164).
#   • A single .easignore lives at frontend/.easignore and has /ios/ + /android/
#     anchored so it does NOT strip modules/*/ios/ on upload.
#   • frontend/.gitignore mirrors the same anchoring so expo prebuild + other
#     tooling that consults .gitignore can't wipe modules/*/ios/ either.
#   • A postinstall verifier (scripts/verify-local-modules.js) hard-fails the
#     install if any iOS source file is missing on disk.
set -euo pipefail

cd "$(dirname "$0")/.."  # always run from frontend/

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
fail() { echo "${RED}✗ $1${RESET}"; exit 1; }
ok()   { echo "${GREEN}✓ $1${RESET}"; }
warn() { echo "${YELLOW}⚠ $1${RESET}"; }

echo "── Preflight checks for EAS build ──"

# 1. Git working tree clean (EAS archives from git)
if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  fail "Uncommitted or untracked changes. EAS archives from git — commit or stash first."
fi
ok "Git tree clean"

# 2. Local branch fully pushed
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
[[ -z "$REMOTE" ]] && fail "No upstream branch set. Push first: git push -u origin <branch>"
[[ "$LOCAL" != "$REMOTE" ]] && fail "Local commits not pushed. Run: git push"
ok "Branch pushed to remote"

# 3. .easignore must exist at frontend/ ONLY (root .easignore was intentionally removed)
[[ -f ".easignore" ]] || fail "Missing .easignore at frontend/"
REPO_ROOT=$(git rev-parse --show-toplevel)
if [[ -f "$REPO_ROOT/.easignore" && "$REPO_ROOT/.easignore" != "$(pwd)/.easignore" ]]; then
  fail "Stray .easignore found at $REPO_ROOT/.easignore — must only live at frontend/.easignore"
fi
ok ".easignore present only at frontend/"

# 4. .easignore + .gitignore must BOTH anchor /ios/ and /android/ to root.
#    Unanchored `ios/` matches modules/*/ios/ and silently strips Swift sources.
for IG in ".easignore" ".gitignore"; do
  [[ -f "$IG" ]] || fail "$IG missing"
  if grep -E "^ios/" "$IG" >/dev/null 2>&1; then
    fail "$IG has UNANCHORED 'ios/' — this strips modules/*/ios/. Change to '/ios/'."
  fi
  if grep -E "^android/" "$IG" >/dev/null 2>&1; then
    fail "$IG has UNANCHORED 'android/' — change to '/android/'."
  fi
  grep -E "^/ios/?$"     "$IG" >/dev/null || fail "$IG missing anchored '/ios/' entry"
  grep -E "^/android/?$" "$IG" >/dev/null || fail "$IG missing anchored '/android/' entry"
  grep -q "node_modules" "$IG" || fail "$IG missing node_modules entry"
done
ok "Both .easignore and .gitignore anchor /ios/ and /android/ to root"

# 5. ios/ and android/ NOT tracked in git (managed Expo workflow)
if git ls-files ios/     | grep -q .; then fail "ios/ tracked — managed workflow broken"; fi
if git ls-files android/ | grep -q .; then fail "android/ tracked — managed workflow broken"; fi
ok "ios/ and android/ not tracked (managed workflow preserved)"

# 6. Local Expo modules tracked + all required iOS sources tracked
for MOD in modules/mood-healthkit modules/mood-storekit; do
  [[ -d "$MOD" ]] || fail "$MOD directory missing"
  git ls-files "$MOD" | grep -q "package.json"            || fail "$MOD/package.json not tracked"
  git ls-files "$MOD" | grep -q "expo-module.config.json" || fail "$MOD/expo-module.config.json not tracked"
  git ls-files "$MOD" | grep -q "ios/.*\.podspec$"        || fail "$MOD/ios/*.podspec not tracked"
  git ls-files "$MOD" | grep -qE "ios/.*\.(swift|m|h)$"   || fail "$MOD/ios has no tracked native source files"
done
ok "Local modules tracked with all required ios/ source files"

# 7. package.json must NOT use yarn workspaces or file: deps for local modules.
#    They cause autolinking to silently drop duplicates in EAS CI.
node -e "
const p = require('./package.json');
if (p.workspaces) {
  console.error('✗ package.json: \"workspaces\" must be REMOVED — caused autolinking duplicate-drop on EAS');
  process.exit(1);
}
const deps = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
for (const m of ['mood-healthkit', 'mood-storekit']) {
  if (deps[m]) {
    console.error('✗ package.json: must NOT list \"' + m + '\" as a dependency — autolinking scans ./modules by default');
    process.exit(1);
  }
}
if (!p.scripts || !/verify-local-modules\\.js/.test(p.scripts.postinstall || '')) {
  console.error('✗ package.json: postinstall must invoke scripts/verify-local-modules.js (the safety net)');
  process.exit(1);
}
" || exit 1
ok "package.json: no workspaces, no local-module deps, postinstall verifier wired"

# 7b. package-lock.json must not exist (forces yarn, keeps lockfile single-source-of-truth)
[[ -f "package-lock.json" ]] && fail "package-lock.json exists — delete it (yarn-only build)"
ok "No package-lock.json present"

# 7c. Verifier script must exist and be executable Node
[[ -f "scripts/verify-local-modules.js" ]] || fail "scripts/verify-local-modules.js missing"
node scripts/verify-local-modules.js > /dev/null || fail "verify-local-modules.js exits non-zero — fix the modules"
ok "verify-local-modules.js passes on current tree"

# 8. Autolinking probe — must see both modules with no duplicates
echo "── Running autolinking probe (slow) ──"
OUT=$(npx --no-install expo-modules-autolinking search --platform ios 2>&1 | sed -r 's/\x1b\[[0-9;]*m//g')
echo "$OUT" | grep -q "mood-healthkit" || fail "autolinking does not see mood-healthkit"
echo "$OUT" | grep -q "mood-storekit"  || fail "autolinking does not see mood-storekit"
# Reject duplicates — the bug that killed builds 51-54
echo "$OUT" | awk "/'mood-healthkit'/,/^  }/"  | grep -q "duplicates: \[\]" || fail "mood-healthkit shows duplicates — autolinking will silently drop it"
echo "$OUT" | awk "/'mood-storekit'/,/^  }/"   | grep -q "duplicates: \[\]" || fail "mood-storekit shows duplicates — autolinking will silently drop it"
ok "Autolinking sees both custom modules with no duplicates"

echo ""
echo "${GREEN}── All preflight checks passed. Safe to run eas build. ──${RESET}"
