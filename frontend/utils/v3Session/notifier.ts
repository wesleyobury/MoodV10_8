/**
 * The F3 timer-notice logic, independent of expo-notifications (notify.ts binds it to the real module; tests use a fake).
 * One notice at a time; only when permission is already granted; never requests permission.
 */
import type { TimerNotice } from './record';

export const V3_TIMER_NOTICE_TYPE = 'v3_session_timer';

export interface NoticeApi {
  /** Current permission, never prompting. */
  isAllowed(): Promise<boolean>;
  schedule(n: { title: string; body: string; at: number; data: Record<string, any> }): Promise<string>;
  cancel(id: string): Promise<void>;
  /** ids of every scheduled notification carrying our type (left over from a previous process) */
  listOurs(): Promise<string[]>;
}

export function createTimerNotifier(api: NoticeApi) {
  let scheduledId: string | null = null;
  const cancel = async () => {
    const id = scheduledId;
    scheduledId = null;
    try {
      if (id) await api.cancel(id);
      for (const other of await api.listOurs()) if (other !== id) await api.cancel(other);
    } catch { /* nothing scheduled */ }
  };
  const schedule = async (notice: TimerNotice | null, workoutId: string, now = Date.now()): Promise<boolean> => {
    await cancel();
    if (!notice || notice.at - now < 5000) return false;
    if (!(await api.isAllowed().catch(() => false))) return false;
    try {
      scheduledId = await api.schedule({ title: notice.title, body: notice.body, at: notice.at, data: { type: V3_TIMER_NOTICE_TYPE, workout_id: workoutId } });
      return true;
    } catch {
      scheduledId = null;
      return false;
    }
  };
  return { schedule, cancel, current: () => scheduledId };
}
