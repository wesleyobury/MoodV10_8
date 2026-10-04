/**
 * Gold confetti for the workout-complete moment (founder pass 3, Oct 2026: slower, heavier, more premium).
 *
 *   burst   ~54 slim pieces in the brand golds, champagne and warm white, fanned out of the medal. Low gravity and real air
 *           drag so they hang at the top of the arc, then float down with a slow sway and a paper tumble (~3.5-4.5s).
 *   dust    ~26 small, dimmer flecks drifting down from above the screen for a few seconds after the burst, so the moment
 *           lingers instead of popping and vanishing.
 *
 * Physics is sampled up front into interpolation keyframes, so every frame runs on the native driver (no JS per frame,
 * no library). Renders nothing when the OS asks for reduced motion.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

const PALETTE = ['#FFD700', '#F4C316', '#FFA500', '#F3E3B5', '#C9A24A', '#FFF6DA'];
const STEPS = 16;
const INPUT = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

type Piece = {
  ox: number; oy: number; w: number; h: number; radius: number; color: string; peak: number;
  delay: number; dur: number; xs: number[]; ys: number[]; rot: string[]; flip: number[];
};

function shape(i: number, small = false) {
  const kind = Math.random();
  const sliver = kind < 0.6, dot = kind > 0.86;
  const k = small ? 0.75 : 1;
  const w = (dot ? 4 + Math.random() * 1.5 : sliver ? 3 + Math.random() * 1.3 : 5.5 + Math.random() * 1.5) * k;
  const h = dot ? w : sliver ? (10 + Math.random() * 6) * k : w;
  return { w, h, dot, radius: dot ? w / 2 : 1, color: PALETTE[i % PALETTE.length] };
}

function burst(origin: { x: number; y: number }, width: number): Piece[] {
  const G = 640, K = 1.5;
  const out: Piece[] = [];
  for (let i = 0; i < 54; i++) {
    const s = shape(i);
    const angle = (-90 + (Math.random() * 200 - 100)) * (Math.PI / 180);
    const speed = 300 + Math.random() * 360;
    const vx = Math.cos(angle) * speed * 0.8 * (width / 390);
    const vy = Math.sin(angle) * speed;
    const dur = 3.5 + Math.random() * 1.0;
    const swayAmp = 8 + Math.random() * 16, swayF = 1.6 + Math.random() * 1.8, phase = Math.random() * Math.PI * 2;
    const spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 280);
    const tumble = 2 + Math.random() * 2.5;
    const xs: number[] = [], ys: number[] = [], rot: string[] = [], flip: number[] = [];
    for (const f of INPUT) {
      const t = f * dur;
      const e = (1 - Math.exp(-K * t)) / K;
      xs.push(vx * e + Math.sin(t * swayF + phase) * swayAmp * Math.min(1, t));
      ys.push(vy * e + (G / K) * (t - e) * 0.55);
      rot.push(`${(spin * t).toFixed(1)}deg`);
      flip.push(s.dot ? 1 : Math.max(0.12, Math.abs(Math.cos(t * tumble + phase))));
    }
    out.push({ ox: origin.x, oy: origin.y, w: s.w, h: s.h, radius: s.radius, color: s.color, peak: 1, delay: Math.random() * 120, dur, xs, ys, rot, flip });
  }
  return out;
}

function dust(width: number, height: number): Piece[] {
  const out: Piece[] = [];
  for (let i = 0; i < 26; i++) {
    const s = shape(i + 3, true);
    const dur = 5 + Math.random() * 2.5;
    const fall = (height * 0.75 + Math.random() * height * 0.35) / dur;
    const swayAmp = 14 + Math.random() * 26, swayF = 0.8 + Math.random() * 1.0, phase = Math.random() * Math.PI * 2;
    const spin = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 140);
    const xs: number[] = [], ys: number[] = [], rot: string[] = [], flip: number[] = [];
    for (const f of INPUT) {
      const t = f * dur;
      xs.push(Math.sin(t * swayF + phase) * swayAmp);
      ys.push(fall * t);
      rot.push(`${(spin * t).toFixed(1)}deg`);
      flip.push(s.dot ? 1 : Math.max(0.15, Math.abs(Math.cos(t * 1.6 + phase))));
    }
    out.push({ ox: Math.random() * width, oy: -24, w: s.w, h: s.h, radius: s.radius, color: s.color, peak: 0.7, delay: 500 + Math.random() * 2200, dur, xs, ys, rot, flip });
  }
  return out;
}

export function Confetti({ origin, fire }: { origin: { x: number; y: number } | null; fire: boolean }) {
  const { width, height } = useWindowDimensions();
  const [reduce, setReduce] = useState<boolean | null>(null);
  const pieces = useMemo(() => (origin ? [...burst(origin, width), ...dust(width, height)] : []), [origin, width, height]);
  const values = useMemo(() => pieces.map(() => new Animated.Value(0)), [pieces]);
  const fired = useRef(false);

  useEffect(() => {
    let alive = true;
    const p = AccessibilityInfo.isReduceMotionEnabled?.();
    if (p && typeof p.then === 'function') p.then((r) => alive && setReduce(!!r)).catch(() => alive && setReduce(false));
    else setReduce(false);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!fire || !pieces.length || reduce !== false || fired.current) return;
    fired.current = true;
    Animated.parallel(values.map((v, i) => Animated.timing(v, {
      toValue: 1, duration: pieces[i].dur * 1000, delay: pieces[i].delay, easing: Easing.linear, useNativeDriver: true,
    }))).start();
  }, [fire, reduce, values, pieces]);

  if (!pieces.length || reduce !== false) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="v3-complete-confetti">
      {pieces.map((pc, i) => {
        const v = values[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: pc.ox - pc.w / 2, top: pc.oy - pc.h / 2,
              width: pc.w, height: pc.h, borderRadius: pc.radius, backgroundColor: pc.color,
              opacity: v.interpolate({ inputRange: [0, 0.03, 0.72, 1], outputRange: [0, pc.peak, pc.peak * 0.85, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: INPUT, outputRange: pc.xs }) },
                { translateY: v.interpolate({ inputRange: INPUT, outputRange: pc.ys }) },
                { rotate: v.interpolate({ inputRange: INPUT, outputRange: pc.rot }) },
                { scaleY: v.interpolate({ inputRange: INPUT, outputRange: pc.flip }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
