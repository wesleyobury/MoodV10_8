import { Platform } from 'react-native';
import { apiFetch } from '../../utils/api';
import type { StoreKitTransaction } from '../../modules/mood-storekit/src';
import { markSubscriptionSynced } from './subscriptionVerifySchedule';

export interface SubscriptionSyncResponse {
  ok: boolean;
  status: 'active' | 'in_trial' | 'lapsed' | 'none';
  plan?: string | null;
  has_full_access?: boolean;
  trigger_source?: string | null;
}

export interface ValidateSubscriptionOptions {
  trigger_source?: string;
}

function buildTransactionPayload(
  txn: StoreKitTransaction,
  extra?: ValidateSubscriptionOptions,
) {
  return {
    signed_payload: txn.signedPayload,
    product_id: txn.productID,
    transaction_id: txn.transactionID,
    original_transaction_id: txn.originalTransactionID,
    purchase_date: txn.purchaseDate,
    expiration_date: txn.expirationDate,
    app_account_token: txn.appAccountToken ?? null,
    // Tells the backend which verifier to use: Apple JWS vs Play Developer API.
    // On Android `signed_payload` carries the opaque Play purchaseToken.
    platform: Platform.OS === 'android' ? 'google' : 'apple',
    ...(extra?.trigger_source ? { trigger_source: extra.trigger_source } : {}),
  };
}

export async function validateSubscriptionTransaction(
  token: string,
  txn: StoreKitTransaction,
  options?: ValidateSubscriptionOptions,
) {
  console.log('[IAP] POST /api/subscription/validate — starting', {
    product_id: txn.productID,
    transaction_id: txn.transactionID,
  });

  const res = await apiFetch<SubscriptionSyncResponse>('/api/subscription/validate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildTransactionPayload(txn, options)),
  });

  if (res.ok) {
    console.log('[IAP] POST /api/subscription/validate — OK', res.status, res.data);
    await markSubscriptionSynced();
  } else {
    console.error('[IAP] POST /api/subscription/validate — FAILED', res.status, res.error);
  }

  return res;
}

export async function syncSubscriptionWithBackend(
  token: string,
  txn: StoreKitTransaction | null,
) {
  if (txn) {
    console.log('[IAP] POST /api/subscription/sync — starting (entitlement)', {
      product_id: txn.productID,
      transaction_id: txn.transactionID,
    });

    const res = await apiFetch<SubscriptionSyncResponse>('/api/subscription/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        has_active_entitlement: true,
        ...buildTransactionPayload(txn),
      }),
    });

    if (res.ok) {
      console.log('[IAP] POST /api/subscription/sync — OK', res.status, res.data);
    } else {
      console.error('[IAP] POST /api/subscription/sync — FAILED', res.status, res.error);
    }

    return res;
  }

  console.log('[IAP] POST /api/subscription/sync — starting (no active entitlement)');

  const res = await apiFetch<SubscriptionSyncResponse>('/api/subscription/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ has_active_entitlement: false }),
  });

  if (res.ok) {
    console.log('[IAP] POST /api/subscription/sync — OK (lapsed/none)', res.status, res.data);
  } else {
    console.error('[IAP] POST /api/subscription/sync — FAILED', res.status, res.error);
  }

  return res;
}
