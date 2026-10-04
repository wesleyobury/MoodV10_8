/**
 * Renders the onboarding images invisibly, at card size, so the native image cache has them decoded before the screen
 * that shows them mounts. Zero layout impact (absolute, off-screen, transparent, not touchable).
 */
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ONB_IMAGES } from './onboardingImages';

export function OnboardingImageWarmup() {
  return (
    <View style={styles.box} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Object.values(ONB_IMAGES).map((src, i) => (
        <Image key={i} source={src} style={styles.img} fadeDuration={0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: -2000, top: 0, opacity: 0 },
  img: { width: 180, height: 170 },
});
