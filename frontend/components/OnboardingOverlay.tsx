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
import Svg, { Line, Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export interface TargetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OverlayTarget {
  /** Measured screen rect of the underlying element (measureInWindow) */
  rect: TargetRect | null;
  /** Headline shown above the body copy */
  title: string;
  /** Multi-line body copy */
  body: string;
  /** Optional ion-icon shown before the title */
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  visible: boolean;
  targets: OverlayTarget[];
  onTapAnywhere: () => void;
  onNeverShow: () => void;
}

const GOLD = '#F5C518';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = 220;
const CARD_GAP = 14; // gap between target edge and card
const SIDE_MARGIN = 16;

/**
 * Full-screen semi-transparent onboarding overlay. Each target carries its
 * own measured screen rect; the overlay positions a label card adjacent to
 * the target with a straight arrow line + arrowhead that lands exactly on
 * the target's center, regardless of device size.
 *
 * Tapping ANY empty area of the backdrop fires onTapAnywhere. The
 * "Don't show again" pill at the bottom fires onNeverShow.
 */
export const OnboardingOverlay: React.FC<Props> = ({
  visible,
  targets,
  onTapAnywhere,
  onNeverShow,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible, opacity]);

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
          {targets.map((t, idx) => (
            <PointerCallout key={idx} target={t} index={idx} />
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

const PointerCallout: React.FC<{ target: OverlayTarget; index: number }> = ({
  target,
  index,
}) => {
  const [cardH, setCardH] = React.useState(92);

  if (!target.rect) return null;
  const { x, y, w, h } = target.rect;

  // Target center
  const tx = x + w / 2;
  const ty = y + h / 2;

  // Decide whether to place card ABOVE or BELOW the target
  const placeAbove = ty > SCREEN_H * 0.5;

  // Card top-left position
  let cardX = Math.min(
    Math.max(SIDE_MARGIN, tx - CARD_W / 2),
    SCREEN_W - CARD_W - SIDE_MARGIN,
  );
  // If target is near a screen edge, snap card to opposite side for clarity
  if (tx < SCREEN_W * 0.35) cardX = Math.max(SIDE_MARGIN, x);
  if (tx > SCREEN_W * 0.65) cardX = Math.min(SCREEN_W - CARD_W - SIDE_MARGIN, x + w - CARD_W);

  let cardY: number;
  let arrowFromY: number;
  let arrowToY: number;
  if (placeAbove) {
    cardY = Math.max(SIDE_MARGIN + 40, y - cardH - CARD_GAP - 30);
    arrowFromY = cardY + cardH; // bottom of card
    arrowToY = y - 4; // just above target's top edge
  } else {
    cardY = y + h + CARD_GAP + 26;
    arrowFromY = cardY - 4; // just above card's top edge
    arrowToY = y + h + 4; // just below target's bottom edge
  }

  // Arrow x: from card-edge midpoint nearest to target's center
  const cardCenterX = cardX + CARD_W / 2;
  const arrowFromX = cardCenterX;
  const arrowToX = tx;

  // SVG bounding box that contains both endpoints
  const svgLeft = Math.min(arrowFromX, arrowToX) - 14;
  const svgTop = Math.min(arrowFromY, arrowToY) - 14;
  const svgW = Math.abs(arrowToX - arrowFromX) + 28;
  const svgH = Math.abs(arrowToY - arrowFromY) + 28;
  const lineFromX = arrowFromX - svgLeft;
  const lineFromY = arrowFromY - svgTop;
  const lineToX = arrowToX - svgLeft;
  const lineToY = arrowToY - svgTop;

  // Arrowhead — small triangle at (lineToX, lineToY) rotated toward target
  const angle = Math.atan2(lineToY - lineFromY, lineToX - lineFromX);
  const HEAD = 9;
  const ax = lineToX;
  const ay = lineToY;
  const p1x = ax - HEAD * Math.cos(angle - Math.PI / 6);
  const p1y = ay - HEAD * Math.sin(angle - Math.PI / 6);
  const p2x = ax - HEAD * Math.cos(angle + Math.PI / 6);
  const p2y = ay - HEAD * Math.sin(angle + Math.PI / 6);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      testID={`onboarding-overlay-pointer-${index}`}
    >
      {/* Arrow */}
      <Svg
        width={svgW}
        height={svgH}
        style={{ position: 'absolute', left: svgLeft, top: svgTop }}
      >
        <Line
          x1={lineFromX}
          y1={lineFromY}
          x2={lineToX}
          y2={lineToY}
          stroke={GOLD}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Polygon
          points={`${ax},${ay} ${p1x},${p1y} ${p2x},${p2y}`}
          fill={GOLD}
        />
      </Svg>

      {/* Card */}
      <View
        style={[
          styles.labelCard,
          { left: cardX, top: cardY, width: CARD_W },
        ]}
        onLayout={(e) => {
          const h2 = e.nativeEvent.layout.height;
          if (Math.abs(h2 - cardH) > 2) setCardH(h2);
        }}
      >
        <View style={styles.labelTitleRow}>
          {target.icon && (
            <Ionicons
              name={target.icon}
              size={14}
              color={GOLD}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={styles.labelTitle}>{target.title}</Text>
        </View>
        <Text style={styles.labelBody}>{target.body}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  labelCard: {
    position: 'absolute',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  neverShowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default OnboardingOverlay;
