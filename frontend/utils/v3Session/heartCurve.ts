/** Pure (tested): the Heart rate share overlay's curve. Rendered by components/v3/session/ShareCard.tsx. */

/**
 * The heart-rate curve (V2's shape, deterministic per session): warm-up rise, a working plateau with interval waves, a
 * cool-down tail. When avg / peak exist the points are scaled so the curve peaks at `peak` and averages about `avg`.
 */
export function heartRateCurve(avg: number | null, peak: number | null, seed = 'mood', count = 40): { points: number[]; real: boolean } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let st = h | 0;
  const rnd = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const p1 = rnd() * Math.PI * 2, p2 = rnd() * Math.PI * 2, p3 = rnd() * Math.PI * 2;
  // unit shape in 0..1
  const raw: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let v: number;
    if (t < 0.12) v = (t / 0.12) * (0.62 + rnd() * 0.15);
    else if (t > 0.9) v = 0.25 + ((1 - t) / 0.1) * 0.45;
    else v = 0.74 + Math.sin(t * Math.PI * 6 + p1) * 0.08 + Math.sin(t * Math.PI * 16 + p2) * 0.035 + Math.sin(t * Math.PI * 3.2 + p3) * 0.06 + (rnd() - 0.5) * 0.03;
    raw.push(Math.max(0, Math.min(1, v)));
  }
  const top = Math.max(...raw);
  const unit = raw.map((v) => v / top);
  const pk = peak ?? (avg != null ? Math.round(avg * 1.18) : null);
  if (pk == null) return { points: unit.map((v) => 70 + v * 90), real: false };
  const target = avg != null && avg < pk ? avg : Math.round(pk * 0.84);
  const meanOf = (g: number, b: number) => unit.reduce((a, v) => a + b + Math.pow(v, g) * (pk - b), 0) / unit.length;
  // base so that the mean lands on avg: base = (avg - peak * mean) / (1 - mean); a resting floor of 55 bpm, and when the
  // floor binds, a steeper shape (gamma) brings the mean down to avg instead
  const mean = unit.reduce((a, b) => a + b, 0) / unit.length;
  let base = Math.min(target - 1, (target - pk * mean) / (1 - mean));
  let gamma = 1;
  if (base < 55) {
    base = Math.min(55, target - 1);
    let lo = 1, hi = 12;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (meanOf(mid, base) > target) lo = mid; else hi = mid; }
    gamma = (lo + hi) / 2;
  }
  return { points: unit.map((v) => Math.round(base + Math.pow(v, gamma) * (pk - base))), real: true };
}

