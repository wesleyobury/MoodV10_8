import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TipPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'floating-bottom-center';

export type TipVariant = 'card' | 'minimal-down';

interface OnboardingTipProps {
  visible: boolean;
  position: TipPosition;
  copy: string;
  onTap: () => void;
  onDismiss: () => void;
  allowNeverShow?: boolean;
  onNeverShow?: () => void;
  pulseAccent?: boolean;
  showPlayBadge?: boolean;
  testIdPrefix?: string;
  /** Anchor offset (used when not floating). e.g. {top: y, left: x} */
  anchorStyle?: ViewStyle;
  /** Optional max width override */
  maxWidth?: number;
  /**
   * Visual variant.
   * - 'card' (default): solid pill/card with bg/border/X dismiss inside.
   * - 'minimal-down': transparent — white text on top, animated downward arrow below.
   *   The whole content is tappable (acts as the primary CTA). No X is shown
   *   inside; if `onDismiss` matters, callers should provide a separate dismiss
   *   gesture (long-press, scroll-away, etc.).
   */
  variant?: TipVariant;
}

const GOLD = '#F5C518';
const CARD_BG = '#1A1A1A';
const BORDER = '#2A2A2A';
const MUTED = '#6B6B6B';

export const OnboardingTip: React.FC<OnboardingTipProps> = ({
  visible,
  position,
  copy,
  onTap,
  onDismiss,
  allowNeverShow = false,
  onNeverShow,
  pulseAccent = false,
  showPlayBadge = false,
  testIdPrefix = 'onboarding-tip',
  anchorStyle,
  maxWidth = 320,
  variant = 'card',
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!pulseAccent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAccent]);

  if (!visible) return null;

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const containerStyle: ViewStyle =
    position === 'floating-bottom-center'
      ? styles.floatingBottomCenter
      : { position: 'absolute', ...(anchorStyle || {}) };

  // Minimal-down variant: text on top, animated downward arrow below. No card.
  if (variant === 'minimal-down') {
    const arrowTransform = pulseAccent
      ? [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }]
      : [];
    return (
      <Animated.View
        pointerEvents="box-none"
        style={[containerStyle, { opacity, transform: [{ translateY }] }]}
        testID={`${testIdPrefix}-container`}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onTap}
          onLongPress={onDismiss}
          delayLongPress={350}
          style={[styles.minimalDownWrapper, { maxWidth }]}
          testID={`${testIdPrefix}-tap`}
        >
          <Text style={styles.minimalDownText} numberOfLines={2}>
            {copy}
          </Text>
          <Animated.View style={{ transform: arrowTransform, marginTop: 6 }}>
            <Ionicons name="arrow-down" size={22} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[containerStyle, { opacity, transform: [{ translateY }] }]}
      testID={`${testIdPrefix}-container`}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onTap}
        style={[styles.card, { maxWidth }]}
        testID={`${testIdPrefix}-tap`}
      >
        <View style={styles.row}>
          {showPlayBadge && (
            <Animated.View
              style={[
                styles.playBadge,
                pulseAccent && {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            >
              <Ionicons name="play" size={10} color="#000" />
            </Animated.View>
          )}
          <Text style={styles.copy} numberOfLines={3}>
            {copy}
          </Text>

          {pulseAccent && !showPlayBadge && (
            <Animated.View
              style={[
                styles.arrowAccent,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={14} color={GOLD} />
            </Animated.View>
          )}
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`${testIdPrefix}-dismiss`}
        >
          <Ionicons name="close" size={12} color={MUTED} />
        </TouchableOpacity>

        {allowNeverShow && onNeverShow && (
          <TouchableOpacity
            onPress={onNeverShow}
            style={styles.neverShowWrapper}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            testID={`${testIdPrefix}-never-show`}
          >
            <Text style={styles.neverShowText}>Don&apos;t show again</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBottomCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: CARD_BG,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingRight: 28,
    minWidth: 220,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copy: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  arrowAccent: {
    marginLeft: 4,
  },
  playBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neverShowWrapper: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  neverShowText: {
    fontSize: 11,
    color: MUTED,
    textDecorationLine: 'underline',
  },
  minimalDownWrapper: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  minimalDownText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default OnboardingTip;
