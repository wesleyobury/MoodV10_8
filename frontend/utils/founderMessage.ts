/**
 * Founder welcome message (Oct 2026, replaces the welcome DM now that DMs are gone).
 *
 * The video and caption come from the public app config (GET /api/config: welcome_video_enabled, welcome_video_url,
 * founder_message_text), so Wes can swap them from the admin without an app build. Whether this user has opened it is kept
 * on the phone, per user. Until they open it, the Profile tab shows a badge and the Profile card shows NEW.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';

export interface FounderMessage {
  videoUrl: string;
  text: string;
}

/** Used when the config has no founder_message_text (the old DM caption asked people to reply, which no longer works). */
export const DEFAULT_FOUNDER_TEXT =
  "Thanks for downloading MOOD, seriously. Here's the short version of why I built it and what to look for inside.";

let configPromise: Promise<FounderMessage | null> | null = null;

export function loadFounderMessage(): Promise<FounderMessage | null> {
  if (!configPromise) {
    configPromise = apiFetch<any>('/api/config', { timeoutMs: 8000 })
      .then((res) => {
        const c = res.ok ? res.data : null;
        const url = typeof c?.welcome_video_url === 'string' ? c.welcome_video_url.trim() : '';
        if (!c || c.welcome_video_enabled === false || !url) return null;
        const text = typeof c.founder_message_text === 'string' && c.founder_message_text.trim() ? c.founder_message_text.trim() : DEFAULT_FOUNDER_TEXT;
        return { videoUrl: url, text };
      })
      .catch(() => null)
      .then((m) => {
        if (!m) configPromise = null; // try again next time instead of caching a failure
        return m;
      });
  }
  return configPromise;
}

const key = (uid: string) => `founder_message_seen:${uid}`;
const listeners = new Set<() => void>();
const seenCache = new Map<string, boolean>();

async function readSeen(uid: string): Promise<boolean> {
  if (seenCache.has(uid)) return seenCache.get(uid)!;
  let v = false;
  try {
    v = (await AsyncStorage.getItem(key(uid))) === '1';
  } catch {
    v = false;
  }
  seenCache.set(uid, v);
  return v;
}

export async function markFounderMessageSeen(uid: string | null | undefined): Promise<void> {
  if (!uid) return;
  seenCache.set(uid, true);
  listeners.forEach((l) => l());
  try {
    await AsyncStorage.setItem(key(uid), '1');
  } catch {
    /* the badge just comes back next launch */
  }
}

/** { message, unseen }: message is null while loading or when no video is configured; unseen drives the badge / NEW. */
export function useFounderMessage(uid: string | null | undefined): { message: FounderMessage | null; unseen: boolean } {
  const [message, setMessage] = useState<FounderMessage | null>(null);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    let alive = true;
    loadFounderMessage().then((m) => alive && setMessage(m));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const refresh = () => readSeen(uid).then((v) => alive && setSeen(v));
    refresh();
    listeners.add(refresh);
    return () => {
      alive = false;
      listeners.delete(refresh);
    };
  }, [uid]);
  return { message, unseen: !!message && !!uid && !seen };
}
