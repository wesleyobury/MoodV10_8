/**
 * Onboarding imagery: 900 px JPG versions of the payoff portraits (60–100 KB each instead of 1.3–1.8 MB PNGs), so the
 * training-style cards on the first question and the reveal card show instantly.
 *
 * warmOnboardingImages() runs on the intro screen (and again on the construction screen): it prefetches each asset
 * (in a dev build assets come from the Metro server, which is where most of the visible delay came from) and the intro
 * also renders them invisibly at card size (OnboardingImageWarmup) so they are decoded before step 1 mounts.
 */
import { Image, ImageSourcePropType } from 'react-native';
import type { Direction, TrainingPreference } from '../../utils/v3Profile';

export const ONB_IMAGES = {
  strength: require('../../assets/images/onboarding/onb-strength.jpg'),
  sweat: require('../../assets/images/onboarding/onb-sweat.jpg'),
  athletic: require('../../assets/images/onboarding/onb-athletic.jpg'),
  mix: require('../../assets/images/onboarding/onb-mix.jpg'),
} as const;

export const PREFERENCE_IMAGE: Record<TrainingPreference, ImageSourcePropType> = {
  lifting: ONB_IMAGES.strength,
  conditioning: ONB_IMAGES.sweat,
  athletic: ONB_IMAGES.athletic,
  mix: ONB_IMAGES.mix,
};

export const DIRECTION_IMAGE: Record<Direction, ImageSourcePropType> = {
  strength: ONB_IMAGES.strength,
  sweat: ONB_IMAGES.sweat,
  athletic: ONB_IMAGES.athletic,
};

/** Source aspect (height / width) of the onboarding JPGs, for top-anchored cropping. */
export const ONB_ASPECT = 1125 / 900;

let warmed = false;
export function warmOnboardingImages(): void {
  if (warmed) return;
  warmed = true;
  for (const src of Object.values(ONB_IMAGES)) {
    try {
      const uri = Image.resolveAssetSource(src)?.uri;
      if (uri && /^https?:/.test(uri)) Image.prefetch(uri).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }
}
