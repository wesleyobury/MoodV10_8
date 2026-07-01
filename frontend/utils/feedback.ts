/**
 * Shared feedback helper — opens the user's mail client to the MOOD support
 * inbox. Mirrors the "Submit Feedback" flow in app/settings.tsx so every
 * feedback entry point (Settings, the rating pre-prompt's "Not really", etc.)
 * routes to the same address with a consistent fallback.
 */
import { Alert, Linking } from 'react-native';

export const SUPPORT_EMAIL = 'wes@officialmoodapp.com';

export async function openFeedbackEmail(opts?: {
  subject?: string;
  body?: string;
}): Promise<void> {
  const subject = encodeURIComponent(opts?.subject ?? 'MOOD feedback');
  const body = encodeURIComponent(
    opts?.body ?? "Hi,\n\nI'd like to share the following feedback:\n\n",
  );
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  try {
    if (await Linking.canOpenURL(mailtoUrl)) {
      await Linking.openURL(mailtoUrl);
      return;
    }
  } catch {
    /* fall through to the manual-address alert */
  }
  Alert.alert('Submit Feedback', `Please email us at:\n${SUPPORT_EMAIL}`);
}
