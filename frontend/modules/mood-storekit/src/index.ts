/**
 * mood-storekit — RN bridge to the native StoreKit 2 module.
 *
 * Surface area mirrors `mood-healthkit`: thin wrappers that forward to
 * native, with safe defaults so callers never crash when the native
 * module is missing (Expo Go, web preview, Android).
 *
 * Product IDs are pinned here as the single source of truth.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * Pinned product IDs — must match the App Store Connect entries.
 *
 * Trial SKUs carry the 7-day introductory offer in App Store Connect.
 * Paid SKUs are equivalent plans with NO introductory offer, used by the
 * "Subscribe Now" CTA when we want Apple's sheet to charge immediately.
 */
export const MONTHLY_TRIAL_PRODUCT_ID = 'com.mood.subscription.monthly';
export const YEARLY_TRIAL_PRODUCT_ID = 'com.mood.subscription.annual';
export const MONTHLY_PAID_PRODUCT_ID = 'com.mood.subscription.monthly.paid';
export const YEARLY_PAID_PRODUCT_ID = 'com.mood.subscription.annual.paid';
export const FOUNDING_PRODUCT_ID = 'com.mood.subscription.founding_annual';

// Legacy aliases: existing trial-enabled SKUs.
export const MONTHLY_PRODUCT_ID = MONTHLY_TRIAL_PRODUCT_ID;
export const YEARLY_PRODUCT_ID = YEARLY_TRIAL_PRODUCT_ID;

export const ALL_PRODUCT_IDS = [
  MONTHLY_TRIAL_PRODUCT_ID,
  YEARLY_TRIAL_PRODUCT_ID,
  MONTHLY_PAID_PRODUCT_ID,
  YEARLY_PAID_PRODUCT_ID,
  FOUNDING_PRODUCT_ID,
] as const;

export type ProductPlan = 'monthly' | 'yearly';
export type PurchaseIntent = 'subscribe_now' | 'start_free_trial';

export interface StoreKitProduct {
  productID: string;
  displayName: string;
  description: string;
  displayPrice: string;
  priceDecimal: number;
  currencyCode: string | null;
  isFamilyShareable: boolean;
}

export interface StoreKitTransaction {
  productID: string;
  transactionID: string;
  originalTransactionID: string;
  purchaseDate: string;
  expirationDate: string | null;
  isUpgraded: boolean;
  signedPayload: string;
  appAccountToken?: string | null;
}

export type PurchaseResult =
  | ({ status: 'success' } & StoreKitTransaction)
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'unknown' };

interface NativeModuleShape {
  getProducts(productIDs: string[]): Promise<StoreKitProduct[]>;
  purchase(productID: string, appAccountToken?: string | null): Promise<PurchaseResult>;
  restorePurchases(): Promise<StoreKitTransaction[]>;
  currentEntitlements(): Promise<StoreKitTransaction[]>;
  addListener(eventName: string, listener: (...args: any[]) => void): { remove: () => void };
}

const native = requireOptionalNativeModule<NativeModuleShape>('MoodStoreKit');

export function isStoreKitAvailable(): boolean {
  // iOS → StoreKit 2; Android → Google Play Billing. Both register the native
  // module under the name "MoodStoreKit". Web / Expo Go have no native module.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  return !!native;
}

export async function getProducts(productIDs: readonly string[] = ALL_PRODUCT_IDS): Promise<StoreKitProduct[]> {
  if (!native) return [];
  try {
    return await native.getProducts([...productIDs]);
  } catch {
    return [];
  }
}

export function productIDForPlan(plan: ProductPlan, intent: PurchaseIntent): string {
  if (intent === 'subscribe_now') {
    return plan === 'yearly' ? YEARLY_PAID_PRODUCT_ID : MONTHLY_PAID_PRODUCT_ID;
  }
  return plan === 'yearly' ? YEARLY_TRIAL_PRODUCT_ID : MONTHLY_TRIAL_PRODUCT_ID;
}

/**
 * Deterministic Apple appAccountToken for the current MOOD user.
 *
 * Apple requires a UUID. Our authenticated user ids are Mongo ObjectIds
 * (24 hex chars), so we embed them in a UUID-shaped value and set standard
 * version/variant nibbles. The backend mirrors this helper before granting
 * access from a StoreKit transaction.
 */
export function appAccountTokenForUserId(userId?: string | null): string | null {
  const hex = (userId ?? '').trim().toLowerCase();
  if (!/^[0-9a-f]{24}$/.test(hex)) return null;
  const chars = `00000000${hex}`.split('');
  chars[12] = '5';
  const variant = (parseInt(chars[16], 16) & 0x3) | 0x8;
  chars[16] = variant.toString(16);
  const raw = chars.join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
}

export async function purchase(productID: string, appAccountToken?: string | null): Promise<PurchaseResult> {
  if (!native) return { status: 'cancelled' };
  return native.purchase(productID, appAccountToken ?? null);
}

export async function restorePurchases(): Promise<StoreKitTransaction[]> {
  if (!native) return [];
  try {
    return await native.restorePurchases();
  } catch {
    return [];
  }
}

export async function currentEntitlements(): Promise<StoreKitTransaction[]> {
  if (!native) return [];
  try {
    return await native.currentEntitlements();
  } catch {
    return [];
  }
}

/**
 * Subscribe to background transaction updates (renewals, day-7 trial-to-
 * paid charges, family share additions). Returns a remover.
 */
export function onTransactionUpdate(
  listener: (txn: StoreKitTransaction) => void
): { remove: () => void } {
  if (!native) return { remove: () => {} };
  const sub = native.addListener('onTransactionUpdate', (event: any) => {
    if (event && typeof event.productID === 'string' && typeof event.signedPayload === 'string') {
      listener(event as StoreKitTransaction);
    }
  });
  return { remove: () => sub.remove() };
}

export function planFromProductID(productID: string): ProductPlan | null {
  if (productID === MONTHLY_TRIAL_PRODUCT_ID || productID === MONTHLY_PAID_PRODUCT_ID) return 'monthly';
  if (productID === YEARLY_TRIAL_PRODUCT_ID || productID === YEARLY_PAID_PRODUCT_ID) return 'yearly';
  return null;
}
