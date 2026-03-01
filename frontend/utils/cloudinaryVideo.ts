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

export type PreloadableItem = {
  id: string;
  video_url: string;
  thumbnail_url?: string | null;
};

/**
 * Preload the NEXT 1 item in the feed for smooth playback.
 * - Prefetches poster image
 * - Warms the MP4 URL (DNS/TLS/CDN)
 */
export async function preloadNextItems(opts: {
  items: PreloadableItem[];
  startIndex: number;
  maxAhead?: number;
}): Promise<void> {
  const { items, startIndex, maxAhead = 1 } = opts;

  const end = Math.min(items.length - 1, startIndex + maxAhead);
  const slice = items.slice(startIndex + 1, end + 1);
  if (slice.length === 0) return;

  // Prefetch posters
  const posterUrls = slice.map((it) =>
    it.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(it.video_url)
  );
  await Promise.allSettled(posterUrls.map((u) => Image.prefetch(u)));

  // Warm MP4 URLs (light HEAD request for DNS/TLS)
  await Promise.allSettled(
    slice.map((it) => {
      const urls = getOptimizedVideoUrls(it.video_url);
      const mp4Url = urls?.mp4 || it.video_url;
      return warmUrl(mp4Url);
    })
  );
}

/**
 * Batch prefetch poster thumbnails.
 */
export async function prefetchThumbnails(items: PreloadableItem[]): Promise<void> {
  const urls = items.map(it => it.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(it.video_url));
  await Promise.allSettled(urls.map(u => Image.prefetch(u)));
}

/**
 * Warm a URL (DNS/TLS/CDN warm-up). Best-effort, non-blocking.
 */
async function warmUrl(url: string, timeoutMs = 4000): Promise<void> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
  } catch {
    // ignore; warming is best-effort
  } finally {
    clearTimeout(t);
  }
}
