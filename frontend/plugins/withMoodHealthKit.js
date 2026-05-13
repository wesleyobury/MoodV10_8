/**
 * Expo config plugin — wires HealthKit into the iOS build.
 *
 *   1. Adds the `com.apple.developer.healthkit` entitlement (read-only).
 *   2. Adds the `NSHealthShareUsageDescription` Info.plist string.
 *
 * Used by `app.json` plugins array. The accompanying native module
 * (`modules/mood-healthkit`) is autolinked by Expo Modules.
 */
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const USAGE_DESCRIPTION =
  'MOOD reads your heart rate, HRV, sleep, and activity to personalize workouts and track your live heart rate during sessions.';

function withHealthKitEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.healthkit'] = true;
    // We do NOT request clinical-records access; read-only metric access is
    // implicitly granted by the entitlement above.
    return cfg;
  });
}

function withHealthShareUsage(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSHealthShareUsageDescription = USAGE_DESCRIPTION;
    return cfg;
  });
}

module.exports = function withMoodHealthKit(config) {
  config = withHealthKitEntitlement(config);
  config = withHealthShareUsage(config);
  return config;
};
