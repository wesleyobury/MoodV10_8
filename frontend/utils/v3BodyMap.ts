/**
 * Soreness body map model (founder pass 3). Pure: no React, so the hit testing and region mapping are unit-tested.
 *
 * Regions are sent to the generator exactly as tapped. The API's soreness vocabulary already accepts muscle ids next to the
 * broad regions (mood_v3 normalize: SORE_REGIONS + MUSCLES), and every engine works on the muscle set, so Biceps, Triceps,
 * Quads, Hamstrings, Glutes and Calves reach programming as themselves (no silent broadening). Chest, Shoulders, Core,
 * Upper Back and Lower Back are the existing regions.
 *
 * Figures: assets/images/body/{female,male}-{front,back}.jpg, full body (head to feet), 640 x 1254, same crop for all four.
 * Coordinates are % of the image (x 0..100 left to right as displayed, y 0..100 top to bottom).
 */
import type { V3SoreRegion } from './v3Api';

export type BodyFigure = 'female' | 'male';
export type BodySide = 'front' | 'back';
/** An ellipse on the figure: the glow is drawn from it, the (larger, invisible) tap target is derived from it. */
export type BodySpot = { region: V3SoreRegion; cx: number; cy: number; rx: number; ry: number; rot?: number };

export const BODY_IMAGE_ASPECT = 640 / 1254;

/** The eleven areas the user can tap, in head-to-toe order (also the order used in summaries). */
export const BODY_MAP_REGIONS: { id: V3SoreRegion; label: string }[] = [
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'chest', label: 'Chest' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'upper_back', label: 'Upper Back' },
  { id: 'core', label: 'Core' },
  { id: 'lower_back', label: 'Lower Back' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
];

/** Older broad regions (earlier builds / API): the exact muscle sets normalize.SORE_REGIONS gives them. */
export const LEGACY_REGION_EXPANSION: Partial<Record<V3SoreRegion, V3SoreRegion[]>> = {
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  lower_body: ['quads', 'hamstrings', 'glutes', 'calves'],
  arms: ['biceps', 'triceps'],
  back: ['upper_back', 'lower_back'],
};

const ORDER = new Map(BODY_MAP_REGIONS.map((r, i) => [r.id, i]));

/** Map a stored selection onto the map's regions (legacy broad regions expand to what they already meant). Deduped, ordered. */
export function toMapRegions(regions: readonly V3SoreRegion[]): V3SoreRegion[] {
  const out = new Set<V3SoreRegion>();
  for (const r of regions) (LEGACY_REGION_EXPANSION[r] ?? [r]).forEach((x) => ORDER.has(x) && out.add(x));
  return [...out].sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
}

export function toggleRegion(sel: readonly V3SoreRegion[], r: V3SoreRegion): V3SoreRegion[] {
  return sel.includes(r) ? sel.filter((x) => x !== r) : toMapRegions([...sel, r]);
}

const L = (region: V3SoreRegion, cx: number, cy: number, rx: number, ry: number, rot = 0): BodySpot => ({ region, cx, cy, rx, ry, rot });

