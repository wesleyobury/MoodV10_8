/**
 * mood-storekit — RN bridge to the native StoreKit 2 module.
 *
 * Surface area mirrors `mood-healthkit`: thin wrappers that forward to
 * native, with safe defaults so callers never crash when the native
 * module is missing (Expo Go, web preview, Android).
 *
 * Product IDs are pinned here as the single source of truth. The native
 * layer accepts arbitrary ids so testers can swap to sandbox sku without
 * a rebuild.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * Pinned product IDs — must match the App Store Connect entries. Phase C
 * v1.0 launch:
 *   • mood_premium_monthly  — $9.99/mo, auto-renewing, 7-day intro trial
 *   • mood_premium_yearly   — $79.99/yr, auto-renewing, 7-day intro trial
 */
export const MONTHLY_PRODUCT_ID = 'mood_premium_monthly';
export const YEARLY_PRODUCT_ID = 'mood_premium_yearly';
export const FOUNDING_PRODUCT_ID = 'mood_premium_founding_annual';
export const ALL_PRODUCT_IDS = [MONTHLY_PRODUCT_ID, YEARLY_PRODUCT_ID, FOUNDING_PRODUCT_ID] as const;

export type ProductPlan = 'monthly' | 'yearly';

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
}

export type PurchaseResult =
  | ({ status: 'success' } & StoreKitTransaction)
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'unknown' };

interface NativeModuleShape {
  getProducts(productIDs: string[]): Promise<StoreKitProduct[]>;
  purchase(productID: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<StoreKitTransaction[]>;
  currentEntitlements(): Promise<StoreKitTransaction[]>;
  addListener(eventName: string, listener: (...args: any[]) => void): { remove: () => void };
}

const native = requireOptionalNativeModule<NativeModuleShape>('MoodStoreKit');

export function isStoreKitAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
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

export async function purchase(productID: string): Promise<PurchaseResult> {
  if (!native) return { status: 'cancelled' };
  return native.purchase(productID);
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
  if (productID === MONTHLY_PRODUCT_ID) return 'monthly';
  if (productID === YEARLY_PRODUCT_ID) return 'yearly';
  return null;
}
