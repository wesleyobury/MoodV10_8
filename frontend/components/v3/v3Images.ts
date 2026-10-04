/**
 * V3 imagery: maps the pure hero keys (utils/cartHero.ts) to real image sources.
 * Local portraits are the onboarding payoff images already in the bundle (no new assets, no size increase).
 * Remote heroes are the existing MOOD featured heroes on Cloudinary, requested at the width we actually draw.
 */
import type { ImageSourcePropType } from 'react-native';
import type { V3HeroAssetKey, V3HeroSource } from '../../utils/cartHero';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';

export const V3_ASSETS: Record<V3HeroAssetKey, ImageSourcePropType> = {
  strength: require('../../assets/images/payoff/payoff-muscle.png'),
  sweat: require('../../assets/images/payoff/payoff-sweat.png'),
  athletic: require('../../assets/images/payoff/payoff-explosive.png'),
  calisthenics: require('../../assets/images/payoff/payoff-calisthenics.png'),
  outdoor: require('../../assets/images/payoff/payoff-outdoor.png'),
};

/** An <Image> source for a hero. `width` is the drawn width in points; Cloudinary gets 3x for crisp phones. */
export function heroImageSource(src: V3HeroSource, width = 430): ImageSourcePropType {
  if (src.kind === 'asset') return V3_ASSETS[src.key];
  return { uri: optimizedImageUrl(src.uri, Math.min(1440, Math.round(width * 3))) };
}
