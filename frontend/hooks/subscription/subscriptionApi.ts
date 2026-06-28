import { apiFetch } from '../../utils/api';
import type { StoreKitTransaction } from '../../modules/mood-storekit/src';
import { INTRO_TRIAL_WINDOW_MS } from './constants';
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
  status_hint?: 'in_trial' | 'active';
}

function toApiStatusHint(
  hint: 'in_trial' | 'active' | 'lapsed' | undefined,
): 'in_trial' | 'active' | undefined {
  if (hint === 'in_trial' || hint === 'active') return hint;
  return undefined;
}

function buildTransactionPayload(
  txn: StoreKitTransaction,
  extra?: ValidateSubscriptionOptions,
  inferredHint?: 'in_trial' | 'active' | 'lapsed',
) {
  const status_hint = toApiStatusHint(extra?.status_hint ?? inferredHint);
  return {
    signed_payload: txn.signedPayload,
    product_id: txn.productID,
    transaction_id: txn.transactionID,
    original_transaction_id: txn.originalTransactionID,
    purchase_date: txn.purchaseDate,
    expiration_date: txn.expirationDate,
    ...(extra?.trigger_source ? { trigger_source: extra.trigger_source } : {}),
    ...(status_hint ? { status_hint } : {}),
  };
}

/** Infer trial vs paid from purchase/expiration window (StoreKit2 intro offer). */
export function inferStatusHint(txn: StoreKitTransaction): 'in_trial' | 'active' | 'lapsed' {
  if (!txn.expirationDate) return 'active';
  const expMs = new Date(txn.expirationDate).getTime();
  const nowMs = Date.now();
  if (!Number.isFinite(expMs) || expMs <= nowMs) return 'lapsed';
  const purchaseMs = new Date(txn.purchaseDate).getTime();
  if (Number.isFinite(purchaseMs) && expMs - purchaseMs <= INTRO_TRIAL_WINDOW_MS) {
    return 'in_trial';
  }
  return 'active';
}

export async function validateSubscriptionTransaction(
  token: string,
  txn: StoreKitTransaction,
  options?: ValidateSubscriptionOptions,
) {
  const inferred = inferStatusHint(txn);
  const status_hint = toApiStatusHint(options?.status_hint ?? inferred);
  console.log('[IAP] POST /api/subscription/validate — starting', {
    product_id: txn.productID,
    transaction_id: txn.transactionID,
    status_hint: status_hint ?? inferred,
  });

  const res = await apiFetch<SubscriptionSyncResponse>('/api/subscription/validate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildTransactionPayload(txn, options, inferred)),
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
    const inferred = inferStatusHint(txn);
    const status_hint = toApiStatusHint(inferred);
    console.log('[IAP] POST /api/subscription/sync — starting (entitlement)', {
      product_id: txn.productID,
      transaction_id: txn.transactionID,
      status_hint: status_hint ?? inferred,
    });

    const res = await apiFetch<SubscriptionSyncResponse>('/api/subscription/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        has_active_entitlement: true,
        ...buildTransactionPayload(txn, undefined, inferred),
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
