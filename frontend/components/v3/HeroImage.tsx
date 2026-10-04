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
import { Animated, Easing, ImageSourcePropType, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS, HERO_FADE_ALPHAS, HERO_FADE_COLORS, HERO_FADE_LOCATIONS, bgA } from '../../constants/brand';

interface Props {
  source: ImageSourcePropType;
  /** Stable identity of the image; a new key crossfades. */
  imageKey: string;
  style?: ViewStyle;
  /** Scrim strength at the bottom (0..1). */
  scrim?: number;
  drift?: boolean;
  testID?: string;
  /**
   * Width / height of the photo when it is a portrait (the 4:5 payoff images). The photo is then laid out at the box's full
   * width and anchored to the TOP, so heads are never cropped; only the bottom (under the scrim) can go. Without it the
   * photo covers the box centred (right for 16:9 landscape heroes, which keep their full height).
   */
  portraitAspect?: number | null;
  /** the top edge fades from the page black (a hero that starts under the status bar, not behind it) */
  fadeTop?: boolean;
  /**
   * Portrait only (founder review 6k, Cart = Guided): the box starts at the very top of the screen and the photo grows
   * upward by this many points (the status-bar height) while its bottom stays where it was; to keep the aspect it is scaled
   * up a touch and centred, so a sliver of each side is cropped. No fade to black is needed at the top.
   */
  extendTop?: number;
}

export function HeroImage({ source, imageKey, style, scrim = 1, drift = true, testID, portraitAspect, fadeTop, extendTop = 0 }: Props) {
  // the hero always spans the screen width: size the portrait from the window (no onLayout pass, so the image is laid out
  // once at its final size instead of being re-decoded after a first layout)
  const { width: winW } = useWindowDimensions();
  const boxW = winW;
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

  const portraitH = portraitAspect && boxW ? Math.round(boxW / portraitAspect) + extendTop : 0;
  const portraitW = portraitAspect ? Math.round(portraitH * portraitAspect) : 0;
  const imgStyle = (portraitAspect && boxW
    ? [{ position: 'absolute', left: Math.round((boxW - portraitW) / 2), top: 0, width: portraitW, height: portraitH }]
    : [StyleSheet.absoluteFillObject, styles.fill]) as any;

  return (
    <View style={[styles.root, style]} pointerEvents="none" testID={testID}>
      {/* portrait: the drift grows from the top edge so the top of the photo stays in frame */}
      <Animated.View style={[StyleSheet.absoluteFillObject, portraitAspect ? { transformOrigin: 'top' } as any : null, { transform: [{ scale }] }]}>
        {layers.map((l, i) => {
          const isNew = i === layers.length - 1 && layers.length > 1;
          // expo-image: memory + disk cache (Home prefetches every Cart hero), decoded off the main thread
          return (
            <Animated.View key={l.key} style={[StyleSheet.absoluteFillObject, isNew ? { opacity: fade } : null]}>
              <CachedImage source={l.source as any} contentFit="cover" contentPosition={portraitAspect ? 'top' : 'center'} cachePolicy="memory-disk" priority="high" style={imgStyle} />
            </Animated.View>
          );
        })}
      </Animated.View>
      {/* Top: a light veil for the status bar. Bottom: the scrim that carries text and controls. */}
      <LinearGradient
        colors={fadeTop ? [COLORS.bg, bgA(0.82), bgA(0.35), bgA(0)] : extendTop ? ['rgba(12,12,13,0.38)', 'rgba(12,12,13,0)'] : ['rgba(10,10,10,0.55)', 'rgba(10,10,10,0)']}
        locations={fadeTop ? [0, 0.3, 0.65, 1] : undefined}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={(fadeTop ? styles.topFade : extendTop ? [styles.topVeil, { height: extendTop + 70 }] : styles.topVeil) as any}
      />
      <LinearGradient
        colors={scrim >= 1 ? HERO_FADE_COLORS : (HERO_FADE_ALPHAS.map((v, i, arr) => bgA(i === arr.length - 1 ? 1 : v * scrim)) as any)}
        locations={HERO_FADE_LOCATIONS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.scrim as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: COLORS.bg },
  fill: { width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  topFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
});
