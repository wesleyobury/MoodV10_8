/**
 * Cloudinary Video Performance Utilities
 * 
 * Features:
 * - Extract public_id from Cloudinary URLs
 * - Generate HLS streaming URLs capped at 720p
 * - Generate thumbnail/poster URLs from videos
 * - Preload next items in a feed for smooth playback
 */

import { Image } from 'react-native';

/** =========================
 *  Cloudinary URL helpers
 *  ========================= */

/**
 * Extract Cloudinary public_id from a Cloudinary delivery URL.
 * Supports URLs with transformations, folders, and querystrings.
 * 
 * Example:
 * https://res.cloudinary.com/<cloud>/video/upload/v123/folder/name.mp4
 * => "folder/name"
 */
export function cloudinaryPublicIdFromUrl(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl);
    const parts = url.pathname.split("/");

    // Find "/upload/" segment and take everything after it
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    // Everything after upload/ could include transformations + version + public_id.ext
    const afterUpload = parts.slice(uploadIdx + 1).filter(Boolean);

    // Walk from start and drop transformation-like segments until we hit v### or a segment that looks like a file path
    let i = 0;
    while (i < afterUpload.length) {
      const seg = afterUpload[i];
      if (/^v\d+$/.test(seg)) {
        i += 1;
        break;
      }
      // transformation segments often include commas and underscores like "c_fill,w_720,q_auto"
      if (seg.includes(",") || seg.includes(":") || seg.startsWith("c_") || seg.startsWith("w_") || seg.startsWith("q_") || seg.startsWith("f_") || seg.startsWith("sp_") || seg.startsWith("so_")) {
        i += 1;
        continue;
      }
      // If it doesn't look like a transformation, assume we're at public_id path
      break;
    }

    const publicPathWithExt = afterUpload.slice(i).join("/");
    if (!publicPathWithExt) return null;

    // Strip extension
    const withoutExt = publicPathWithExt.replace(/\.(mp4|mov|m4v|webm|m3u8|jpg|png|jpeg)$/i, "");
    return decodeURIComponent(withoutExt);
  } catch {
    return null;
  }
}

/**
 * Build a Cloudinary thumbnail (poster) URL from a video public_id.
 * 1s offset, width 720, fill crop, auto quality, jpg for speed.
 */
export function cloudinaryThumbnailUrlFromVideoUrl(videoUrl: string): string {
  const publicId = cloudinaryPublicIdFromUrl(videoUrl);
  if (!publicId) return videoUrl; // fallback (won't break)
  
  try {
    const u = new URL(videoUrl);
    const baseParts = u.pathname.split("/").filter(Boolean);
    const cloudName = baseParts[0];
    const base = `${u.protocol}//${u.host}/${cloudName}/video/upload`;
    return `${base}/so_1.0,w_720,c_fill,q_auto,f_jpg/${encodeURIComponent(publicId)}.jpg`;
  } catch {
    return videoUrl;
  }
}

/**
 * Build an HLS URL capped to 720p using a Cloudinary streaming profile.
 * Default profile: "hd" (Cloudinary's built-in HD ladder)
 * 
 * Note: For custom profiles like "mood_720", create in Cloudinary console.
 */
export function cloudinaryHlsUrlFromVideoUrl(videoUrl: string, profile = "hd"): string {
  const publicId = cloudinaryPublicIdFromUrl(videoUrl);
  if (!publicId) return videoUrl;
  
  try {
    const u = new URL(videoUrl);
    const baseParts = u.pathname.split("/").filter(Boolean);
    const cloudName = baseParts[0];
    const base = `${u.protocol}//${u.host}/${cloudName}/video/upload`;
    return `${base}/sp_${profile}/${encodeURIComponent(publicId)}.m3u8`;
  } catch {
    return videoUrl;
  }
}

/**
 * Get an optimized video URL with quality cap (720p) without HLS.
 * Useful for direct mp4 playback with size optimization.
 */
export function cloudinaryOptimizedVideoUrl(videoUrl: string): string {
  const publicId = cloudinaryPublicIdFromUrl(videoUrl);
  if (!publicId) return videoUrl;
  
  try {
    const u = new URL(videoUrl);
    const baseParts = u.pathname.split("/").filter(Boolean);
    const cloudName = baseParts[0];
    const base = `${u.protocol}//${u.host}/${cloudName}/video/upload`;
    // Cap at 720p width, auto quality, auto format
    return `${base}/w_720,q_auto/${encodeURIComponent(publicId)}.mp4`;
  } catch {
    return videoUrl;
  }
}

/**
 * Normalize a Cloudinary video URL for guaranteed iOS-compatible MP4 streaming.
 * This is CRITICAL for TestFlight/production iOS builds.
 * 
 * Features:
 * - Forces f_mp4 format (iOS Safari/AVPlayer requirement)
 * - Applies q_auto for quality optimization
 * - Ensures HTTPS
 * - Works with any Cloudinary video URL format
 * 
 * Usage:
 *   const videoUri = normalizeCloudinaryVideoUrl(post.video_url);
 *   <Video source={{ uri: videoUri }} />
 */
