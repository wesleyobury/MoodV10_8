/**
 * Expo config plugin — wires Health Connect into the Android build.
 *
 * The mood-healthkit Android module's own AndroidManifest already declares the
 * `android.permission.health.READ_*` permissions and the Health Connect
 * <queries> entry (they merge into the app manifest). What must live at the
 * APP level — and therefore here — is the permission-rationale surface that
 * Google Play REQUIRES for any app using Health Connect:
 *
 *   1. An intent-filter on the launcher activity for the Android 14+
 *      `androidx.health.connect.action.SHOW_PERMISSIONS_RATIONALE` action.
 *   2. An <activity-alias>/intent for `ACTION_SHOW_PERMISSIONS_RATIONALE`
 *      (pre-Android-14 Health Connect app) pointing at the same activity.
 *
 * When the OS or the Health Connect app asks "why does MOOD want this data?",
 * it launches the app via one of these intents; the app should route to a
 * screen that links to the privacy policy. Without this, Play review rejects
 * the Health Connect declaration.
 *
 * Add to app.json plugins AFTER expo-router. The iOS side is handled by the
 * separate withMoodHealthKit.js plugin.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const RATIONALE_ACTION = 'androidx.health.connect.action.SHOW_PERMISSIONS_RATIONALE';
const RATIONALE_ACTION_LEGACY =
  'androidx.health.connect.action.HEALTH_CONNECT_SETTINGS';

function ensureIntentFilterOnMainActivity(androidManifest) {
  const app = androidManifest.manifest.application?.[0];
  if (!app) return androidManifest;

  const mainActivity = (app.activity || []).find((a) =>
    (a['intent-filter'] || []).some((f) =>
      (f.action || []).some(
        (act) => act.$['android:name'] === 'android.intent.action.MAIN'
      )
    )
  );
  if (!mainActivity) return androidManifest;

  mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];

  const hasRationale = mainActivity['intent-filter'].some((f) =>
    (f.action || []).some((act) => act.$['android:name'] === RATIONALE_ACTION)
  );

  if (!hasRationale) {
    mainActivity['intent-filter'].push({
      action: [{ $: { 'android:name': RATIONALE_ACTION } }],
    });
  }

  return androidManifest;
}

module.exports = function withMoodHealthKitAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = ensureIntentFilterOnMainActivity(cfg.modResults);
    return cfg;
  });
};
