/**
 * ProfileRadar — the six-axis picture of a training profile (utils/v3ProfileCopy RADAR_AXES / radarValues).
 * A picture of the answers, not a score. Pure render: pass the values to draw (the construction screen animates them).
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Polygon, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants/brand';

interface Props {
  values: number[];
  axes: string[];
  size?: number;
  labels?: boolean;
  /** highlight these axis indexes (label in gold) */
  active?: number[];
}

export function ProfileRadar({ values, axes, size = 240, labels = true, active = [] }: Props) {
  const c = size / 2;
  const R = size * (labels ? 0.29 : 0.42);
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const ring = (f: number) => axes.map((_, i) => pt(i, R * f).join(',')).join(' ');
  const poly = values.map((v, i) => pt(i, R * Math.max(0.04, Math.min(1, v))).join(',')).join(' ');
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="pr-fill" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity={0.4} />
            <Stop offset="1" stopColor={COLORS.accentTrail} stopOpacity={0.1} />
          </RadialGradient>
        </Defs>
        {[0.34, 0.67, 1].map((f) => (
          <Polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, R);
          return <Line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
        })}
        <Polygon points={poly} fill="url(#pr-fill)" stroke={COLORS.accent} strokeWidth={1.6} strokeLinejoin="round" />
        {values.map((v, i) => {
          const [x, y] = pt(i, R * Math.max(0.04, Math.min(1, v)));
          return <Circle key={i} cx={x} cy={y} r={2.8} fill="#FFE08A" />;
        })}
        {labels
          ? axes.map((ax, i) => {
              const [x, y] = pt(i, R + 15);
              return (
                <SvgText
                  key={ax}
                  x={x}
                  y={y + 3}
                  fill={active.includes(i) ? COLORS.accent : 'rgba(255,255,255,0.5)'}
                  fontSize={size < 220 ? 8.5 : 9.5}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {ax.toUpperCase()}
                </SvgText>
              );
            })
          : null}
      </Svg>
    </View>
  );
}
