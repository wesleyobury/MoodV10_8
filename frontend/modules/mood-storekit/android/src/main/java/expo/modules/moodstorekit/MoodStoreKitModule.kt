package expo.modules.moodstorekit

import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.acknowledgePurchase
import com.android.billingclient.api.queryProductDetails
import com.android.billingclient.api.queryPurchasesAsync
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.resume

/**
 * MOOD Google Play Billing bridge — the Android counterpart to the iOS
 * StoreKit 2 module (MoodStoreKitModule.swift).
 *
 * Exposes the SAME JS surface consumed by mood-storekit/src/index.ts, so the
 * PaywallModal / useTrialPurchase / useFoundingPurchase / hooks-subscription
 * layer is unchanged:
 *
 *   • getProducts(productIDs)   — queryProductDetails(SUBS) → StoreKitProduct[]
 *   • purchase(productID)       — launchBillingFlow → acknowledge → PurchaseResult
 *   • restorePurchases()        — queryPurchasesAsync(SUBS)
 *   • currentEntitlements()     — queryPurchasesAsync(SUBS), acknowledged only
 *   • onTransactionUpdate event — PurchasesUpdatedListener (in-app changes)
 *
 * KEY DIFFERENCE FROM iOS (see the Android-Parity plan §2.3): Google Play does
 * NOT return a self-verifiable signed payload. `signedPayload` on Android
 * carries the opaque Play `purchaseToken`; the backend MUST call the Play
 * Developer API (purchases.subscriptionsv2.get) to verify it and to learn the
 * expiry / trial state. Fields Apple provides at purchase time that Google
 * does not (expirationDate, isUpgraded) are left null/false here and are
 * filled in server-side after that lookup. Renewals arrive via RTDN on the
 * backend, not through this client listener.
 */
class MoodStoreKitModule : Module() {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

  private var billingClient: BillingClient? = null

  private val trialProductIds = setOf(
    "com.mood.subscription.monthly",
    "com.mood.subscription.annual"
  )

  /**
   * Purchases initiated via `purchase()` resolve asynchronously through the
   * PurchasesUpdatedListener, so we stash the pending promise keyed by the
   * product id being bought.
   */
  private val pendingPurchases = ConcurrentHashMap<String, Promise>()

