/**
 * AddWorkoutCoachmark — first-time coaching overlay for the workout-cards screen.
 *
 * A transparent overlay that points at the FIRST workout card's "Add workout"
 * button and explains the mechanic. Because that button sits at different
 * vertical positions depending on the path (description length, muscle-group
 * indicator, etc.), we never hard-code a position — each WorkoutCard measures
 * its own Add button in window coordinates and reports it up. The provider keeps
 * the top-most reported button (smallest y), which is always the first card.
 *
 * Shown ONCE per user (persisted via AsyncStorage), then never again. Mount the
 * provider near the app root; WorkoutCard consumes the context automatically.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';

const STORAGE_KEY = 'mood_coachmark_addworkout_v1';
const COACHMARK_COPY = 'Add workout to build your cart, swipe cards for variations.';

export interface AddButtonRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoachmarkContextValue {
  mountCard: () => void;
  unmountCard: () => void;
  reportAddButtonRect: (rect: AddButtonRect) => void;
}

const CoachmarkContext = createContext<CoachmarkContextValue | null>(null);

export const useAddWorkoutCoachmark = () => useContext(CoachmarkContext);

export function AddWorkoutCoachmarkProvider({ children }: { children: React.ReactNode }) {
  const [rect, setRect] = useState<AddButtonRect | null>(null);
  // null = still loading the persisted flag; false = not seen yet; true = seen.
  const [seen, setSeen] = useState<boolean | null>(null);
  const cardCount = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => setSeen(v === '1'))
      .catch(() => setSeen(false));
  }, []);

  const mountCard = useCallback(() => {
    cardCount.current += 1;
  }, []);

  const unmountCard = useCallback(() => {
    cardCount.current = Math.max(0, cardCount.current - 1);
    // Once every card has left the screen, drop the stale anchor so the
    // overlay can never appear on a screen with no workout cards.
    if (cardCount.current === 0) setRect(null);
  }, []);

  const reportAddButtonRect = useCallback((next: AddButtonRect) => {
    // Keep the top-most button (the first card on screen).
    setRect((prev) => (!prev || next.y < prev.y ? next : prev));
  }, []);

  const dismiss = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  }, []);

  const visible = seen === false && !!rect;

  return (
    <CoachmarkContext.Provider value={{ mountCard, unmountCard, reportAddButtonRect }}>
      {children}
      {visible && rect && <CoachmarkOverlay rect={rect} onDismiss={dismiss} />}
    </CoachmarkContext.Provider>
  );
}

function CoachmarkOverlay({ rect, onDismiss }: { rect: AddButtonRect; onDismiss: () => void }) {
  const { width: SCREEN_W } = Dimensions.get('window');
  const [bubbleH, setBubbleH] = useState(0);

  const GAP = 14;
  const SIDE = 16;
  const POINTER = 16;

  // Prefer placing the bubble above the button; fall back to below if there
  // isn't room near the top of the screen.
  const placeAbove = rect.y - bubbleH - GAP > 90;
  const bubbleTop = placeAbove ? rect.y - bubbleH - GAP : rect.y + rect.height + GAP;

  const targetCenterX = rect.x + rect.width / 2;
  const pointerLeft = Math.min(
    Math.max(targetCenterX - SIDE - POINTER / 2, 12),
    SCREEN_W - 2 * SIDE - 12 - POINTER,
  );

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <View
          pointerEvents="none"
          style={[
            styles.ring,
            { left: rect.x - 6, top: rect.y - 6, width: rect.width + 12, height: rect.height + 12 },
          ]}
        />

        <View
          onLayout={(e) => setBubbleH(e.nativeEvent.layout.height)}
          style={[styles.bubble, { top: bubbleTop, left: SIDE, right: SIDE, opacity: bubbleH ? 1 : 0 }]}
        >
          <Text style={styles.bubbleTitle}>Build your workout</Text>
          <Text style={styles.bubbleText}>{COACHMARK_COPY}</Text>

          <TouchableOpacity onPress={onDismiss} activeOpacity={0.85} style={styles.gotIt}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gotItGrad}
            >
              <Text style={styles.gotItText}>Got it</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View
            style={[styles.pointer, { left: pointerLeft }, placeAbove ? { bottom: -POINTER / 2 } : { top: -POINTER / 2 }]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  ring: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.40)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bubbleTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  bubbleText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 19 },
  gotIt: { alignSelf: 'flex-end', marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  gotItGrad: { paddingVertical: 8, paddingHorizontal: 18 },
  gotItText: { color: COLORS.accentInk, fontWeight: '700', fontSize: 13 },
  pointer: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#1A1A1A',
    transform: [{ rotate: '45deg' }],
  },
});
