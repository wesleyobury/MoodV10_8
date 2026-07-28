/**
 * Cloudinary delivery optimization (Phase 2 reliability work).
 *
 * Post/workout images were delivered at ORIGINAL size — multi-MB downloads
 * for a card slot a few hundred points wide, which is most of the lag when
 * swiping cards on a weak connection. Cloudinary resizes on the fly via URL
 * transforms, so inserting `f_auto,q_auto,w_<px>,c_limit` gets each device a
 * right-sized, modern-format (WebP/AVIF) file — typically 5–10x smaller.
 *
 * Safe by construction: non-Cloudinary URLs and already-transformed URLs are
 * returned untouched.
 */

export function optimizedImageUrl(
  url: string | null | undefined,
  width: number = 800
): string | undefined {
  if (!url) return undefined;
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  const prefix = url.slice(0, idx);
  const rest = url.slice(idx + marker.length);

  // Already has a transform segment (e.g. w_400, q_auto, f_auto, c_fill…)
  // before the version/public_id → leave it alone.
  const firstSegment = rest.split('/')[0] || '';
  if (/(^|,)(w_\d+|q_auto|f_auto|c_[a-z]+)/.test(firstSegment)) {
    return url;
  }

  const w = Math.max(1, Math.round(width));
  return `${prefix}${marker}f_auto,q_auto,w_${w},c_limit/${rest}`;
}

/** Same idea for Cloudinary video poster/thumbnail jpgs. */
export function optimizedThumbnailUrl(
  url: string | null | undefined,
  width: number = 600
): string | undefined {
  return optimizedImageUrl(url, width);
}
