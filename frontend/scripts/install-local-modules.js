#!/usr/bin/env node
/**
 * install-local-modules.js — yarn `postinstall` hook
 *
 * Why this script exists (root cause):
 *
 *   Yarn 1's `file:` protocol does NOT reliably populate node_modules/<name>
 *   when invoked with `yarn install --frozen-lockfile --production false` —
 *   the exact command EAS Build runs. Lockfile entries for file: deps lack
 *   `resolved` / `integrity` (file: deps have no content hash), so yarn
 *   considers them "satisfied" by the lockfile and skips the physical copy.
 *   Result: node_modules/mood-healthkit and node_modules/mood-storekit never
 *   get created on EAS, expo-modules-autolinking's scanDependenciesRecursively
 *   (build/dependencies/resolution.js:35-43) finds nothing, and the autolinker
 *   reports only 13 modules instead of 15.
 *
 *   We reproduced this exact failure locally with:
 *     rm -rf node_modules/mood-{healthkit,storekit}
 *     yarn install --frozen-lockfile --production false   # 0.74s, no copy
 *
 *   This script restores the missing step explicitly: a hard `cp -RL` from
 *   modules/<name>/ to node_modules/<name>/ that runs unconditionally after
 *   every `yarn install`, frozen-lockfile or not.
 *
 * Why this is safe (no duplicate detection):
 *
 *   package.json sets `expo.autolinking.nativeModulesDir` to a non-existent
 *   path so the default `./modules` auto-scan is disabled. The only discovery
 *   path for our local modules is the standard node_modules walk
 *   (scanDependenciesRecursively), which requires both:
 *     1. The package name listed in package.json `dependencies` ✓ (file: deps)
 *     2. The directory physically present at node_modules/<name> ✓ (this script)
 *
 *   These together guarantee discovery — no implicit appRoot inference,
 *   no silent skip, no duplicates.
 *
 * Failure modes:
 *
 *   • If modules/<name>/ is missing or has empty ios/, abort with exit 1
 *     so EAS fails immediately with a loud red error instead of producing
 *     a broken .ipa.
 *   • If the cp itself fails, abort with exit 1 and print the system error.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FRONTEND_ROOT = path.resolve(__dirname, '..');

const LOCAL_MODULES = [
  {
    name: 'mood-healthkit',
    required: [
      'expo-module.config.json',
      'package.json',
      'src/index.ts',
      'ios/MoodHealthKit.podspec',
      'ios/MoodHealthKitModule.swift',
    ],
  },
  {
    name: 'mood-storekit',
    required: [
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
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function fail(msg) {
  console.log('');
  console.log(`${RED}=== install-local-modules.js: FAIL ===${RESET}`);
  console.log(`${RED}  ${msg}${RESET}`);
  console.log(`${YELLOW}Aborting install so EAS does NOT silently ship a broken native bridge.${RESET}`);
  console.log('');
  process.exit(1);
}

console.log('');
console.log(`${CYAN}=== install-local-modules.js (postinstall) ===${RESET}`);
console.log(`frontend root : ${FRONTEND_ROOT}`);

for (const mod of LOCAL_MODULES) {
  const src = path.join(FRONTEND_ROOT, 'modules', mod.name);
  const dst = path.join(FRONTEND_ROOT, 'node_modules', mod.name);

  console.log('');
  console.log(`module        : ${mod.name}`);
  console.log(`  source      : ${src}`);
  console.log(`  destination : ${dst}`);

  // 1. Verify source dir + required files exist before we copy anything.
  if (!fs.existsSync(src)) {
    fail(`source ${src} is missing — modules/<name>/ was stripped from the EAS upload.`);
  }
  for (const rel of mod.required) {
    const p = path.join(src, rel);
    if (!fs.existsSync(p)) {
      fail(`source ${mod.name}/${rel} is missing — check .easignore/.gitignore for unanchored ios/ pattern.`);
    }
    if (fs.statSync(p).size === 0) {
      fail(`source ${mod.name}/${rel} is 0 bytes.`);
    }
  }

  // 2. Wipe any stale node_modules copy, then hard-copy fresh.
  //    `cp -RL` dereferences symlinks so the result is a real directory tree,
  //    which is what CocoaPods + Xcode require (symlinks inside node_modules
  //    have historically broken EAS' CocoaPods integration).
  try {
    execFileSync('rm', ['-rf', dst], { stdio: 'inherit' });
    execFileSync('cp', ['-RL', src, dst], { stdio: 'inherit' });
  } catch (e) {
    fail(`cp -RL ${src} -> ${dst} failed: ${e.message}`);
  }

  // 3. Verify destination has the required files post-copy.
  for (const rel of mod.required) {
    const p = path.join(dst, rel);
    if (!fs.existsSync(p)) {
      fail(`destination ${mod.name}/${rel} is missing after copy — disk full or permissions issue?`);
    }
    const size = fs.statSync(p).size;
    if (size === 0) {
      fail(`destination ${mod.name}/${rel} is 0 bytes after copy.`);
    }
    console.log(`  ${GREEN}✓${RESET} ${rel.padEnd(36)} ${String(size).padStart(7)} bytes`);
  }
}

console.log('');
console.log(`${GREEN}=== OK: ${LOCAL_MODULES.length} local modules copied into node_modules/ ===${RESET}`);
console.log(`${CYAN}     autolinker scanDependenciesRecursively will now discover them.${RESET}`);
console.log('');