export const BODY_SPOTS: Record<BodyFigure, Record<BodySide, BodySpot[]>> = {
  female: {
    front: [
      L('shoulders', 32, 22.6, 4.4, 3.6), L('shoulders', 68, 22.6, 4.4, 3.6),
      L('chest', 43.5, 26, 6, 3.4), L('chest', 56.5, 26, 6, 3.4),
      L('biceps', 29.2, 30, 2.8, 5, 8), L('biceps', 70.8, 30, 2.8, 5, -8),
      L('core', 50, 35.8, 6.6, 5.4),
      L('quads', 39.5, 58.5, 5.6, 8.4, -4), L('quads', 60.5, 58.5, 5.6, 8.4, 4),
      L('calves', 36.8, 78, 3.2, 6.2), L('calves', 63.2, 78, 3.2, 6.2),
    ],
    back: [
      L('shoulders', 30, 25.6, 4.4, 3.8), L('shoulders', 68.5, 25.6, 4.4, 3.8),
      L('upper_back', 49.5, 28.8, 10.5, 6),
      L('triceps', 28.2, 33, 2.8, 5, 6), L('triceps', 70.6, 33, 2.8, 5, -6),
      L('lower_back', 49.5, 39.3, 5.8, 3.4),
      L('glutes', 42.4, 50.2, 6.8, 5.6), L('glutes', 57, 50.2, 6.8, 5.6),
      L('hamstrings', 39.6, 64.2, 5.2, 6.6), L('hamstrings', 59.4, 64.2, 5.2, 6.6),
      L('calves', 37.6, 78, 4.2, 6), L('calves', 61.2, 78, 4.2, 6),
    ],
  },
  male: {
    front: [
      L('shoulders', 24, 22, 5.4, 4.8), L('shoulders', 76, 22, 5.4, 4.8),
      L('chest', 39.5, 22.8, 8, 4.4), L('chest', 60, 22.8, 8, 4.4),
      L('biceps', 20, 30, 3.8, 5.4, 12), L('biceps', 80, 30, 3.8, 5.4, -12),
      L('core', 49.5, 31.8, 8.6, 6.4),
      L('quads', 36, 61, 6.8, 8.4, -3), L('quads', 63, 61, 6.8, 8.4, 3),
      L('calves', 31.8, 78, 4.4, 7), L('calves', 68, 78, 4.4, 7),
    ],
    back: [
      L('shoulders', 23.5, 22, 5.4, 4.8), L('shoulders', 74.5, 22, 5.4, 4.8),
      L('upper_back', 49.5, 24.5, 15.5, 8),
      L('triceps', 17, 31, 4.2, 6, 14), L('triceps', 81.5, 31, 4.2, 6, -14),
      L('lower_back', 49.5, 36.6, 7.6, 3.4),
      L('glutes', 41, 47, 7.6, 5.8), L('glutes', 58, 47, 7.6, 5.8),
      L('hamstrings', 35.4, 62, 6.6, 6.8), L('hamstrings', 64.6, 62, 6.6, 6.8),
      L('calves', 33, 75.5, 5.6, 7), L('calves', 67, 75.5, 5.6, 7),
    ],
  },
};

/** Invisible tap targets are this much larger than the drawn glow, so a tap near the muscle still counts. */
export const HIT_SCALE = 1.45;

/** Normalized ellipse distance (<= 1 is inside). The y axis is scaled to the image aspect so circles stay circles. */
function dist(sp: BodySpot, x: number, y: number, scale: number): number {
  const t = ((sp.rot ?? 0) * Math.PI) / 180;
  const dx = x - sp.cx;
  const dy = (y - sp.cy) / BODY_IMAGE_ASPECT; // % of height -> same units as % of width
  const ux = dx * Math.cos(t) + dy * Math.sin(t);
  const uy = -dx * Math.sin(t) + dy * Math.cos(t);
  const rx = sp.rx * scale;
  const ry = (sp.ry * scale) / BODY_IMAGE_ASPECT;
  return (ux * ux) / (rx * rx) + (uy * uy) / (ry * ry);
}

/** The region under a tap at (x%, y%), or null. Overlaps resolve to the spot the tap is most inside of. */
export function hitRegion(figure: BodyFigure, side: BodySide, x: number, y: number): V3SoreRegion | null {
  let best: { r: V3SoreRegion; d: number } | null = null;
  for (const sp of BODY_SPOTS[figure][side]) {
    const d = dist(sp, x, y, HIT_SCALE);
    if (d <= 1 && (!best || d < best.d)) best = { r: sp.region, d };
  }
  return best?.r ?? null;
}

/** Which views show a region (so the Front / Back switch can say where the other selections are). */
export function sidesFor(figure: BodyFigure, region: V3SoreRegion): BodySide[] {
  return (['front', 'back'] as BodySide[]).filter((s) => BODY_SPOTS[figure][s].some((sp) => sp.region === region));
}

/** How many selected regions are only visible on the other view. */
export function hiddenOn(figure: BodyFigure, side: BodySide, sel: readonly V3SoreRegion[]): number {
  return sel.filter((r) => !sidesFor(figure, r).includes(side)).length;
}

export function regionLabel(r: V3SoreRegion): string {
  return BODY_MAP_REGIONS.find((x) => x.id === r)?.label ?? LEGACY_LABEL[r] ?? r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const LEGACY_LABEL: Partial<Record<V3SoreRegion, string>> = { legs: 'Legs', lower_body: 'Legs', arms: 'Arms', back: 'Back' };