  /** Listener for every purchase update — foreground buys and (rarely) in-app
   *  state changes. This is the analogue of iOS `Transaction.updates`, but on
   *  Android the authoritative renewal feed is server-side RTDN. */
  private val purchasesUpdatedListener = PurchasesUpdatedListener { result, purchases ->
    when (result.responseCode) {
      BillingClient.BillingResponseCode.OK -> {
        purchases?.forEach { purchase ->
          scope.launch { handlePurchase(purchase) }
        }
      }
      BillingClient.BillingResponseCode.USER_CANCELED -> {
        // Resolve any waiting purchase promises as cancelled.
        drainPending { it.resolve(mapOf("status" to "cancelled")) }
      }
      else -> {
        drainPending { it.resolve(mapOf("status" to "unknown")) }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MoodStoreKit")

    Events("onTransactionUpdate")

    OnCreate {
      billingClient = BillingClient.newBuilder(context)
        .setListener(purchasesUpdatedListener)
        .enablePendingPurchases(
          PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
        )
        .build()
    }

    OnDestroy {
      pendingPurchases.clear()
      try {
        billingClient?.endConnection()
      } catch (_: Throwable) {
      }
      billingClient = null
      scope.cancel()
    }

    /** Load subscription metadata for the given product IDs. Missing IDs are
     *  silently omitted, matching the iOS/StoreKit semantics. */
    AsyncFunction("getProducts") { productIDs: List<String>, promise: Promise ->
      scope.launch {
        try {
          ensureConnected()
          val productList = productIDs.map { id ->
            QueryProductDetailsParams.Product.newBuilder()
              .setProductId(id)
              .setProductType(BillingClient.ProductType.SUBS)
              .build()
          }
          val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()
          val details = billingClient!!.queryProductDetails(params)
          val payload = details.productDetailsList?.map { serializeProduct(it) } ?: emptyList()
          promise.resolve(payload)
        } catch (e: Throwable) {
          promise.reject("E_STOREKIT_PRODUCTS", e.message ?: "getProducts failed", e)
        }
      }
    }

    /** Launch the Play purchase sheet for a subscription. Resolves through the
     *  PurchasesUpdatedListener with a StoreKitTransaction-shaped success map,
     *  or { status: "cancelled" | "pending" | "unknown" }. */
    AsyncFunction("purchase") { productID: String, appAccountToken: String?, promise: Promise ->
      scope.launch {
        try {
          ensureConnected()
          val activity = appContext.throwingActivity
          val productParams = QueryProductDetailsParams.newBuilder()
            .setProductList(
              listOf(
                QueryProductDetailsParams.Product.newBuilder()
                  .setProductId(productID)
                  .setProductType(BillingClient.ProductType.SUBS)
                  .build()
              )
            )
            .build()
          val details = billingClient!!.queryProductDetails(productParams)
          val product = details.productDetailsList?.firstOrNull()
          if (product == null) {
            promise.reject("E_STOREKIT_NO_PRODUCT", "Product $productID not found", null)
            return@launch
          }
          val offerToken = selectOffer(product, productID)?.offerToken
          if (offerToken == null) {
            promise.reject("E_STOREKIT_NO_OFFER", "No subscription offer for $productID", null)
            return@launch
          }

          // Stash the promise; PurchasesUpdatedListener resolves it.
          pendingPurchases[productID] = promise

          val flowBuilder = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
              listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                  .setProductDetails(product)
                  .setOfferToken(offerToken)
                  .build()
              )
            )
          if (!appAccountToken.isNullOrBlank()) {
            flowBuilder.setObfuscatedAccountId(appAccountToken)
          }
          val flowParams = flowBuilder.build()

          val launch = billingClient!!.launchBillingFlow(activity, flowParams)
          if (launch.responseCode != BillingClient.BillingResponseCode.OK) {
            pendingPurchases.remove(productID)
            promise.reject(
              "E_STOREKIT_PURCHASE",
              "launchBillingFlow failed: ${launch.debugMessage}",
              null
            )
          }
        } catch (e: Throwable) {
          pendingPurchases.remove(productID)
          promise.reject("E_STOREKIT_PURCHASE", e.message ?: "purchase failed", e)
        }
      }
    }

    /** Restore = re-query the local Play cache of owned subscriptions. There is
     *  no store round-trip equivalent to AppStore.sync() needed on Android. */
    AsyncFunction("restorePurchases") { promise: Promise ->
      scope.launch { resolveEntitlements(promise) }
    }

    /** Read-only snapshot of current (acknowledged, active) subscriptions. */
    AsyncFunction("currentEntitlements") { promise: Promise ->
      scope.launch { resolveEntitlements(promise) }
    }
  }

