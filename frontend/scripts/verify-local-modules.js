#!/usr/bin/env node
/**
 * verify-local-modules.js
 *
 * Runs as a yarn `postinstall` hook on BOTH local dev machines and inside the
 * EAS CI build container.  Its job is brutally simple:
 *
 *   - Confirm that each local Expo module under `modules/<name>/` still has its
 *     iOS Swift sources + podspec on disk after `yarn install`.
 *   - If anything is missing, exit non-zero so the EAS build fails IMMEDIATELY
 *     with a loud, obvious error — instead of silently producing an .ipa with
 *     an empty native bridge (the failure mode that has burned several builds).
 *   - Print a complete diagnostic dump (file sizes, line counts, full paths)
 *     so the EAS build logs always tell us exactly what state the modules
 *     are in when prebuild runs.
 *
 * The script intentionally has zero side-effects (no copies, no installs, no
 * file rewrites).  Expo SDK 54's autolinking already auto-scans `./modules`
 * via the default `nativeModulesDir` resolver
 * (see node_modules/expo-modules-autolinking/build/commands/autolinkingOptions.js:164),
 * so all we need is for the source files to physically exist at build time.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..');

const REQUIRED_MODULES = [
  {
    name: 'mood-healthkit',
    files: [
      'expo-module.config.json',
      'package.json',
      'src/index.ts',
      'ios/MoodHealthKit.podspec',
      'ios/MoodHealthKitModule.swift',
    ],
  },
  {
    name: 'mood-storekit',
    files: [
      'expo-module.config.json',
      'package.json',
      'src/index.ts',
      'ios/MoodStoreKit.podspec',
      'ios/MoodStoreKitModule.swift',
    ],
  },
];

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('');
console.log('=== MOOD local modules verifier (postinstall) ===');
console.log(`frontend root: ${FRONTEND_ROOT}`);

const errors = [];

for (const mod of REQUIRED_MODULES) {
  const modDir = path.join(FRONTEND_ROOT, 'modules', mod.name);
  console.log('');
  console.log(`module: ${mod.name}`);
  console.log(`  dir : ${modDir}`);

  if (!fs.existsSync(modDir)) {
    const msg = `MISSING module directory: ${modDir}`;
    console.log(`  ${RED}✗ ${msg}${RESET}`);
    errors.push(msg);
    continue;
  }

  for (const rel of mod.files) {
    const abs = path.join(modDir, rel);
    if (!fs.existsSync(abs)) {
      const msg = `MISSING ${mod.name}/${rel}`;
      console.log(`  ${RED}✗ ${msg}${RESET}`);
      errors.push(msg);
      continue;
    }
    const stat = fs.statSync(abs);
    if (stat.size === 0) {
      const msg = `EMPTY ${mod.name}/${rel} (0 bytes)`;
      console.log(`  ${RED}✗ ${msg}${RESET}`);
      errors.push(msg);
      continue;
    }
    console.log(
      `  ${GREEN}✓${RESET} ${rel.padEnd(36)} ${String(stat.size).padStart(7)} bytes`
    );
  }

  // Extra diagnostic: list raw contents of ios/ dir so EAS logs always show truth.
  const iosDir = path.join(modDir, 'ios');
  if (fs.existsSync(iosDir)) {
    const entries = fs.readdirSync(iosDir);
    console.log(`  ios/ contents (${entries.length}): ${entries.join(', ') || '<empty>'}`);
    if (entries.length === 0) {
      const msg = `EMPTY ios/ directory for ${mod.name}`;
      console.log(`  ${RED}✗ ${msg}${RESET}`);
      errors.push(msg);
    }
  }
}

console.log('');

if (errors.length > 0) {
  console.log(`${RED}=== FAIL: ${errors.length} local-module problem(s) ===${RESET}`);
  for (const e of errors) {
    console.log(`${RED}  - ${e}${RESET}`);
  }
  console.log('');
  console.log(`${YELLOW}This means the EAS upload arrived without your local Swift sources.${RESET}`);
  console.log(`${YELLOW}Likely causes:${RESET}`);
  console.log(`${YELLOW}  • An unanchored \`ios/\` or \`android/\` pattern in .gitignore / .easignore${RESET}`);
  console.log(`${YELLOW}    is stripping modules/<name>/ios/ — check both files have /ios/ and /android/${RESET}`);
  console.log(`${YELLOW}    anchored to the project root.${RESET}`);
  console.log(`${YELLOW}  • Someone deleted or renamed files under frontend/modules/.${RESET}`);
  console.log('');
  console.log(`${RED}Aborting install so EAS does NOT silently ship a broken native bridge.${RESET}`);
  process.exit(1);
}

console.log(`${GREEN}=== OK: all ${REQUIRED_MODULES.length} local modules verified, ios/ sources present ===${RESET}`);
console.log('');
