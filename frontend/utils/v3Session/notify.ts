/**
 * MOOD V3 Guided Session: the single background timer notice (F3), bound to expo-notifications.
 *
 * When the app goes to the background during a running timer, the player schedules ONE local notification for the next moment
 * the athlete is needed (record.ts timerNotice: rest over, time to move, block complete); never a queue of interval alerts.
 * Only if notification permission is ALREADY granted (granted / iOS provisional): nothing here requests permission.
 * Cancelled when the app returns to the foreground and on pause / end / completion / leaving the player; a skip or +time
 * while backgrounded is impossible, and on return the player re-evaluates from SessionState, the only source of truth.
 */
import * as Notifications from 'expo-notifications';
import { V3_TIMER_NOTICE_TYPE, createTimerNotifier } from './notifier';

export { V3_TIMER_NOTICE_TYPE };

export const timerNotifier = createTimerNotifier({
  async isAllowed() {
    const p: any = await Notifications.getPermissionsAsync();
    if (p?.granted || p?.status === 'granted') return true;
    const ios = p?.ios?.status;
    return ios === Notifications.IosAuthorizationStatus.PROVISIONAL || ios === Notifications.IosAuthorizationStatus.EPHEMERAL;
  },
  async schedule({ title, body, at, data }) {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  },
  async cancel(id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  },
  async listOurs() {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.filter((n) => (n.content?.data as any)?.type === V3_TIMER_NOTICE_TYPE).map((n) => n.identifier);
  },
});
