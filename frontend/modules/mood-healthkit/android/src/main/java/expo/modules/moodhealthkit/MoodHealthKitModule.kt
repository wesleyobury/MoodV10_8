package expo.modules.moodhealthkit

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.aggregate.AggregationResult
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * MOOD Health Connect bridge — the Android counterpart to the iOS HealthKit
 * module (MoodHealthKitModule.swift). READ-ONLY, mirroring the iOS design.
 *
 * Implements the SAME JS surface consumed by mood-healthkit/src/index.ts so
 * HealthContext and the workout-session / create-post flows are unchanged.
 *
 * Two documented divergences from iOS (see the Android-Parity plan §4.1):
 *   • HRV is exposed by Health Connect as RMSSD, not SDNN. The value is
 *     surfaced in the same `heartRateVariabilitySDNN` field for API
 *     compatibility, but the two metrics are NOT interchangeable — relabel
 *     or convert in the UI as product decides.
 *   • Health Connect has no live-streaming query. `startHeartRateStream`
 *     emulates it by polling HeartRateRecord on a short interval, so cadence
 *     is coarser than the Apple Watch → iPhone stream.
 */
class MoodHealthKitModule : Module() {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  private var liveHrJob: Job? = null

  private lateinit var permissionLauncher:
    AppContextActivityResultLauncher<ArrayList<String>, Set<String>>

  private val zone: ZoneId get() = ZoneId.systemDefault()
  private val isoInstant: DateTimeFormatter = DateTimeFormatter.ISO_INSTANT

  /** The read permissions we request — mirrors the iOS read set. */
  private val readPermissions: Set<String> = setOf(
    HealthPermission.getReadPermission(RestingHeartRateRecord::class),
    HealthPermission.getReadPermission(HeartRateRecord::class),
    HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
    HealthPermission.getReadPermission(SleepSessionRecord::class),
    HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
    HealthPermission.getReadPermission(StepsRecord::class),
    HealthPermission.getReadPermission(ExerciseSessionRecord::class),
  )

  override fun definition() = ModuleDefinition {
    Name("MoodHealthKit")

    Events("onHeartRateSample")

    Constants(
      "isHealthDataAvailable" to (sdkStatus() == HealthConnectClient.SDK_AVAILABLE)
    )

    RegisterActivityContracts {
      permissionLauncher = registerForActivityResult(
        HealthConnectPermissionContract()
      ) { _, _ -> /* fallback callback (activity destroyed) — no-op */ }
    }

    /** "unavailable" | "notDetermined" | "determined" */
    AsyncFunction("getAuthorizationStatus") { promise: Promise ->
      scope.launch {
        try {
          if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) {
            promise.resolve("unavailable"); return@launch
          }
          val granted = client().permissionController.getGrantedPermissions()
          val any = readPermissions.any { it in granted }
          promise.resolve(if (any) "determined" else "notDetermined")
        } catch (_: Throwable) {
          promise.resolve("unavailable")
        }
      }
    }

