/**
 * Cloudinary Video Performance Utilities
 * 
 * Features:
 * - Extract public_id from Cloudinary URLs
 * - Generate HLS streaming URLs (primary) + MP4 fallback
 * - Generate poster images from video frames
 * - Preload next 1 item for smooth feed scrolling
 */

import { Image } from 'react-native';

/** =========================
 *  Cloudinary URL helpers
 *  ========================= */

/**
 * Extract Cloudinary public_id from a Cloudinary delivery URL.
 * Supports URLs with transformations, folders, and querystrings.
 */
export function cloudinaryPublicIdFromUrl(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl);
    const parts = url.pathname.split("/");

    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    const afterUpload = parts.slice(uploadIdx + 1).filter(Boolean);

    let i = 0;
    while (i < afterUpload.length) {
      const seg = afterUpload[i];
      if (/^v\d+$/.test(seg)) {
        i += 1;
        break;
      }
      if (seg.includes(",") || seg.includes(":") || seg.startsWith("c_") || seg.startsWith("w_") || seg.startsWith("q_") || seg.startsWith("f_") || seg.startsWith("sp_") || seg.startsWith("so_") || seg.startsWith("vc_") || seg.startsWith("h_") || seg.startsWith("br_") || seg.startsWith("fl_")) {
        i += 1;
        continue;
      }
      break;
    }

    const publicPathWithExt = afterUpload.slice(i).join("/");
    if (!publicPathWithExt) return null;

    const withoutExt = publicPathWithExt.replace(/\.(mp4|mov|m4v|webm|m3u8|jpg|png|jpeg)$/i, "");
    return decodeURIComponent(withoutExt);
  } catch {
    return null;
  }
}

/**
 * Extract the cloud name from a Cloudinary URL.
 */
