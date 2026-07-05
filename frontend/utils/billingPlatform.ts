import { Linking, Platform } from 'react-native';

const ANDROID_PACKAGE = 'com.official.moodapp';

export const isGooglePlayBilling = Platform.OS === 'android';
export const billingStoreName = isGooglePlayBilling ? 'Google Play' : 'App Store';
export const billingAccountName = isGooglePlayBilling ? 'Google Play account' : 'Apple ID account';
export const billingProcessorName = isGooglePlayBilling ? 'Google Play' : 'Apple';

export const manageSubscriptionUrl = isGooglePlayBilling
  ? `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`
  : 'https://apps.apple.com/account/subscriptions';

export const manageSubscriptionLabel = `Manage subscription in ${billingStoreName}`;

export const billingDisclosure =
  `Payment will be charged to your ${billingAccountName} at confirmation of purchase. ` +
  'Subscription automatically renews unless it is canceled before the end of the current period. ' +
  `You can manage or cancel your subscription in ${billingStoreName}.`;

export const billingUnavailableMessage =
  `We couldn't reach ${billingStoreName} just now. Please check your connection and try again.`;

export function billingValidationFailureMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return `Your ${billingStoreName} purchase went through, but we couldn't link it to this MOOD account. If you subscribed on another MOOD profile, log into that profile and tap Restore Purchases.`;
}

export function subscriptionNotActiveMessage(): string {
  return `${billingStoreName} returned the purchase, but this MOOD account does not have an active subscription yet. Please try Restore Purchases or check the subscription status in ${billingStoreName}.`;
}

export function noRestorablePurchasesMessage(): string {
  return `We couldn't find an active MOOD subscription in ${billingStoreName}.`;
}

export function openSubscriptionManagement(): Promise<void> {
  return Linking.openURL(manageSubscriptionUrl);
}
