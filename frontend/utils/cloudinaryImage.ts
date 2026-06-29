/**
 * Cloudinary image URL optimization.
 *
 * Featured/hero images are often delivered at full resolution (large PNGs),
 * then downscaled into small cards — wasting bandwidth and decode time. When
 * the source is a Cloudinary delivery URL we can ask Cloudinary to resize and
 * recompress on the fly:
 *   f_auto  → best format for the device (e.g. WebP/AVIF)
 *   q_auto  → automatic quality
 *   c_limit → never upscale; only shrink to fit the target width
 *   w_<n>   → cap the delivered pixel width
 *
 * Non-Cloudinary URLs (e.g. emergentagent customer-assets) are returned
 * unchanged, so callers can use this safely on any image source.
 */

/** Target pixel width for the featured-workout carousel card image.
 *  Sized for large phones at ~2.5x density; c_limit prevents upscaling. */
export const FEATURED_CARD_IMAGE_WIDTH = 1080;

export function optimizedImageUrl(
  url: string | undefined | null,
  width: number = FEATURED_CARD_IMAGE_WIDTH,
): string {
  if (!url) return '';

  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // not a Cloudinary delivery URL — leave as-is

  const head = url.slice(0, idx + marker.length);
  const tail = url.slice(idx + marker.length);

  // If a transformation segment is already present (comma-separated params
  // right after /upload/), don't risk conflicting with it.
  const firstSegment = tail.split('/')[0];
  if (firstSegment.includes(',')) return url;

  const transform = `f_auto,q_auto,c_limit,w_${Math.round(width)}`;
  return `${head}${transform}/${tail}`;
}
