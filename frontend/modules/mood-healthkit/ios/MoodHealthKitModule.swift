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
    if let t = HKObjectType.quantityType(forIdentifier: .heartRate) { types.insert(t) }
    types.insert(HKObjectType.workoutType()) // read HKWorkout for last-workout stats
    return types
  }

  // MARK: - Live heart-rate streaming
  // An HKAnchoredObjectQuery with updateHandler streams new samples as they
  // arrive on the iPhone (typically forwarded from a paired Apple Watch every
  // ~5s during a workout). We keep one query alive per session; multiple
  // start calls replace any in-flight query.
  private var liveHRQuery: HKAnchoredObjectQuery?
  private let liveHRQueue = DispatchQueue(label: "com.official.moodapp.healthkit.liveHR")

  public func definition() -> ModuleDefinition {
    Name("MoodHealthKit")

    // JS subscribes to this event during a workout to receive live HR samples.
    Events("onHeartRateSample")

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

    /// Begin streaming live heart-rate samples. Each new sample fires an
    /// `onHeartRateSample` event with `{ bpm: Double, timestamp: String (ISO) }`.
    /// Multiple start calls are idempotent — any in-flight query is replaced.
    AsyncFunction("startHeartRateStream") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(),
            let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
        promise.resolve(false)
        return
      }
      self.liveHRQueue.async {
        // Stop any in-flight query first.
        if let existing = self.liveHRQuery {
          self.store.stop(existing)
          self.liveHRQuery = nil
        }

        // Stream only samples that arrive after this moment. We don't want to
        // replay historical samples into the live UI.
        let predicate = HKQuery.predicateForSamples(withStart: Date(), end: nil, options: .strictStartDate)

        let handler: (HKAnchoredObjectQuery, [HKSample]?, [HKDeletedObject]?, HKQueryAnchor?, Error?) -> Void = { [weak self] _, samples, _, _, _ in
          guard let self = self, let qSamples = samples as? [HKQuantitySample], !qSamples.isEmpty else { return }
          let bpmUnit = HKUnit.count().unitDivided(by: .minute())
          let iso = ISO8601DateFormatter()
          for s in qSamples {
            let bpm = s.quantity.doubleValue(for: bpmUnit)
            self.sendEvent("onHeartRateSample", [
              "bpm": bpm,
              "timestamp": iso.string(from: s.endDate)
            ])
          }
        }

        let query = HKAnchoredObjectQuery(
          type: hrType,
          predicate: predicate,
          anchor: nil,
          limit: HKObjectQueryNoLimit,
          resultsHandler: handler
        )
        query.updateHandler = handler
        self.liveHRQuery = query
        self.store.execute(query)
        promise.resolve(true)
      }
    }

    /// Stop the live HR stream. Safe to call multiple times.
    AsyncFunction("stopHeartRateStream") { (promise: Promise) in
      self.liveHRQueue.async {
        if let q = self.liveHRQuery {
          self.store.stop(q)
          self.liveHRQuery = nil
        }
        promise.resolve(true)
      }
    }

    /// Returns session-window aggregates from HealthKit for the supplied
    /// [startISO, endISO] range. Used by the workout-session flow to capture
    /// session-actual calories + step count at completion time.
    ///
    /// Resolves with:
    ///   { activeEnergyKcal: Double?, stepCount: Double?, heartRateVariabilitySDNN: Double? }
    /// Each field may be null if HealthKit has no samples in that window or
    /// the user denied access. Never rejects.
    AsyncFunction("fetchSessionMetrics") { (startISO: String, endISO: String, promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(NSNull())
        return
      }
      let iso = ISO8601DateFormatter()
      iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      var start = iso.date(from: startISO)
      var end = iso.date(from: endISO)
      // Try without fractional seconds as a fallback.
      if start == nil || end == nil {
        let iso2 = ISO8601DateFormatter()
        start = start ?? iso2.date(from: startISO)
        end = end ?? iso2.date(from: endISO)
      }
      guard let s = start, let e = end, e > s else {
        promise.resolve(NSNull())
        return
      }
      let storeRef = self.store
      Task {
        async let kcal  = Self.sumQuantityInRange(store: storeRef, identifier: .activeEnergyBurned, unit: .kilocalorie(), start: s, end: e)
        async let steps = Self.sumQuantityInRange(store: storeRef, identifier: .stepCount, unit: .count(), start: s, end: e)
        async let hrv   = Self.mostRecentQuantityInRange(store: storeRef, identifier: .heartRateVariabilitySDNN, unit: HKUnit.secondUnit(with: .milli), start: s, end: e)
        let (kcalVal, stepsVal, hrvVal) = await (kcal, steps, hrv)
        promise.resolve([
          "activeEnergyKcal":         kcalVal as Any,
          "stepCount":                stepsVal as Any,
          "heartRateVariabilitySDNN": hrvVal as Any,
        ])
      }
    }

    /// Fetch the user's MOST RECENT HKWorkout (recorded by the Apple Watch or
    /// any Health source) and its actuals — so past / Watch-recorded workouts
    /// can surface real calories, duration and heart rate. Never rejects;
    /// resolves NSNull when there's no workout / no access.
    ///
    /// Resolves with:
    ///   { startISO, endISO, durationSec, activeEnergyKcal?, avgHeartRate?, maxHeartRate? }
    AsyncFunction("fetchMostRecentWorkout") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(NSNull())
        return
      }
      let storeRef = self.store
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
      let q = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
        guard let w = samples?.first as? HKWorkout else {
          promise.resolve(NSNull())
          return
        }
        let s = w.startDate
        let e = w.endDate
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        Task {
          async let kcal  = Self.sumQuantityInRange(store: storeRef, identifier: .activeEnergyBurned, unit: .kilocalorie(), start: s, end: e)
          async let avgHr = Self.statHeartRate(store: storeRef, start: s, end: e, option: .discreteAverage)
          async let maxHr = Self.statHeartRate(store: storeRef, start: s, end: e, option: .discreteMax)
          let (kcalVal, avgVal, maxVal) = await (kcal, avgHr, maxHr)
          promise.resolve([
            "startISO":         iso.string(from: s),
            "endISO":           iso.string(from: e),
            "durationSec":      w.duration,
            "activeEnergyKcal": kcalVal as Any,
            "avgHeartRate":     avgVal as Any,
            "maxHeartRate":     maxVal as Any,
          ])
        }
      }
      storeRef.execute(q)
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

  /// Sum a cumulative quantity (e.g. activeEnergyBurned, stepCount) over an arbitrary window.
  /// Used by `fetchSessionMetrics` for session-actual aggregates.
  private static func sumQuantityInRange(
    store: HKHealthStore,
    identifier: HKQuantityTypeIdentifier,
    unit: HKUnit,
    start: Date,
    end: Date
  ) async -> Double? {
    guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    return await withCheckedContinuation { (cont: CheckedContinuation<Double?, Never>) in
      let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
        guard let sum = stats?.sumQuantity() else { cont.resume(returning: nil); return }
        cont.resume(returning: sum.doubleValue(for: unit))
      }
      store.execute(q)
    }
  }

  /// Average or max heart rate (bpm) over a window — used for last-workout stats.
  private static func statHeartRate(
    store: HKHealthStore,
    start: Date,
    end: Date,
    option: HKStatisticsOptions
  ) async -> Double? {
    guard let type = HKObjectType.quantityType(forIdentifier: .heartRate) else { return nil }
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    let unit = HKUnit.count().unitDivided(by: .minute())
    return await withCheckedContinuation { (cont: CheckedContinuation<Double?, Never>) in
      let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: option) { _, stats, _ in
        let qty = option.contains(.discreteMax) ? stats?.maximumQuantity() : stats?.averageQuantity()
        guard let qv = qty else { cont.resume(returning: nil); return }
        cont.resume(returning: qv.doubleValue(for: unit))
      }
      store.execute(q)
    }
  }

  /// Most-recent sample of a discrete quantity (e.g. heartRateVariabilitySDNN) within a window.
  private static func mostRecentQuantityInRange(
    store: HKHealthStore,
    identifier: HKQuantityTypeIdentifier,
    unit: HKUnit,
    start: Date,
    end: Date
  ) async -> Double? {
    guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictEndDate)
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
