/**
 * TimerRing: the big countdown. The number is recomputed from timestamps on every render (the parent re-renders ~4×/s);
 * the ring shows the fraction left. Purely presentational.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fmtClock } from '../../../utils/v3Session/compile';

interface Props {
  remainingMs: number;
  totalMs: number;
  color: string;
  size?: number;
  label?: string | null;
  sublabel?: string | null;
  dim?: boolean;
}

export function TimerRing({ remainingMs, totalMs, color, size = 248, label, sublabel, dim }: Props) {
  const stroke = Math.max(4, Math.round(size / 40)); // slim ring (founder review: sleeker timer)
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="timer" accessibilityLabel={`${fmtClock(remainingMs)} left`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeOpacity={dim ? 0.45 : 1}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? <Text style={[styles.label, size < 200 && { fontSize: 9.5, letterSpacing: 1.8, marginBottom: 2 }, { color }]}>{label}</Text> : null}
      <Text style={[styles.time, size < 200 && { fontSize: Math.round(size * 0.27), letterSpacing: -1 }, dim && { opacity: 0.55 }]}>{fmtClock(remainingMs)}</Text>
      {sublabel ? <Text style={styles.sub}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2.6, marginBottom: 4, opacity: 0.9 },
  time: { fontSize: 58, fontWeight: '500', color: '#FFFFFF', letterSpacing: -2.5, fontVariant: ['tabular-nums'] },
  sub: { fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600' },
});
