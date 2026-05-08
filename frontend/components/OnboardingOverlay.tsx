import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Modal,
  Easing,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface PointerSpec {
  /** Card y position (top, in dp) */
  y: number;
  /** Card horizontal anchor */
  x: 'left' | 'right' | 'center';
  /** Title shown at top of the small label card */
  title: string;
  /** Body copy for the label */
  body: string;
  /** Optional icon shown before the title */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Direction the curved arrow points to from the card */
  arrowFrom: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'right' | 'left';
}

interface Props {
  visible: boolean;
  pointers: PointerSpec[];
  onTapAnywhere: () => void;
  onNeverShow: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const GOLD = '#F5C518';

/**
 * Full-screen semi-transparent onboarding overlay.
 * Renders a dark backdrop covering the entire screen with multiple
 * label cards anchored at preset (x, y) positions, each with a curved
 * arrow drawn via SVG. Tapping ANYWHERE on the backdrop dismisses the
 * overlay (calls onTapAnywhere). A pinned "Never show again" button
 * sits at the bottom — tapping it calls onNeverShow.
 */
export const OnboardingOverlay: React.FC<Props> = ({
  visible,
  pointers,
  onTapAnywhere,
  onNeverShow,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const labelTranslate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      labelTranslate.setValue(8);
    }
  }, [visible, opacity, labelTranslate]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onTapAnywhere}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onTapAnywhere}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          {pointers.map((p, idx) => (
            <Animated.View
              key={idx}
              pointerEvents="none"
              style={[
                styles.pointerWrapper,
                pointerPositionStyle(p),
                { transform: [{ translateY: labelTranslate }] },
              ]}
              testID={`onboarding-overlay-pointer-${idx}`}
            >
              <ArrowSvg from={p.arrowFrom} />
              <View style={styles.labelCard}>
                <View style={styles.labelTitleRow}>
                  {p.icon && (
                    <Ionicons
                      name={p.icon}
                      size={14}
                      color={GOLD}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={styles.labelTitle}>{p.title}</Text>
                </View>
                <Text style={styles.labelBody}>{p.body}</Text>
              </View>
            </Animated.View>
          ))}

          {/* Bottom CTA bar */}
          <View
            pointerEvents="box-none"
            style={styles.bottomBar}
            testID="onboarding-overlay-bottom-bar"
          >
            <Text style={styles.tapHint}>Tap anywhere to dismiss</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                onNeverShow();
              }}
              style={styles.neverShowBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="onboarding-overlay-never-show"
            >
              <Text style={styles.neverShowText}>Don&apos;t show again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function pointerPositionStyle(p: PointerSpec) {
  const base: any = { position: 'absolute', top: p.y };
  if (p.x === 'left') base.left = 18;
  else if (p.x === 'right') base.right = 18;
  else base.alignSelf = 'center';
  return base;
}

function ArrowSvg({ from }: { from: PointerSpec['arrowFrom'] }) {
  // Simple curved arrow drawn via SVG. The path origin is roughly the
  // edge of the label card; the tip points toward the target element.
  const W = 90;
  const H = 60;
  let path = '';
  let arrowHead = '';
  switch (from) {
    case 'top-right':
      path = 'M 8 8 Q 60 8, 80 50';
      arrowHead = 'M 80 50 l -10 -2 m 10 2 l -2 -10';
      break;
    case 'top-left':
      path = 'M 82 8 Q 30 8, 10 50';
      arrowHead = 'M 10 50 l 10 -2 m -10 2 l 2 -10';
      break;
    case 'bottom-right':
      path = 'M 8 52 Q 60 52, 80 10';
      arrowHead = 'M 80 10 l -10 2 m 10 -2 l -2 10';
      break;
    case 'bottom-left':
      path = 'M 82 52 Q 30 52, 10 10';
      arrowHead = 'M 10 10 l 10 2 m -10 -2 l 2 10';
      break;
    case 'right':
      path = 'M 4 30 Q 40 30, 84 30';
      arrowHead = 'M 84 30 l -10 -4 m 10 4 l -10 4';
      break;
    case 'left':
      path = 'M 86 30 Q 50 30, 6 30';
      arrowHead = 'M 6 30 l 10 -4 m -10 4 l 10 4';
      break;
  }
  return (
    <Svg
      width={W}
      height={H}
      style={[
        styles.arrowSvg,
        from.startsWith('top-')
          ? { bottom: -H + 4 }
          : from.startsWith('bottom-')
            ? { top: -H + 4 }
            : { top: 8 },
        from.endsWith('right')
          ? { left: -W + 24 }
          : from.endsWith('left')
            ? { right: -W + 24 }
            : {},
      ]}
    >
      <Path d={path} stroke={GOLD} strokeWidth={2.5} fill="none" />
      <Path d={arrowHead} stroke={GOLD} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  pointerWrapper: {
    maxWidth: 240,
  },
  arrowSvg: {
    position: 'absolute',
  },
  labelCard: {
    backgroundColor: '#1A1A1A',
    borderColor: GOLD,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  labelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelBody: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    gap: 10,
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  neverShowBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  neverShowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default OnboardingOverlay;
