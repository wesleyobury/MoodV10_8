import ExpoModulesCore
import HealthKit

/// READ-ONLY HealthKit bridge for MOOD.
///
/// Exposes exactly two methods to JS — `requestPermissions()` and
/// `fetchSnapshot()` — plus a status helper. We never write back to HealthKit.
///
/// The five metrics read:
///   • restingHeartRate         (count/min, most recent within last 7d)
///   • heartRateVariabilitySDNN (ms, most recent within last 7d)
///   • sleepAnalysis            (minutes asleep last night, 6pm yesterday → 11am today)
///   • activeEnergyBurned       (kcal sum for yesterday)
///   • stepCount                (count sum for yesterday)
public class MoodHealthKitModule: Module {
  private let store = HKHealthStore()

  private static var readTypes: Set<HKObjectType> {
    var types: Set<HKObjectType> = []
    if let t = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { types.insert(t) }
    if let t = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) { types.insert(t) }
    if let t = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(t) }
    if let t = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { types.insert(t) }
    if let t = HKObjectType.quantityType(forIdentifier: .stepCount) { types.insert(t) }
    return types
  }

  public func definition() -> ModuleDefinition {
    Name("MoodHealthKit")

    Constants([
      "isHealthDataAvailable": HKHealthStore.isHealthDataAvailable()
    ])

    /// Returns "unavailable" | "notDetermined" | "determined".
    /// For READ permissions Apple intentionally hides the true grant state, so
    /// "determined" only signals that the user has been prompted at least once.
    AsyncFunction("getAuthorizationStatus") { () -> String in
      guard HKHealthStore.isHealthDataAvailable() else { return "unavailable" }
      for type in Self.readTypes {
        if self.store.authorizationStatus(for: type) != .notDetermined {
          return "determined"
        }
      }
      return "notDetermined"
    }

    /// Triggers the native iOS HealthKit permission sheet. Resolves with
    /// `{ granted: Bool }`. Note: `granted` here means the request returned
    /// without error — Apple does not expose per-type read approval.
    AsyncFunction("requestPermissions") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(["granted": false, "reason": "unavailable"])
        return
      }
      self.store.requestAuthorization(toShare: [], read: Self.readTypes) { success, error in
        if let error = error {
          promise.resolve(["granted": false, "reason": error.localizedDescription])
        } else {
          promise.resolve(["granted": success, "reason": ""])
        }
      }
    }

    /// Returns the 5-metric snapshot. Each field may be null if HealthKit has
    /// no data for the window or the user denied that specific metric.
    AsyncFunction("fetchSnapshot") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(NSNull())
        return
      }
      let storeRef = self.store
      Task {
        let snapshot = await Self.buildSnapshot(store: storeRef)
        promise.resolve(snapshot)
      }
    }
  }

  // MARK: - Snapshot builder

  private static func buildSnapshot(store: HKHealthStore) async -> [String: Any] {
    async let rhr   = mostRecentQuantity(store: store, identifier: .restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()))
    async let hrv   = mostRecentQuantity(store: store, identifier: .heartRateVariabilitySDNN, unit: HKUnit.secondUnit(with: .milli))
    async let sleep = sleepAsleepLastNightMinutes(store: store)
    async let kcal  = sumQuantityYesterday(store: store, identifier: .activeEnergyBurned, unit: .kilocalorie())
    async let steps = sumQuantityYesterday(store: store, identifier: .stepCount, unit: .count())

    let (rhrVal, hrvVal, sleepVal, kcalVal, stepsVal) = await (rhr, hrv, sleep, kcal, steps)

    return [
      "restingHeartRate":         rhrVal as Any,
      "heartRateVariabilitySDNN": hrvVal as Any,
      "asleepDurationMinutes":    sleepVal as Any,
      "activeEnergyBurnedKcal":   kcalVal as Any,
      "stepCount":                stepsVal as Any,
      "lastSyncedAt":             ISO8601DateFormatter().string(from: Date())
    ]
  }

  private static func mostRecentQuantity(
    store: HKHealthStore,
    identifier: HKQuantityTypeIdentifier,
    unit: HKUnit
  ) async -> Double? {
    guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
    let start = Calendar.current.date(byAdding: .day, value: -7, to: Date())
    let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictEndDate)
    return await withCheckedContinuation { (cont: CheckedContinuation<Double?, Never>) in
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
      let q = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
        guard let sample = samples?.first as? HKQuantitySample else { cont.resume(returning: nil); return }
        cont.resume(returning: sample.quantity.doubleValue(for: unit))
      }
      store.execute(q)
    }
  }

  private static func sumQuantityYesterday(
    store: HKHealthStore,
    identifier: HKQuantityTypeIdentifier,
    unit: HKUnit
  ) async -> Double? {
    guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
    let cal = Calendar.current
    let startOfToday = cal.startOfDay(for: Date())
    guard let startOfYesterday = cal.date(byAdding: .day, value: -1, to: startOfToday) else { return nil }
    let predicate = HKQuery.predicateForSamples(withStart: startOfYesterday, end: startOfToday, options: .strictStartDate)
    return await withCheckedContinuation { (cont: CheckedContinuation<Double?, Never>) in
      let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
        guard let sum = stats?.sumQuantity() else { cont.resume(returning: nil); return }
        cont.resume(returning: sum.doubleValue(for: unit))
      }
      store.execute(q)
    }
  }

  private static func sleepAsleepLastNightMinutes(store: HKHealthStore) async -> Double? {
    guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
    let cal = Calendar.current
    let startOfToday = cal.startOfDay(for: Date())
    // 18:00 the day before → 11:00 today.
    guard
      let sixPmYesterday = cal.date(byAdding: .hour, value: -6, to: startOfToday),
      let elevenAmToday = cal.date(byAdding: .hour, value: 11, to: startOfToday)
    else { return nil }

    let predicate = HKQuery.predicateForSamples(withStart: sixPmYesterday, end: elevenAmToday, options: .strictStartDate)
    return await withCheckedContinuation { (cont: CheckedContinuation<Double?, Never>) in
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
      let q = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
        guard let categorySamples = samples as? [HKCategorySample], !categorySamples.isEmpty else {
          cont.resume(returning: nil); return
        }

        var asleepValues: Set<Int> = []
        if #available(iOS 16.0, *) {
          asleepValues = [
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
          ]
        } else {
          asleepValues = [HKCategoryValueSleepAnalysis.asleep.rawValue]
        }

        let totalSeconds = categorySamples
          .filter { asleepValues.contains($0.value) }
          .reduce(0.0) { acc, s in acc + s.endDate.timeIntervalSince(s.startDate) }

        cont.resume(returning: totalSeconds > 0 ? totalSeconds / 60.0 : nil)
      }
      store.execute(q)
    }
  }
}
