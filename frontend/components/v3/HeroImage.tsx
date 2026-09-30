/**
 * HeroImage: full-bleed V3 hero photograph with the house motion.
 *
 *   • a slow scale drift (1.00 -> 1.06 over ~18 s and back), native driver, never distracting
 *   • a crossfade when the image changes (e.g. the Home hero's Direction changes after a new build)
 *   • a bottom scrim so type and chips stay legible on any photo
 *
 * Purely visual: callers decide which image (utils/cartHero.ts) and what sits on top.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';

interface Props {
  source: ImageSourcePropType;
  /** Stable identity of the image; a new key crossfades. */
  imageKey: string;
  style?: ViewStyle;
  /** Scrim strength at the bottom (0..1). */
  scrim?: number;
  drift?: boolean;
  testID?: string;
}

export function HeroImage({ source, imageKey, style, scrim = 1, drift = true, testID }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [layers, setLayers] = useState<{ key: string; source: ImageSourcePropType }[]>([{ key: imageKey, source }]);

  useEffect(() => {
    if (!drift) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 18000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, scale]);

  useEffect(() => {
    if (layers[layers.length - 1]?.key === imageKey) return;
    setLayers((l) => [...l.slice(-1), { key: imageKey, source }]);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setLayers((l) => l.slice(-1));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);

  const imgStyle = [StyleSheet.absoluteFillObject, styles.fill] as any;

  return (
    <View style={[styles.root, style]} pointerEvents="none" testID={testID}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale }] }]}>
        {layers.map((l, i) => {
          const isNew = i === layers.length - 1 && layers.length > 1;
          return (
            <Animated.Image
              key={l.key}
              source={l.source}
              resizeMode="cover"
              style={[imgStyle, isNew ? { opacity: fade } : null]}
            />
          );
        })}
      </Animated.View>
      {/* Top: a light veil for the status bar. Bottom: the scrim that carries text and controls. */}
      <LinearGradient
        colors={['rgba(10,10,10,0.55)', 'rgba(10,10,10,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topVeil as any}
      />
      <LinearGradient
        colors={['rgba(10,10,10,0)', `rgba(10,10,10,${0.72 * scrim})`, COLORS.bg]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.scrim as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#0d0d0d' },
  fill: { width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
});
