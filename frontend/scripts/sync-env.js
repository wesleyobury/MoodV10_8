#!/usr/bin/env node
/**
 * sync-env.js — single source of truth for preview URLs.
 *
 * Why: Expo Go fetches the JS bundle via EXPO_PACKAGER_PROXY_URL. The pod
 * hostname rotates from time to time, and previously 5 env vars × 3 .env
 * files (15 lines total) had to be manually updated in sync. Out-of-sync =
 * "Expected JavaScript, but got text/html" crash in Expo Go.
 *
 * What: the platform exposes the current external hostname as the env var
 * `preview_endpoint`. This script reads that ONE value and writes all 15
 * lines deterministically. Run on every `yarn start` via the `prestart`
 * npm hook so drift is impossible.
 *
 * Override: if you ever need a different URL (e.g., LAN/ngrok), set
 * `MOOD_PREVIEW_URL` in the shell env — it wins over `preview_endpoint`.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FRONTEND_DIR = path.resolve(__dirname, '..');
const ENV_FILES = ['.env', '.env.development', '.env.preview'];

function resolvePreviewUrl() {
  const override = (process.env.MOOD_PREVIEW_URL || '').trim();
  if (override) return override.replace(/\/+$/, '');
  const fromPlatform = (process.env.preview_endpoint || '').trim();
  if (fromPlatform) return fromPlatform.replace(/\/+$/, '');
  // Fallback: read PID 1's environ. Supervisor doesn't inherit container-init
  // env, but /proc/1/environ is readable by root inside the pod.
  try {
    const raw = fs.readFileSync('/proc/1/environ', 'utf8');
    for (const entry of raw.split('\0')) {
      const eq = entry.indexOf('=');
      if (eq < 0) continue;
      const k = entry.slice(0, eq);
      if (k === 'preview_endpoint') {
        return entry.slice(eq + 1).trim().replace(/\/+$/, '');
      }
    }
  } catch (_) { /* not readable — ignore */ }
  return null;
}

function buildEnvBody(url) {
  return [
    `EXPO_PUBLIC_API_URL=${url}`,
    `EXPO_PUBLIC_BACKEND_URL=${url}`,
    `EXPO_USE_FAST_RESOLVER=1`,
    `EXPO_USE_STATIC=false`,
    `EXPO_PACKAGER_PROXY_URL=${url}`,
    '',
  ].join('\n');
}

function writeIfChanged(filePath, content) {
  let current = '';
  try { current = fs.readFileSync(filePath, 'utf8'); } catch (_) {}
  if (current === content) return false;
  fs.writeFileSync(filePath, content);
  return true;
}

function healthCheck(url) {
  return new Promise((resolve) => {
    const req = https.get(`${url}/api/health`, { timeout: 5000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  const url = resolvePreviewUrl();
  if (!url) {
    console.error('❌ sync-env: neither $MOOD_PREVIEW_URL nor $preview_endpoint is set.');
    console.error('   This pod has no discoverable preview hostname. Set MOOD_PREVIEW_URL manually.');
    process.exit(1);
  }

  const body = buildEnvBody(url);
  const changed = [];
  for (const f of ENV_FILES) {
    const full = path.join(FRONTEND_DIR, f);
    if (writeIfChanged(full, body)) changed.push(f);
  }

  console.log(`🔗 sync-env: target = ${url}`);
  if (changed.length === 0) {
    console.log(`✅ sync-env: all 3 .env files already in sync.`);
  } else {
    console.log(`✏️  sync-env: rewrote ${changed.length} file(s): ${changed.join(', ')}`);
  }

  // Fail-fast health check so drift surfaces immediately instead of as an
  // Expo Go crash on the user's phone. Skip in CI / when ALLOW_OFFLINE=1.
  if (process.env.ALLOW_OFFLINE === '1') {
    console.log(`⏭️  sync-env: ALLOW_OFFLINE=1, skipping health check.`);
    return;
  }
  const healthy = await healthCheck(url);
  if (!healthy) {
    console.error(`❌ sync-env: ${url}/api/health did NOT return 200.`);
    console.error(`   The target host is unreachable — Expo Go will fail to load the bundle.`);
    console.error(`   Check if the pod hostname has rotated. Re-run after restart, or override with MOOD_PREVIEW_URL.`);
    process.exit(2);
  }
  console.log(`✅ sync-env: ${url}/api/health → 200.`);
}

main().catch((e) => {
  console.error('❌ sync-env: unexpected error:', e);
  process.exit(3);
});
