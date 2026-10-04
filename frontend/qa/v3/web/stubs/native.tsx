import { Image as RNWImage } from 'react-native';
// Web harness stubs for native-only Expo modules used by the V3 screens (QA only; never shipped).
// Every call is recorded on window.__native so browser QA can assert haptics / keep-awake / notification behavior.
import React from 'react';
const w: any = typeof window !== 'undefined' ? window : {};
w.__native = w.__native || { haptics: [], keepAwake: new Set<string>(), keepAwakeLog: [], scheduled: [], cancelled: [], permission: 'granted', permissionRequests: 0 };
const N = w.__native;
// expo-haptics
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
export const impactAsync = async (s: string) => { N.haptics.push(`impact:${s}`); };
export const notificationAsync = async (s: string) => { N.haptics.push(`notification:${s}`); };
export const selectionAsync = async () => { N.haptics.push('selection'); };
// expo-keep-awake
export const activateKeepAwakeAsync = async (tag = 'default') => { N.keepAwake.add(tag); N.keepAwakeLog.push(`on:${tag}`); };
export const deactivateKeepAwake = (tag = 'default') => { if (N.keepAwake.has(tag)) N.keepAwakeLog.push(`off:${tag}`); N.keepAwake.delete(tag); return Promise.resolve(); };
export const useKeepAwake = () => undefined;
// expo-notifications
let nid = 0;
export const SchedulableTriggerInputTypes = { DATE: 'date' };
export const IosAuthorizationStatus = { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 };
export const getPermissionsAsync = async () => ({ status: N.permission, granted: N.permission === 'granted', ios: { status: N.permission === 'granted' ? 2 : 1 } });
export const requestPermissionsAsync = async () => { N.permissionRequests++; return getPermissionsAsync(); };
export const scheduleNotificationAsync = async (req: any) => { const id = `n${++nid}`; N.scheduled.push({ id, ...req, at: req.trigger?.date?.getTime?.() }); return id; };
export const cancelScheduledNotificationAsync = async (id: string) => { N.cancelled.push(id); N.scheduled = N.scheduled.filter((x: any) => x.id !== id); };
export const getAllScheduledNotificationsAsync = async () => N.scheduled.map((x: any) => ({ identifier: x.id, content: x.content }));
export const setNotificationHandler = () => undefined;
// expo-constants / expo-localization
export default { expoConfig: { extra: {} }, manifest: {} } as any;
export const getLocales = () => [{ languageTag: 'en-US' }];
// expo-image / expo-av
// expo-image → react-native-web Image (keeps the caller's style / fit so layout checks are real)
export const Image: any = (p: any) => React.createElement(RNWImage, { source: typeof p.source === 'string' ? { uri: p.source } : p.source, style: p.style ?? { width: '100%', height: '100%' }, resizeMode: p.contentFit === 'contain' ? 'contain' : 'cover', onError: p.onError, testID: p.testID });
Image.prefetch = async (urls: any) => { (window as any).__prefetched = [...((window as any).__prefetched || []), ...(Array.isArray(urls) ? urls : [urls])]; return true; };
export const Video = () => null;
export const ResizeMode = { COVER: 'cover', CONTAIN: 'contain' };
export const Audio = { setAudioModeAsync: async () => undefined };
// expo-modules-core (mood-healthkit): no native module in the harness → every HealthKit read returns null
export const requireOptionalNativeModule = () => null;
// react-native-view-shot / expo-media-library / expo-sharing: recorded, never real
export const captureRef = async () => { N.captures = (N.captures || 0) + 1; return 'file:///tmp/card.png'; };
export const saveToLibraryAsync = async (uri: string) => { N.saved = [...(N.saved || []), uri]; };
export const isAvailableAsync = async () => true;
export const shareAsync = async (uri: string) => { N.shared = [...(N.shared || []), uri]; };
