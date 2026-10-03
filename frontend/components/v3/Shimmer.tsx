/**
 * Shimmer (founder pass, Oct 2026): a soft gold light band sweeps across a small round button every few seconds, so it reads
 * as something to try (Cart: "Different workout" and each exercise's swap). Native driver, no layout work. The parent sets
 * overflow: 'hidden' and a round radius. `offset` staggers several shimmers so a list sweeps top to bottom instead of
 * flashing all at once.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';

/** pause: ms between sweeps · duration: ms per sweep · strength: peak opacity of the band (the top shuffle button uses the defaults) */
export function Shimmer({ size, offset = 0, pause = 1800, duration = 950, strength = 0.55 }: { size: number; offset?: number; pause?: number; duration?: number; strength?: number }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.delay(pause),
        Animated.timing(x, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => sweep.start(), offset);
    return () => { clearTimeout(t); sweep.stop(); };
  }, [x, offset, pause, duration]);
  const band = size * 0.7;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -size * 0.25,
        bottom: -size * 0.25,
        width: band,
        left: 0,
        transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-band * 1.2, size + band * 0.2] }) }, { rotate: '20deg' }],
      }}
    >
      <LinearGradient colors={['rgba(255,215,0,0)', `rgba(255,225,120,${strength})`, 'rgba(255,215,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}