  // MARK: - Helpers

  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  /** Ensure the BillingClient is connected; suspends until ready or throws. */
  private suspend fun ensureConnected() {
    val client = billingClient ?: throw IllegalStateException("BillingClient not initialised")
    if (client.isReady) return
    suspendCancellableCoroutine<Unit> { cont ->
      client.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          if (result.responseCode == BillingClient.BillingResponseCode.OK) {
            if (cont.isActive) cont.resume(Unit)
          } else {
            if (cont.isActive) {
              cont.cancel(IllegalStateException("Billing setup failed: ${result.debugMessage}"))
            }
          }
        }

        override fun onBillingServiceDisconnected() {
          // Left to the next ensureConnected() call to retry.
        }
      })
    }
  }

  /** Acknowledge (required within 3 days) and notify JS of the new transaction. */
  private suspend fun handlePurchase(purchase: Purchase) {
    if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
      // e.g. PENDING (slow payment method). Resolve the waiting promise.
      purchase.products.forEach { pid ->
        pendingPurchases.remove(pid)?.resolve(mapOf("status" to "pending"))
      }
      return
    }

    // Acknowledge if not already — Google auto-refunds unacknowledged purchases.
    if (!purchase.isAcknowledged) {
      try {
        val ackParams = AcknowledgePurchaseParams.newBuilder()
          .setPurchaseToken(purchase.purchaseToken)
          .build()
        billingClient?.acknowledgePurchase(ackParams)
      } catch (_: Throwable) {
        // Non-fatal here; the backend can also acknowledge via the Play
        // Developer API after server-side verification.
      }
    }

    val txn = serializeTransaction(purchase)

    // Resolve any foreground purchase() promise waiting on these product ids.
    var resolvedForeground = false
    purchase.products.forEach { pid ->
      pendingPurchases.remove(pid)?.let {
        it.resolve(HashMap(txn).apply { put("status", "success") })
        resolvedForeground = true
      }
    }

    // Always emit the background event too (analogue of Transaction.updates)
    // so the JS reconciliation loop stays consistent whether or not a
    // foreground promise was in flight.
    sendEvent("onTransactionUpdate", txn)
    if (!resolvedForeground) {
      // no-op: event already sent
    }
  }

  /** Shared body for restorePurchases() and currentEntitlements(). */
  private suspend fun resolveEntitlements(promise: Promise) {
    try {
      ensureConnected()
      val params = QueryPurchasesParams.newBuilder()
        .setProductType(BillingClient.ProductType.SUBS)
        .build()
      val result = billingClient!!.queryPurchasesAsync(params)
      val active = result.purchasesList
        .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        .map { serializeTransaction(it) }
      promise.resolve(active)
    } catch (e: Throwable) {
      // Match iOS: never throw for entitlement reads — return empty.
      promise.resolve(emptyList<Map<String, Any?>>())
    }
  }

  private fun serializeProduct(product: ProductDetails): Map<String, Any?> {
    val offer = selectOffer(product, product.productId)
    // The last pricing phase is the recurring/base price; earlier phases are
    // intro/trial offers. Use the last phase for the headline display price.
    val phase = offer?.pricingPhases?.pricingPhaseList?.lastOrNull()
    val priceMicros = phase?.priceAmountMicros ?: 0L
    return mapOf(
      "productID" to product.productId,
      "displayName" to product.name,
      "description" to product.description,
      "displayPrice" to (phase?.formattedPrice ?: ""),
      "priceDecimal" to (priceMicros / 1_000_000.0),
      "currencyCode" to phase?.priceCurrencyCode,
      // Play Family Library covers subscriptions by account setting, not a
      // per-product flag — expose false to match the iOS field's meaning.
      "isFamilyShareable" to false
    )
  }

  private fun selectOffer(
    product: ProductDetails,
    productID: String
  ): ProductDetails.SubscriptionOfferDetails? {
    val offers = product.subscriptionOfferDetails ?: return null
    if (offers.isEmpty()) return null

    val wantsTrialOffer = trialProductIds.contains(productID)
    return offers.firstOrNull { offerLooksTrial(it) == wantsTrialOffer }
      ?: offers.firstOrNull { !offerLooksTrial(it) }
      ?: offers.first()
  }

  private fun offerLooksTrial(offer: ProductDetails.SubscriptionOfferDetails): Boolean {
    val offerId = offer.offerId?.lowercase(Locale.US) ?: ""
    val basePlanId = offer.basePlanId.lowercase(Locale.US)
    val tags = offer.offerTags.map { it.lowercase(Locale.US) }
    val hasFreePhase = offer.pricingPhases.pricingPhaseList.any { it.priceAmountMicros == 0L }
    return hasFreePhase ||
      offerId.contains("trial") ||
      basePlanId.contains("trial") ||
      tags.any { it.contains("trial") }
  }

  private fun serializeTransaction(purchase: Purchase): Map<String, Any?> {
    val productID = purchase.products.firstOrNull() ?: ""
    return mapOf(
      "productID" to productID,
      // Play's closest analogue to a transaction id is the order id; it can be
      // null for test/promo purchases, so fall back to the purchase token.
      "transactionID" to (purchase.orderId ?: purchase.purchaseToken),
      // Play has no separate "original" id; the purchase token is the stable
      // per-subscription handle the backend keys on.
      "originalTransactionID" to purchase.purchaseToken,
      "purchaseDate" to isoFromMillis(purchase.purchaseTime),
      // Unknown client-side on Android — filled by the backend after
      // purchases.subscriptionsv2.get.
      "expirationDate" to null,
      "isUpgraded" to false,
      // The opaque Play purchase token. Backend verifies THIS, not a signature.
      "signedPayload" to purchase.purchaseToken,
      "appAccountToken" to purchase.accountIdentifiers?.obfuscatedAccountId
    )
  }

  private fun drainPending(action: (Promise) -> Unit) {
    val keys = pendingPurchases.keys().toList()
    keys.forEach { k -> pendingPurchases.remove(k)?.let(action) }
  }

  private fun isoFromMillis(millis: Long): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    fmt.timeZone = TimeZone.getTimeZone("UTC")
    return fmt.format(Date(millis))
  }
}
