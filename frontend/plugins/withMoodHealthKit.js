/**
 * Expo config plugin — wires HealthKit into the iOS build.
 *
 *   1. Adds the `com.apple.developer.healthkit` entitlement.
 *   2. Adds the `NSHealthShareUsageDescription` Info.plist string
 *      (read-access purpose string).
 *   3. Adds the `NSHealthUpdateUsageDescription` Info.plist string
 *      (write-access purpose string) — required by TestFlight review
 *      whenever the app links against HealthKit, even if writes haven't
 *      shipped yet, because static analysis flags the symbol regardless.
 *
 * Used by `app.json` plugins array. The accompanying native module
 * (`modules/mood-healthkit`) is autolinked by Expo Modules.
 *
 * NOTE: The strings below ARE the source of truth and will overwrite
 * anything set under `ios.infoPlist` in `app.json`. Update them here
 * for both legal and copywriting changes.
 */
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const SHARE_USAGE_DESCRIPTION =
  'MOOD reads your workout and activity data from Apple Health to tailor each session to your current energy and mood.';

const UPDATE_USAGE_DESCRIPTION =
  'MOOD uses HealthKit to log your workouts and personalize mood-based recommendations based on your activity and recovery.';

function withHealthKitEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.healthkit'] = true;
    // We do NOT request clinical-records access; read-only metric access is
    // implicitly granted by the entitlement above. Write access is granted
    // per-type when the user accepts the runtime permission sheet.
    return cfg;
  });
}

function withHealthUsageDescriptions(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSHealthShareUsageDescription = SHARE_USAGE_DESCRIPTION;
    cfg.modResults.NSHealthUpdateUsageDescription = UPDATE_USAGE_DESCRIPTION;
    return cfg;
  });
}

module.exports = function withMoodHealthKit(config) {
  config = withHealthKitEntitlement(config);
  config = withHealthUsageDescriptions(config);
  return config;
};
