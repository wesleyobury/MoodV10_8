# Post-Cutover Tickets

Items deferred from the v1.2.1 release to ship after the App Store cutover lands.

---

## TICKET-001 — RN/Expo deprecation sweep

**Priority**: P2 (no user-facing impact, but blocks SDK 54 upgrade)
**Opened**: 2026-05-27
**Owner**: TBD
**Blocks**: future Expo SDK upgrade (currently on SDK 53)

### Scope

Resolve all React Native / Expo deprecation warnings surfaced in Metro bundler
output. Each warning is non-fatal today but will become a build/runtime error
when the underlying library reaches its removal version.

### Specific deprecations to address

| # | Warning | Fix | Files affected (rough scope) |
|---|---|---|---|
| 1 | `[expo-av]: Expo AV has been deprecated and will be removed in SDK 54. Use the expo-audio and expo-video packages to replace the required functionality.` | Migrate audio playback to `expo-audio`, video to `expo-video`. Drop the `expo-av` dep from `package.json`. | Anywhere `Audio.*` / `Video.*` from `expo-av` is imported (search `from 'expo-av'`). |
| 2 | `"shadow*" style props are deprecated. Use "boxShadow".` | Replace `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` with the unified `boxShadow` string syntax. | Sweep `StyleSheet.create` blocks across `app/`, `components/`, `screens/`. |
| 3 | `"textShadow*" style props are deprecated. Use "textShadow".` | Replace `textShadowColor` / `textShadowOffset` / `textShadowRadius` with the unified `textShadow` string. | Same sweep as #2. |
| 4 | `props.pointerEvents is deprecated. Use style.pointerEvents` (occasionally) | Move `pointerEvents` from JSX prop to `style={{ pointerEvents: ... }}`. | Wherever it appears today. |
| 5 | `[expo-notifications] Listening to push token changes is not yet fully supported on web.` | Informational only — gate the listener registration with `Platform.OS !== 'web'` to silence. | `utils/notifications.ts`, `utils/pushDebug.ts`, push-init in App layout. |

### Acceptance criteria

- [ ] Zero `expo-av` warnings in Metro output across a full app boot.
- [ ] Zero `shadow*` / `textShadow*` warnings (excluding any from `node_modules` we don't control).
- [ ] `expo-av` removed from `package.json` and `yarn.lock` regenerated.
- [ ] Functional regression check: every audio/video usage site still works on iOS, Android, and web preview.
- [ ] Push notifications still register on iOS device build (the actual push key flow is unchanged).

### Why deferred

Deprecations are warnings, not errors. The current v1.2.1 cutover is
time-sensitive (App Store binary submission to replace the live app). Touching
audio/video API surface mid-cutover increases regression risk for an
ear/eye-tested feature set with no immediate payoff. Plan for v1.3.x once the
cutover is verified stable.

### Estimated effort

- Item 1 (`expo-av` migration): 2–4 hours, mostly mechanical, but requires
  re-testing every audio/video screen on real devices.
- Items 2–5 (style props + small fixes): 1–2 hours, sweep + lint.

Total: half a day to a day with QA.

---
