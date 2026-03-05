/**
 * Media Prefetch Service — Phase 2 Video Performance
 *
 * Aggressively pre-fetches images and video assets for:
 * - Featured workout exercise images (home carousel → detail page)
 * - Cart item images (cart → workout guidance)
 * - Saved workout thumbnails
 *
 * Uses expo-image prefetch for images and fetch() for video manifests/segments.
 * All prefetches are fire-and-forget with session-level deduplication.
 */

import { Image } from 'react-native';
import {
  getOptimizedVideoUrls,
  cloudinaryThumbnailUrlFromVideoUrl,
} from './cloudinaryVideo';

// Session-level dedup — never prefetch the same URL twice
const prefetchedUrls = new Set<string>();

function dedupPrefetch(url: string, fn: () => Promise<void>): Promise<void> {
  if (!url || prefetchedUrls.has(url)) return Promise.resolve();
  prefetchedUrls.add(url);
  return fn().catch(() => {});
}

/**
 * Prefetch a single image URL via React Native Image.prefetch.
 */
function prefetchImage(url: string): Promise<void> {
  return dedupPrefetch(url, () =>
    Image.prefetch(url).then(() => {})
  );
}

/**
 * Prefetch a network resource (manifest, segment) with a timeout.
 */
function prefetchResource(url: string, timeoutMs = 5000): Promise<void> {
  return dedupPrefetch(url, () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal })
      .then(() => {})
      .finally(() => clearTimeout(t));
  });
}

// ──────────────────────────────────────────────
//  Featured Workout Prefetching
// ──────────────────────────────────────────────

interface FeaturedExercise {
  imageUrl?: string;
  name?: string;
}

interface FeaturedWorkoutLike {
  heroImageUrl?: string;
  exercises: FeaturedExercise[];
}

/**
 * Prefetch all exercise images and hero images for a set of featured workouts.
 * Call this after featured workouts are fetched/cached so the detail page loads instantly.
 */
export function prefetchFeaturedWorkoutImages(
  workouts: FeaturedWorkoutLike[]
): void {
  if (!workouts || workouts.length === 0) return;

  const urls: string[] = [];

  for (const w of workouts) {
    if (w.heroImageUrl) urls.push(w.heroImageUrl);
    for (const ex of w.exercises) {
      if (ex.imageUrl) urls.push(ex.imageUrl);
    }
  }

  // Fire all prefetches in parallel, best-effort
  Promise.allSettled(urls.map(prefetchImage));
}

// ──────────────────────────────────────────────
//  Cart / Workout Session Prefetching
// ──────────────────────────────────────────────

interface CartItemLike {
  imageUrl?: string;
}

/**
 * Prefetch images for items currently in the cart.
 * Call when cart contents change so workout guidance screens load instantly.
 */
export function prefetchCartImages(items: CartItemLike[]): void {
  if (!items || items.length === 0) return;

  const urls = items
    .map((i) => i.imageUrl)
    .filter(Boolean) as string[];

  Promise.allSettled(urls.map(prefetchImage));
}

// ──────────────────────────────────────────────
//  Video Content Prefetching (Explore Feed)
// ──────────────────────────────────────────────

/**
 * Prefetch the initial segment of a video for faster playback start.
 * For HLS: fetches the manifest (~2KB) which warms the CDN.
 * For MP4: fetches the first 150KB (moov atom + initial frames) via Range header.
 */
export function prefetchVideoStart(videoUrl: string): void {
  const optimized = getOptimizedVideoUrls(videoUrl);

  // Prefetch poster thumbnail
  const poster =
    optimized?.poster || cloudinaryThumbnailUrlFromVideoUrl(videoUrl);
  if (poster) prefetchImage(poster);

  // Prefetch HLS manifest (tiny, warms CDN)
  if (optimized?.hls) {
    prefetchResource(optimized.hls, 4000);
  }

  // Prefetch first 150KB of MP4 (moov atom + initial frames)
  const mp4Url = optimized?.mp4;
  if (mp4Url) {
    dedupPrefetch(`range:${mp4Url}`, () => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 6000);
      return fetch(mp4Url, {
        headers: { Range: 'bytes=0-153600' },
        signal: controller.signal,
      })
        .then(() => {})
        .finally(() => clearTimeout(t));
    });
  }
}

/**
 * Batch prefetch video starts for multiple posts.
 * Pass the upcoming video URLs from the feed.
 */
export function prefetchUpcomingVideos(
  videoUrls: string[],
  maxItems = 3
): void {
  const batch = videoUrls.slice(0, maxItems);
  for (const url of batch) {
    prefetchVideoStart(url);
  }
}

/**
 * Get count of prefetched URLs (for debugging/monitoring).
 */
export function getPrefetchStats(): { totalPrefetched: number } {
  return { totalPrefetched: prefetchedUrls.size };
}
