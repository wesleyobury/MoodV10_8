/**
 * Share a workout card: the V2 pipeline (create-post.tsx shareToInstagramStoriesDirect) extracted and made safe.
 *
 *   capture the card view (react-native-view-shot) → save to the photo library (expo-media-library) →
 *   open Instagram Stories (instagram://story-camera; the athlete picks the image from Recents as a sticker) →
 *   otherwise the system share sheet (expo-sharing)
 *
 * Every native piece is optional: a build without it returns a reason instead of throwing. Nothing here is required for
 * completing a workout.
 */
import { Linking } from 'react-native';

export type ShareOutcome =
  | { ok: true; via: 'instagram' | 'share_sheet'; uri: string }
  | { ok: false; reason: 'capture_unavailable' | 'capture_failed' | 'library_denied' | 'nothing_to_share' | 'share_failed'; message: string };

export async function captureCard(ref: any, transparent: boolean): Promise<string | null> {
  let captureRef: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    captureRef = require('react-native-view-shot').captureRef;
  } catch {
    return null;
  }
  if (!captureRef || !ref) return null;
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', ...(transparent ? { bgColor: '#00000000' } : {}) });
}

export async function shareCard(ref: any, opts: { transparent: boolean; preferInstagram: boolean }): Promise<ShareOutcome> {
  let uri: string | null = null;
  try {
    uri = await captureCard(ref, opts.transparent);
  } catch (e: any) {
    return { ok: false, reason: 'capture_failed', message: e?.message ?? 'Could not render the card.' };
  }
  if (!uri) return { ok: false, reason: 'capture_unavailable', message: 'Screen capture is not included in this build.' };
  if (opts.preferInstagram) {
    try {
      const MediaLibrary: any = await import('expo-media-library');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm?.granted || perm?.status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        if (await Linking.canOpenURL('instagram://story-camera')) {
          await Linking.openURL('instagram://story-camera');
          return { ok: true, via: 'instagram', uri };
        }
      }
    } catch { /* fall through to the share sheet */ }
  }
  try {
    const Sharing: any = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your workout' });
      return { ok: true, via: 'share_sheet', uri };
    }
    return { ok: false, reason: 'share_failed', message: 'Sharing is not available on this device.' };
  } catch (e: any) {
    return { ok: false, reason: 'share_failed', message: e?.message ?? 'Could not share the card.' };
  }
}
