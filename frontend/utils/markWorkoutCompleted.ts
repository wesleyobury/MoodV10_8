import { API_URL } from './apiConfig';

/**
 * Stamp a workout snapshot as COMPLETED.
 *
 * Snapshots get created either at session start (cart.tsx, so the Live tab can
 * hydrate "Try this workout") or at completion. The multi-workout completion
 * path reuses the session-start snapshot instead of making a duplicate, so the
 * creation site cannot tell whether the workout was actually finished. This is
 * the signal that it was.
 *
 * Strictly fire-and-forget: completion must never fail because this call did.
 * Callers should not await it in a way that can block the completion UI.
 */
export async function markWorkoutSnapshotCompleted(
  snapshotId: string | null | undefined,
  token: string | null | undefined
): Promise<void> {
  if (!snapshotId || !token) return;

  try {
    const response = await fetch(
      `${API_URL}/api/workout-snapshots/${snapshotId}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(
        'markWorkoutSnapshotCompleted: non-OK response',
        response.status
      );
    }
  } catch (error) {
    // Best-effort only. If this fails the workout still counts everywhere that
    // matters; it just will not appear in the create-post attach list.
    console.warn('markWorkoutSnapshotCompleted failed:', error);
  }
}
