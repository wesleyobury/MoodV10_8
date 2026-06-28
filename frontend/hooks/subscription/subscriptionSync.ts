import {
  ALL_PRODUCT_IDS,
  currentEntitlements,
  isStoreKitAvailable,
  onTransactionUpdate,
  type StoreKitTransaction,
} from '../../modules/mood-storekit/src';
import { syncSubscriptionWithBackend, type SubscriptionSyncResponse } from './subscriptionApi';
import { markSubscriptionSynced, shouldSyncSubscription } from './subscriptionVerifySchedule';

const MOOD_PRODUCT_IDS = new Set<string>(ALL_PRODUCT_IDS);

function isMoodSubscriptionProduct(productID: string): boolean {
  return MOOD_PRODUCT_IDS.has(productID);
}

function pickLatestEntitlement(transactions: StoreKitTransaction[]): StoreKitTransaction | null {
  const moodTxns = transactions.filter((t) => isMoodSubscriptionProduct(t.productID));
  if (!moodTxns.length) return null;

  return moodTxns.reduce((latest, txn) => {
    const latestExp = latest.expirationDate ? new Date(latest.expirationDate).getTime() : 0;
    const txnExp = txn.expirationDate ? new Date(txn.expirationDate).getTime() : 0;
    if (txnExp !== latestExp) {
      return txnExp >= latestExp ? txn : latest;
    }
    const latestPurchase = new Date(latest.purchaseDate).getTime();
    const txnPurchase = new Date(txn.purchaseDate).getTime();
    return txnPurchase >= latestPurchase ? txn : latest;
  });
}

export async function getLatestSubscriptionEntitlement(): Promise<StoreKitTransaction | null> {
  if (!isStoreKitAvailable()) return null;
  const entitlements = await currentEntitlements();
  return pickLatestEntitlement(entitlements);
}

export type SubscriptionSyncResult = {
  response: SubscriptionSyncResponse | null;
  skipped: boolean;
};

/**
 * Read StoreKit entitlements and reconcile with the backend.
 * Throttled unless `force` is true.
 */
export async function syncSubscriptionOnAppOpen(
  token: string,
  options?: { force?: boolean },
): Promise<SubscriptionSyncResult> {
  if (!token) {
    return { response: null, skipped: true };
  }

  if (!(await shouldSyncSubscription(options?.force))) {
    console.log('[IAP] subscription sync skipped — within throttle window');
    return { response: null, skipped: true };
  }

  if (!isStoreKitAvailable()) {
    await markSubscriptionSynced();
    return { response: null, skipped: false };
  }

  const latest = await getLatestSubscriptionEntitlement();
  const apiRes = await syncSubscriptionWithBackend(token, latest);

  if (apiRes.ok) {
    await markSubscriptionSynced();
    return { response: apiRes.data, skipped: false };
  }

  return { response: null, skipped: false };
}

/** Background StoreKit renewals / trial conversions while app is open. */
export function listenForSubscriptionUpdates(
  token: string | null,
  onSynced: (response: SubscriptionSyncResponse | null) => void,
): () => void {
  if (!token || !isStoreKitAvailable()) {
    return () => {};
  }

  const sub = onTransactionUpdate(async (txn) => {
    if (!isMoodSubscriptionProduct(txn.productID)) return;

    console.log('[IAP] onTransactionUpdate — syncing', {
      product_id: txn.productID,
      transaction_id: txn.transactionID,
    });

    try {
      const apiRes = await syncSubscriptionWithBackend(token, txn);
      if (apiRes.ok) {
        await markSubscriptionSynced();
        onSynced(apiRes.data);
      }
    } catch (err) {
      console.error('[IAP] onTransactionUpdate sync failed', err);
    }
  });

  return () => sub.remove();
}