export function normalizeCloudinaryVideoUrl(url?: string | null): string | null {
  if (!url) return null;
  
  let normalized = url;
  
  // Ensure HTTPS
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }
  
  // Check if it's a Cloudinary URL
  if (!normalized.includes('cloudinary.com')) {
    console.log('VIDEO URL (non-Cloudinary):', normalized);
    return normalized;
  }
  
  // Check if it's a video URL
  if (!normalized.includes('/video/')) {
    console.log('VIDEO URL (not a video path):', normalized);
    return normalized;
  }
  
  // Check if already has transformations applied
  if (normalized.includes('/video/upload/f_mp4') || normalized.includes('/video/upload/q_auto,f_mp4')) {
    console.log('VIDEO URL (already optimized):', normalized);
    return normalized;
  }
  
  // Apply iOS-compatible MP4 transformation
  // Insert f_mp4,q_auto transformation after /upload/
  try {
    // Handle URLs with existing transformations
    if (normalized.includes('/video/upload/')) {
      // Check if there are already transformations (not just version)
      const uploadIndex = normalized.indexOf('/video/upload/');
      const afterUpload = normalized.substring(uploadIndex + '/video/upload/'.length);
      
      // If starts with transformation (contains comma or known param), prepend to existing
      if (afterUpload.match(/^[a-z]_[^\/]/) || afterUpload.includes(',')) {
        normalized = normalized.replace(
          '/video/upload/',
          '/video/upload/f_mp4,q_auto/'
        );
      } else {
        // Just a version number or public_id - insert transformation
        normalized = normalized.replace(
          '/video/upload/',
          '/video/upload/f_mp4,q_auto/'
        );
      }
    }
    
    console.log('VIDEO URL (normalized for iOS):', normalized);
    return normalized;
  } catch (error) {
    console.error('Error normalizing video URL:', error);
    return url;
  }
}

/** =========================
 *  Feed preloading utilities
 *  ========================= */

/**
 * Warm a URL by fetching it (DNS/TLS/CDN warm-up).
 * Best-effort, non-blocking.
 */
async function warmUrl(url: string, timeoutMs = 4000): Promise<void> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { 
      method: "GET", 
      signal: controller.signal, 
      headers: { "Cache-Control": "no-cache" } 
    });
  } catch {
    // ignore; warming is best-effort
  } finally {
    clearTimeout(t);
  }
}

export type PreloadableItem = {
  id: string;
  video_url: string;
  thumbnail_url?: string | null;
};

/**
 * Preload next items in a feed for smoother playback.
 * - Prefetches thumbnails via Image.prefetch
 * - Warms HLS manifests (light fetch, no heavy buffering)
 */
export async function preloadNextItems(opts: {
  items: PreloadableItem[];
  startIndex: number;
  maxAhead?: number; // default 3
  useHls?: boolean;
  hlsProfile?: string;
}): Promise<void> {
  const { 
    items, 
    startIndex, 
    maxAhead = 3, 
    useHls = false, 
    hlsProfile = "hd" 
  } = opts;

  const end = Math.min(items.length - 1, startIndex + maxAhead);
  const slice = items.slice(startIndex + 1, end + 1);

  if (slice.length === 0) return;

  // 1) Prefetch thumbnails (cheap & high ROI)
  const thumbUrls = slice.map((it) => 
    it.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(it.video_url)
  );
  await Promise.allSettled(thumbUrls.map((u) => Image.prefetch(u)));

  // 2) Warm video URLs
  if (useHls) {
    const hlsUrls = slice.map((it) => cloudinaryHlsUrlFromVideoUrl(it.video_url, hlsProfile));
    await Promise.allSettled(hlsUrls.map((u) => warmUrl(u)));
  } else {
    // Warm optimized mp4 URLs
    const videoUrls = slice.map((it) => cloudinaryOptimizedVideoUrl(it.video_url));
    await Promise.allSettled(videoUrls.map((u) => warmUrl(u)));
  }
}

/**
 * Prefetch a single thumbnail image.
 */
export async function prefetchThumbnail(videoUrl: string, existingThumbnail?: string | null): Promise<boolean> {
  const thumbnailUrl = existingThumbnail || cloudinaryThumbnailUrlFromVideoUrl(videoUrl);
  try {
    return await Image.prefetch(thumbnailUrl);
  } catch {
    return false;
  }
}

/**
 * Batch prefetch multiple thumbnails.
 */
export async function prefetchThumbnails(items: PreloadableItem[]): Promise<void> {
  const urls = items.map(it => it.thumbnail_url || cloudinaryThumbnailUrlFromVideoUrl(it.video_url));
  await Promise.allSettled(urls.map(u => Image.prefetch(u)));
}