function cloudNameFromUrl(cloudinaryUrl: string): string | null {
  try {
    const u = new URL(cloudinaryUrl);
    const baseParts = u.pathname.split("/").filter(Boolean);
    return baseParts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Build the base upload path for a Cloudinary URL.
 */
function cloudinaryBaseUrl(cloudinaryUrl: string): string | null {
  try {
    const u = new URL(cloudinaryUrl);
    const cloudName = cloudNameFromUrl(cloudinaryUrl);
    if (!cloudName) return null;
    return `${u.protocol}//${u.host}/${cloudName}/video/upload`;
  } catch {
    return null;
  }
}

/** =========================
 *  URL generators from public_id
 *  ========================= */

/**
 * Primary: HLS streaming URL for adaptive bitrate playback.
 * f_m3u8 → HLS manifest
 * vc_h264 → H.264 codec (universal)
 * q_auto → Cloudinary auto quality
 * w_1920,h_1080,c_limit → cap at 1080p, maintain aspect ratio
 */
export function hlsUrlFromPublicId(publicId: string, baseUrl: string): string {
  return `${baseUrl}/f_m3u8,q_auto,vc_h264,w_1920,h_1080,c_limit/${publicId}.m3u8`;
}

/**
 * Fallback: Optimized MP4 for devices that don't support HLS.
 * f_auto → best format for device
 * vc_h264 → H.264 codec
 * q_auto → auto quality
 * w_1280,h_720,c_limit → cap at 720p
 */
export function mp4UrlFromPublicId(publicId: string, baseUrl: string): string {
  return `${baseUrl}/f_auto,q_auto,vc_h264,w_1280,h_720,c_limit/${publicId}.mp4`;
}

/**
 * Poster image: frame at 1s, jpg, auto quality, 720w.
 */
export function posterUrlFromPublicId(publicId: string, baseUrl: string): string {
  return `${baseUrl}/so_1,f_jpg,q_auto,w_720/${publicId}.jpg`;
}

/** =========================
 *  Exercise demo videos (V3 founder review 6)
 *  ========================= */

/**
 * Exercise library demos are portrait (1080×1920 HEVC .mov at ~60 fps). The generic MP4 above caps at w_1280,h_720, which
 * for a portrait clip means 720 px TALL (404×720 at ~0.9 Mbps): that is why the demos looked soft next to the bundled
 * landing video. Demos get their own delivery instead: the long edge capped at 1280 in either orientation (720×1280 for the
 * library), H.264, q_auto:good, 30 fps, no audio track (demos play muted). ~2 MB for a 7 s clip, about 2.4 Mbps.
 */
export const EXERCISE_DEMO_TRANSFORM = 'vc_h264,q_auto:good,w_1280,h_1280,c_limit,fps_30,ac_none';

export function exerciseDemoVideoUrl(url?: string | null): string | null {
  if (!url) return null;
  const u = url.replace(/^http:\/\//, 'https://');
  if (!u.includes('cloudinary.com') || !u.includes('/video/')) return u;
  const publicId = cloudinaryPublicIdFromUrl(u);
  const baseUrl = cloudinaryBaseUrl(u);
  return publicId && baseUrl ? `${baseUrl}/${EXERCISE_DEMO_TRANSFORM}/${publicId}.mp4` : u;
}

/** A frame of the demo itself (1 s in), sharp enough for a full-width sheet header or the player's poster. */
export function exerciseDemoPosterUrl(url?: string | null, width = 1080): string | null {
  if (!url) return null;
  const u = url.replace(/^http:\/\//, 'https://');
  const publicId = cloudinaryPublicIdFromUrl(u);
  const baseUrl = cloudinaryBaseUrl(u);
  return publicId && baseUrl ? `${baseUrl}/so_1.0,f_jpg,q_auto:good,w_${Math.round(width)},c_limit/${publicId}.jpg` : null;
}

/**
 * Warm the CDN for demos the athlete is about to see (the session start): a request whose body is dropped once the headers
 * arrive makes Cloudinary derive the transformed file once, so the first tap on Watch demo is a cache hit instead of a 3–6 s transcode.
 * Also prefetches the poster frame. Best effort, deduplicated per app session, never blocks the UI.
 */
const warmed = new Set<string>();
export function warmExerciseDemos(urls: (string | null | undefined)[], max = 12): void {
  const todo = urls.filter((u): u is string => !!u && u.includes('cloudinary.com') && u.includes('/video/')).slice(0, max);
  for (const raw of todo) {
    const v = exerciseDemoVideoUrl(raw);
    if (!v || warmed.has(v)) continue;
    warmed.add(v);
    const poster = exerciseDemoPosterUrl(raw);
    if (poster) Image.prefetch(poster).catch(() => undefined);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => controller?.abort(), 15000);
    // a cold derivation ignores Range and sends the whole file: stop reading as soon as the headers arrive (the derived
    // file is already cached at that point); a warm one answers 206 with 2 bytes
    fetch(v, { headers: { Range: 'bytes=0-1' }, signal: controller?.signal as any })
      .then(() => controller?.abort())
      .catch(() => undefined)
      .finally(() => clearTimeout(t));
  }
}

/** =========================
 *  High-level helpers for components
 *  ========================= */

export type VideoUrls = {
  hls: string;
  mp4: string;
  poster: string;
};

/**
 * Given a raw Cloudinary video URL, generate optimized HLS, MP4, and poster URLs.
 * Returns null if the URL is not a Cloudinary video URL.
 */
export function getOptimizedVideoUrls(rawUrl: string): VideoUrls | null {
  if (!rawUrl.includes('cloudinary.com') || !rawUrl.includes('/video/')) {
    return null;
  }

  const publicId = cloudinaryPublicIdFromUrl(rawUrl);
  const baseUrl = cloudinaryBaseUrl(rawUrl);
  if (!publicId || !baseUrl) return null;

  return {
    hls: hlsUrlFromPublicId(publicId, baseUrl),
    mp4: mp4UrlFromPublicId(publicId, baseUrl),
    poster: posterUrlFromPublicId(publicId, baseUrl),
  };
}

/**
 * Normalize a Cloudinary video URL to an optimized MP4 (for expo-av source).
 * Used by SmartVideoPlayer as the playback source.
 */
export function normalizeCloudinaryVideoUrl(url?: string | null): string | null {
  if (!url) return null;

  let normalized = url;
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }

  if (!normalized.includes('cloudinary.com') || !normalized.includes('/video/')) {
    return normalized;
  }

  // an exercise demo already carries its own delivery transform (exerciseDemoVideoUrl): keep it
  if (normalized.includes(`/${EXERCISE_DEMO_TRANSFORM}/`)) return normalized;

  const publicId = cloudinaryPublicIdFromUrl(normalized);
  const baseUrl = cloudinaryBaseUrl(normalized);
  if (publicId && baseUrl) {
    return mp4UrlFromPublicId(publicId, baseUrl);
  }

  return normalized;
}

/**
 * Generate a poster/thumbnail URL from a video URL.
 */
export function cloudinaryThumbnailUrlFromVideoUrl(videoUrl: string): string {
  const publicId = cloudinaryPublicIdFromUrl(videoUrl);
  const baseUrl = cloudinaryBaseUrl(videoUrl);
  if (publicId && baseUrl) {
    return posterUrlFromPublicId(publicId, baseUrl);
  }
  return videoUrl;
}

/** =========================
 *  Feed preloading utilities
 *  ========================= */

// In-memory dedup: never preload the same public_id twice per session
const preloadedIds = new Set<string>();

export type PreloadableItem = {
  id: string;
  video_url: string;
  thumbnail_url?: string | null;
};

/**
 * Preload the NEXT 3 items in the feed for smooth playback.
 * - Prefetches poster image (most visible impact)
 * - Prefetches HLS manifest (small ~2KB file, warms CDN + prepares adaptive stream)
 * - Prefetches initial MP4 bytes for the immediate next item (fast playback start)
 * - Deduplicates by public_id per session
 */
export async function preloadNextItems(opts: {
  items: PreloadableItem[];
  startIndex: number;
  maxAhead?: number;
}): Promise<void> {
  const { items, startIndex, maxAhead = 3 } = opts;

  const end = Math.min(items.length - 1, startIndex + maxAhead);
  const slice = items.slice(startIndex + 1, end + 1);
  if (slice.length === 0) return;

  const tasks: Promise<void>[] = [];

  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    const optimized = getOptimizedVideoUrls(item.video_url);
    const publicId = cloudinaryPublicIdFromUrl(item.video_url);
    const dedupKey = publicId || item.id;

    if (preloadedIds.has(dedupKey)) continue;
    preloadedIds.add(dedupKey);

    // Prefetch poster image
    const posterUrl = item.thumbnail_url || optimized?.poster || cloudinaryThumbnailUrlFromVideoUrl(item.video_url);
    if (posterUrl) {
      tasks.push(Image.prefetch(posterUrl).catch(() => {}));
    }

    // Prefetch HLS manifest (small file, warms CDN)
    if (optimized?.hls) {
      tasks.push(prefetchManifest(optimized.hls));
    }

    // For the immediate next item, also prefetch first 150KB of MP4 for fast start
    if (i === 0 && optimized?.mp4) {
      tasks.push(prefetchInitialBytes(optimized.mp4));
    }
  }

  await Promise.allSettled(tasks);
}

/**
 * Batch prefetch poster thumbnails.
 */
export async function prefetchThumbnails(items: PreloadableItem[]): Promise<void> {
  const urls = items.map(it => it.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(it.video_url));
  await Promise.allSettled(urls.map(u => Image.prefetch(u)));
}

/**
 * Prefetch an HLS manifest (tiny ~2KB text file).
 * Warms the CDN edge and prepares the adaptive stream index.
 */
async function prefetchManifest(manifestUrl: string, timeoutMs = 4000): Promise<void> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(manifestUrl, { signal: controller.signal });
  } catch {
    // best-effort
  } finally {
    clearTimeout(t);
  }
}

/**
 * Prefetch the first 150KB of an MP4 file via Range request.
 * This fetches the moov atom + initial video frames, enabling near-instant playback start.
 */
async function prefetchInitialBytes(mp4Url: string, bytes = 153600, timeoutMs = 6000): Promise<void> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(mp4Url, {
      headers: { Range: `bytes=0-${bytes}` },
      signal: controller.signal,
    });
  } catch {
    // best-effort
  } finally {
    clearTimeout(t);
  }
}