    /** Launches the Health Connect permission sheet. Resolves { granted, reason }. */
    AsyncFunction("requestPermissions") { promise: Promise ->
      scope.launch {
        try {
          if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) {
            promise.resolve(mapOf("granted" to false, "reason" to "unavailable")); return@launch
          }
          val already = client().permissionController.getGrantedPermissions()
          if (already.containsAll(readPermissions)) {
            promise.resolve(mapOf("granted" to true, "reason" to "")); return@launch
          }
          val granted = permissionLauncher.launch(ArrayList(readPermissions))
          promise.resolve(
            mapOf("granted" to granted.containsAll(readPermissions), "reason" to "")
          )
        } catch (e: Throwable) {
          promise.resolve(mapOf("granted" to false, "reason" to (e.message ?: "unknown")))
        }
      }
    }

    /** 5-metric snapshot. Each field may be null. Never rejects. */
    AsyncFunction("fetchSnapshot") { promise: Promise ->
      scope.launch {
        try {
          if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) { promise.resolve(null); return@launch }
          val c = client()
          val now = Instant.now()
          val sevenDaysAgo = now.minus(Duration.ofDays(7))

          val rhr = latestRestingHeartRate(c, sevenDaysAgo, now)
          val hrv = latestHrvRmssd(c, sevenDaysAgo, now)
          val sleep = lastNightAsleepMinutes(c)
          val (kcal, steps) = yesterdayEnergyAndSteps(c)

          promise.resolve(
            mapOf(
              "restingHeartRate" to rhr,
              "heartRateVariabilitySDNN" to hrv, // RMSSD surfaced here — see class docs
              "asleepDurationMinutes" to sleep,
              "activeEnergyBurnedKcal" to kcal,
              "stepCount" to steps,
              "lastSyncedAt" to isoInstant.format(now)
            )
          )
        } catch (_: Throwable) {
          promise.resolve(null)
        }
      }
    }

    /** Session-window aggregates between two ISO timestamps. Never rejects. */
    AsyncFunction("fetchSessionMetrics") { startISO: String, endISO: String, promise: Promise ->
      scope.launch {
        try {
          if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) { promise.resolve(null); return@launch }
          val start = Instant.parse(startISO)
          val end = Instant.parse(endISO)
          if (!end.isAfter(start)) { promise.resolve(null); return@launch }
          val c = client()
          val agg = c.aggregate(
            AggregateRequest(
              metrics = setOf(
                ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                StepsRecord.COUNT_TOTAL
              ),
              timeRangeFilter = TimeRangeFilter.between(start, end)
            )
          )
          promise.resolve(
            mapOf(
              "activeEnergyKcal" to agg[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories,
              "stepCount" to agg[StepsRecord.COUNT_TOTAL]?.toDouble(),
              "heartRateVariabilitySDNN" to latestHrvRmssd(c, start, end)
            )
          )
        } catch (_: Throwable) {
          promise.resolve(null)
        }
      }
    }

    /** Most recent ExerciseSessionRecord + its actuals. Never rejects. */
    AsyncFunction("fetchMostRecentWorkout") { promise: Promise ->
      scope.launch {
        try {
          if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) { promise.resolve(null); return@launch }
          val c = client()
          val now = Instant.now()
          val lookback = now.minus(Duration.ofDays(30))
          val resp = c.readRecords(
            ReadRecordsRequest(
              recordType = ExerciseSessionRecord::class,
              timeRangeFilter = TimeRangeFilter.between(lookback, now),
              ascendingOrder = false,
              pageSize = 1
            )
          )
          val w = resp.records.firstOrNull()
          if (w == null) { promise.resolve(null); return@launch }
          val s = w.startTime
          val e = w.endTime
          val kcalAgg = c.aggregate(
            AggregateRequest(
              metrics = setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL),
              timeRangeFilter = TimeRangeFilter.between(s, e)
            )
          )
          val hrAgg = c.aggregate(
            AggregateRequest(
              metrics = setOf(HeartRateRecord.BPM_AVG, HeartRateRecord.BPM_MAX),
              timeRangeFilter = TimeRangeFilter.between(s, e)
            )
          )
          promise.resolve(
            mapOf(
              "startISO" to isoInstant.format(s),
              "endISO" to isoInstant.format(e),
              "durationSec" to Duration.between(s, e).seconds.toDouble(),
              "activeEnergyKcal" to kcalAgg[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories,
              "avgHeartRate" to hrAgg[HeartRateRecord.BPM_AVG]?.toDouble(),
              "maxHeartRate" to hrAgg[HeartRateRecord.BPM_MAX]?.toDouble()
            )
          )
        } catch (_: Throwable) {
          promise.resolve(null)
        }
      }
    }

    /** Begin emulated live-HR streaming via short-interval polling. */
    AsyncFunction("startHeartRateStream") { promise: Promise ->
      if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) { promise.resolve(false); return@AsyncFunction }
      liveHrJob?.cancel()
      liveHrJob = scope.launch {
        var since = Instant.now()
        while (isActive) {
          try {
            val now = Instant.now()
            val resp = client().readRecords(
              ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(since, now)
              )
            )
            resp.records.forEach { rec ->
              rec.samples.forEach { sample ->
                if (sample.time.isAfter(since)) {
                  sendEvent(
                    "onHeartRateSample",
                    mapOf(
                      "bpm" to sample.beatsPerMinute.toDouble(),
                      "timestamp" to isoInstant.format(sample.time)
                    )
                  )
                }
              }
            }
            since = now
          } catch (_: Throwable) {
            // transient read failure — keep polling
          }
          delay(POLL_INTERVAL_MS)
        }
      }
      promise.resolve(true)
    }

    /** Stop the emulated live-HR stream. Safe to call multiple times. */
    AsyncFunction("stopHeartRateStream") { promise: Promise ->
      liveHrJob?.cancel()
      liveHrJob = null
      promise.resolve(true)
    }

    OnDestroy {
      liveHrJob?.cancel()
      liveHrJob = null
      scope.cancel()
    }
  }

  // MARK: - Helpers

  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun sdkStatus(): Int = HealthConnectClient.getSdkStatus(context)

  private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

  private suspend fun latestRestingHeartRate(
    c: HealthConnectClient, start: Instant, end: Instant
  ): Double? {
    val resp = c.readRecords(
      ReadRecordsRequest(
        recordType = RestingHeartRateRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end),
        ascendingOrder = false,
        pageSize = 1
      )
    )
    return resp.records.firstOrNull()?.beatsPerMinute?.toDouble()
  }

  private suspend fun latestHrvRmssd(
    c: HealthConnectClient, start: Instant, end: Instant
  ): Double? {
    val resp = c.readRecords(
      ReadRecordsRequest(
        recordType = HeartRateVariabilityRmssdRecord::class,
        timeRangeFilter = TimeRangeFilter.between(start, end),
        ascendingOrder = false,
        pageSize = 1
      )
    )
    return resp.records.firstOrNull()?.heartRateVariabilityMillis
  }

  /** Yesterday's active-energy (kcal) and step totals, mirroring iOS. */
  private suspend fun yesterdayEnergyAndSteps(c: HealthConnectClient): Pair<Double?, Double?> {
    val startOfToday = LocalDate.now(zone).atStartOfDay(zone).toInstant()
    val startOfYesterday = startOfToday.minus(Duration.ofDays(1))
    val agg = c.aggregate(
      AggregateRequest(
        metrics = setOf(
          ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
          StepsRecord.COUNT_TOTAL
        ),
        timeRangeFilter = TimeRangeFilter.between(startOfYesterday, startOfToday)
      )
    )
    val kcal = agg[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories
    val steps = agg[StepsRecord.COUNT_TOTAL]?.toDouble()
    return kcal to steps
  }

  /** Minutes asleep last night: 6pm yesterday → 11am today, mirroring iOS. */
  private suspend fun lastNightAsleepMinutes(c: HealthConnectClient): Double? {
    val today = LocalDate.now(zone)
    val sixPmYesterday = today.minusDays(1).atTime(LocalTime.of(18, 0)).atZone(zone).toInstant()
    val elevenAmToday = today.atTime(LocalTime.of(11, 0)).atZone(zone).toInstant()

    val resp = c.readRecords(
      ReadRecordsRequest(
        recordType = SleepSessionRecord::class,
        timeRangeFilter = TimeRangeFilter.between(sixPmYesterday, elevenAmToday)
      )
    )
    if (resp.records.isEmpty()) return null

    val asleepStages = setOf(
      SleepSessionRecord.STAGE_TYPE_SLEEPING,
      SleepSessionRecord.STAGE_TYPE_LIGHT,
      SleepSessionRecord.STAGE_TYPE_DEEP,
      SleepSessionRecord.STAGE_TYPE_REM
    )
    var totalSeconds = 0L
    resp.records.forEach { session ->
      session.stages.forEach { stage ->
        if (stage.stage in asleepStages) {
          totalSeconds += Duration.between(stage.startTime, stage.endTime).seconds
        }
      }
    }
    return if (totalSeconds > 0) totalSeconds / 60.0 else null
  }

  companion object {
    private const val POLL_INTERVAL_MS = 5_000L
  }
}
