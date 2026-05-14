import ExpoModulesCore
import StoreKit

/// MOOD StoreKit 2 bridge.
///
/// Exposes 4 methods to JS:
///   • `getProducts(productIds)` — loads SKProduct metadata for the paywall.
///   • `purchase(productId)` — presents the native purchase sheet, resolves
///     with the verified transaction's JWS representation.
///   • `restorePurchases()` — re-syncs current entitlements with the App
///     Store (calls AppStore.sync() then re-reads currentEntitlements).
///   • `currentEntitlements()` — read-only snapshot of active subscriptions.
///
/// Plus a single event `onTransactionUpdate` that the JS layer listens to
/// for background transactions (auto-renewals, day-7 trial→paid conversions,
/// family-sharing additions). The Phase B/C trigger-source attribution loop
/// completes here: the JS layer reads the event payload's `productID +
/// transactionDate`, calls the backend webhook, and the backend stamps
/// `subscription_purchased` with the original `subscription.last_trigger_source`.
///
/// All returned transactions are signed by Apple via JWS — JS forwards the
/// raw signedPayload to the backend webhook which verifies the signature
/// before granting entitlement.
public class MoodStoreKitModule: Module {

  /// The background transaction listener handle — started once on module
  /// load, cancelled on deinit. StoreKit2 design: every paid transaction
  /// (foreground purchase, restore, renewal, family-share) flows through
  /// `Transaction.updates` regardless of where it originated.
  private var transactionListener: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("MoodStoreKit")

    // JS subscribes to this for renewals, day-7 charges, family share, etc.
    Events("onTransactionUpdate")

    OnCreate {
      self.transactionListener = self.startTransactionListener()
    }

    OnDestroy {
      self.transactionListener?.cancel()
      self.transactionListener = nil
    }

    /// Load metadata for the supplied product IDs from the App Store.
    /// Returns `[ { productID, displayName, description, displayPrice,
    /// currencyCode, isFamilyShareable } ]`. Missing IDs are silently
    /// omitted (matches StoreKit2 semantics).
    AsyncFunction("getProducts") { (productIDs: [String], promise: Promise) in
      Task {
        do {
          let products = try await Product.products(for: Set(productIDs))
          let payload = products.map { p -> [String: Any] in
            return [
              "productID": p.id,
              "displayName": p.displayName,
              "description": p.description,
              "displayPrice": p.displayPrice,
              "priceDecimal": NSDecimalNumber(decimal: p.price).doubleValue,
              "currencyCode": p.priceFormatStyle.currencyCode,
              "isFamilyShareable": p.isFamilyShareable
            ]
          }
          promise.resolve(payload)
        } catch {
          promise.reject("E_STOREKIT_PRODUCTS", error.localizedDescription)
        }
      }
    }

    /// Trigger a purchase flow. Presents Apple's native purchase sheet.
    /// On success, resolves with the verified transaction's signed JWS so
    /// the backend can validate independently. On cancel or pending state,
    /// resolves with `{ status: "cancelled" | "pending" }`.
    AsyncFunction("purchase") { (productID: String, promise: Promise) in
      Task {
        do {
          let products = try await Product.products(for: [productID])
          guard let product = products.first else {
            promise.reject("E_STOREKIT_NO_PRODUCT", "Product \(productID) not found")
            return
          }
          let result = try await product.purchase()
          switch result {
          case .success(let verification):
            switch verification {
            case .verified(let transaction):
              // Finishing acknowledges the transaction to Apple. We finish
              // AFTER our backend has validated the JWS in production —
              // for now we finish immediately because we already trust
              // StoreKit's verification client-side. Phase C+: gate behind
              // a backend confirm round-trip.
              await transaction.finish()
              promise.resolve([
                "status": "success",
                "productID": transaction.productID,
                "transactionID": String(transaction.id),
                "originalTransactionID": String(transaction.originalID),
                "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                "expirationDate": transaction.expirationDate.map { ISO8601DateFormatter().string(from: $0) } as Any,
                "isUpgraded": transaction.isUpgraded,
                "signedPayload": verification.jwsRepresentation
              ])
            case .unverified(_, let error):
              promise.reject("E_STOREKIT_UNVERIFIED", error.localizedDescription)
            }
          case .userCancelled:
            promise.resolve(["status": "cancelled"])
          case .pending:
            promise.resolve(["status": "pending"])
          @unknown default:
            promise.resolve(["status": "unknown"])
          }
        } catch {
          promise.reject("E_STOREKIT_PURCHASE", error.localizedDescription)
        }
      }
    }

    /// Restore Purchases — re-syncs and returns the current verified
    /// entitlements. Equivalent to "Restore Purchases" button in iOS
    /// settings.
    AsyncFunction("restorePurchases") { (promise: Promise) in
      Task {
        do {
          try await AppStore.sync()
          let payload = await self.snapshotEntitlements()
          promise.resolve(payload)
        } catch {
          promise.reject("E_STOREKIT_RESTORE", error.localizedDescription)
        }
      }
    }

    /// Read-only snapshot of current verified entitlements. Use this on
    /// app launch to reconcile the local subscription cache with Apple's
    /// authoritative state.
    AsyncFunction("currentEntitlements") { (promise: Promise) in
      Task {
        let payload = await self.snapshotEntitlements()
        promise.resolve(payload)
      }
    }
  }

  // MARK: - Helpers

  private func snapshotEntitlements() async -> [[String: Any]] {
    var out: [[String: Any]] = []
    for await result in Transaction.currentEntitlements {
      if case .verified(let t) = result {
        out.append([
          "productID": t.productID,
          "transactionID": String(t.id),
          "originalTransactionID": String(t.originalID),
          "purchaseDate": ISO8601DateFormatter().string(from: t.purchaseDate),
          "expirationDate": t.expirationDate.map { ISO8601DateFormatter().string(from: $0) } as Any,
          "isUpgraded": t.isUpgraded,
          "signedPayload": result.jwsRepresentation
        ])
      }
    }
    return out
  }

  /// Long-running listener for transaction updates from outside the app's
  /// foreground purchase flow: renewals, family-share additions, ask-to-buy
  /// approvals, and — most importantly — the day-7 trial→paid charge that
  /// happens server-side on Apple's side and fires here on the client too.
  private func startTransactionListener() -> Task<Void, Never> {
    return Task.detached { [weak self] in
      for await result in Transaction.updates {
        guard let self = self else { return }
        if case .verified(let t) = result {
          // Notify JS, then finish to acknowledge.
          self.sendEvent("onTransactionUpdate", [
            "productID": t.productID,
            "transactionID": String(t.id),
            "originalTransactionID": String(t.originalID),
            "purchaseDate": ISO8601DateFormatter().string(from: t.purchaseDate),
            "expirationDate": t.expirationDate.map { ISO8601DateFormatter().string(from: $0) } as Any,
            "isUpgraded": t.isUpgraded,
            "signedPayload": result.jwsRepresentation
          ])
          await t.finish()
        }
      }
    }
  }
}
