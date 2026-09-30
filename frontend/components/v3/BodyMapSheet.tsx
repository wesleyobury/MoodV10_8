/**
 * BodyMapSheet: "Where are you sore?" Opens the moment the user taps Sore (Home and Build).
 *
 * Founder pass 3: full-body MOOD figures (female by default, male one tap away, the choice remembered on this device), front and
 * back. There are no buttons or hotspot outlines on the figure: the user taps the body where it hurts and that area lights up
 * with a soft MOOD heat glow drawn over the muscle, leaving the body detail visible underneath. Tap it again to clear it.
 * Tap targets are invisible and a little larger than the glow (utils/v3BodyMap HIT_SCALE).
 *
 * Areas (utils/v3BodyMap BODY_MAP_REGIONS): Shoulders, Chest, Biceps, Triceps, Upper Back, Core, Lower Back, Glutes, Quads,
 * Hamstrings, Calves. They are sent to the generator exactly as tapped (the API accepts these muscle ids directly).
 * Older broad selections (legs / arms / back) open expanded into what they already meant.
 *
 * Done with at least one area -> onDone(regions). Done with none, or Cancel -> onCancel() (Sore is not kept without an area).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, G, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import type { V3SoreRegion } from '../../utils/v3Api';
import {
  BODY_IMAGE_ASPECT,
  BODY_SPOTS,
  BodyFigure,
  BodySide,
  hiddenOn,
  hitRegion,
  regionLabel,
  sidesFor,
  toMapRegions,
  toggleRegion,
} from '../../utils/v3BodyMap';

export { BODY_MAP_REGIONS } from '../../utils/v3BodyMap';

export const BODY_FIGURE_KEY = '@mood_v3_bodymap_figure_v1';
const DEFAULT_FIGURE: BodyFigure = 'female';

const IMAGES: Record<BodyFigure, Record<BodySide, any>> = {
  female: { front: require('../../assets/images/body/female-front.jpg'), back: require('../../assets/images/body/female-back.jpg') },
  male: { front: require('../../assets/images/body/male-front.jpg'), back: require('../../assets/images/body/male-back.jpg') },
};

const VB_H = 100 / BODY_IMAGE_ASPECT; // uniform viewBox: x 0..100, y 0..VB_H

interface Props {
  visible: boolean;
  initial: V3SoreRegion[];
  onDone: (regions: V3SoreRegion[]) => void;
  onCancel: () => void;
}

export function BodyMapSheet({ visible, initial, onDone, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [sel, setSel] = useState<V3SoreRegion[]>(() => toMapRegions(initial));
  const [side, setSide] = useState<BodySide>('front');
  const [figure, setFigure] = useState<BodyFigure>(DEFAULT_FIGURE);
  const [pulse, setPulse] = useState<V3SoreRegion | null>(null);
  const glow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const start = toMapRegions(initial);
    setSel(start);
    AsyncStorage.getItem(BODY_FIGURE_KEY)
      .then((v) => {
        const f: BodyFigure = v === 'male' || v === 'female' ? v : DEFAULT_FIGURE;
        setFigure(f);
        // Open on the side where the current selection lives.
        setSide(start.length && hiddenOn(f, 'front', start) === start.length ? 'back' : 'front');
      })
      .catch(() => setSide('front'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const flash = (r: V3SoreRegion) => {
    setPulse(r);
    glow.setValue(0.35);
    Animated.timing(glow, { toValue: 1, duration: 320, useNativeDriver: true }).start(() => setPulse(null));
  };

  const toggle = (r: V3SoreRegion) => {
    Haptics.selectionAsync().catch(() => {});
    setSel((cur) => {
      const next = toggleRegion(cur, r);
      if (next.includes(r)) flash(r);
      return next;
    });
  };

  const switchFigure = () => {
    const next: BodyFigure = figure === 'female' ? 'male' : 'female';
    setFigure(next);
    AsyncStorage.setItem(BODY_FIGURE_KEY, next).catch(() => {});
  };

  // One box for every figure / side (the four images share a crop), sized to the screen.
  const boxW = Math.min(Math.max(300, Math.min(height * 0.5, 470)) * BODY_IMAGE_ASPECT, width - 40);
  const boxH = boxW / BODY_IMAGE_ASPECT;

  const figRef = useRef<View>(null);
  const pick = (x: number, y: number) => {
    const r = hitRegion(figure, side, (x / boxW) * 100, (y / boxH) * 100);
    if (r) toggle(r);
  };
  const onFigurePress = (e: GestureResponderEvent) => {
    const { locationX, locationY, pageX, pageY } = e.nativeEvent;
    if (locationX != null && locationY != null) return pick(locationX, locationY);
    // react-native-web press events carry page coordinates only: resolve them against the figure's position on screen.
    figRef.current?.measureInWindow((fx, fy) => pick(pageX - fx, pageY - fy));
  };

  const n = sel.length;
  // Selections that live only on the other view show as a count on that tab.
  const onlyOn = (s: BodySide) => sel.filter((r) => sidesFor(figure, r).includes(s) && !sidesFor(figure, r).includes(side)).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]} testID="v3-body-map">
        <View style={styles.grip} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Where are you sore?</Text>
            <Text style={styles.sub}>Tap where it hurts. MOOD trains around it.</Text>
          </View>
          <Pressable
            onPress={switchFigure}
            hitSlop={10}
            style={styles.figureBtn}
            accessibilityRole="button"
            accessibilityLabel={`Figure: ${figure}. Switch to ${figure === 'female' ? 'male' : 'female'}`}
            testID="v3-body-map-figure"
          >
            <Ionicons name={figure === 'female' ? 'woman-outline' : 'man-outline'} size={16} color={COLORS.textPrimary} />
            <Ionicons name="swap-horizontal" size={13} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.seg}>
          {(['front', 'back'] as BodySide[]).map((s) => {
            const count = s === side ? 0 : onlyOn(s);
            return (
              <Pressable key={s} onPress={() => setSide(s)} style={[styles.segBtn, side === s && styles.segOn]} testID={`v3-body-map-${s}`}>
                <Text style={[styles.segText, side === s && styles.segTextOn]}>{s === 'front' ? 'Front' : 'Back'}</Text>
                {count ? (
                  <View style={styles.segDot}>
                    <Text style={styles.segDotText}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          ref={figRef as any}
          onPress={onFigurePress}
          style={[styles.figure, { width: boxW, height: boxH }]}
          accessibilityLabel="Body map. Tap where you are sore."
          testID="v3-body-map-figure-tap"
        >
          <View style={{ width: boxW, height: boxH }} pointerEvents="none">
            <Image source={IMAGES[figure][side]} style={{ width: boxW, height: boxH }} resizeMode="cover" />
            <Svg width={boxW} height={boxH} viewBox={`0 0 100 ${VB_H}`} style={StyleSheet.absoluteFill as any}>
              <Defs>
                <RadialGradient id="heatHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FF7A1A" stopOpacity={0.42} />
                  <Stop offset="60%" stopColor="#FF9A1F" stopOpacity={0.16} />
                  <Stop offset="100%" stopColor="#FFC933" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="heatCore" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FF4A1A" stopOpacity={0.55} />
                  <Stop offset="45%" stopColor="#FF8A1F" stopOpacity={0.46} />
                  <Stop offset="80%" stopColor="#FFC933" stopOpacity={0.16} />
                  <Stop offset="100%" stopColor="#FFC933" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              {BODY_SPOTS[figure][side]
                .filter((sp) => sel.includes(sp.region))
                .map((sp, i) => {
                  const cy = sp.cy * (VB_H / 100);
                  const ry = sp.ry * (VB_H / 100);
                  const t = sp.rot ? `rotate(${sp.rot} ${sp.cx} ${cy})` : undefined;
                  return (
                    <G key={`${sp.region}-${i}`} transform={t} opacity={pulse === sp.region ? 0.85 : 1}>
                      <Ellipse cx={sp.cx} cy={cy} rx={sp.rx * 1.55} ry={ry * 1.45} fill="url(#heatHalo)" />
                      <Ellipse cx={sp.cx} cy={cy} rx={sp.rx * 1.08} ry={ry * 1.06} fill="url(#heatCore)" />
                    </G>
                  );
                })}
            </Svg>
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pickedScroll}
          contentContainerStyle={[styles.picked, !n && { flex: 1 }]}
          testID="v3-body-map-selected"
        >
          {n ? (
            sel.map((r) => (
              <Pressable key={r} onPress={() => toggle(r)} hitSlop={4} style={styles.pick} testID={`v3-sore-${r}`} accessibilityLabel={`Remove ${regionLabel(r)}`}>
                <View style={styles.pickDot} />
                <Text style={styles.pickText}>{regionLabel(r)}</Text>
                <Ionicons name="close" size={12} color={COLORS.textSecondary} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.hint}>{side === 'front' ? 'Flip to Back for back, triceps, glutes and hamstrings.' : 'Flip to Front for chest, biceps, core and quads.'}</Text>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable onPress={onCancel} hitSlop={8} style={styles.cancel} testID="v3-body-map-cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => (n ? onDone(sel) : onCancel())}
            style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.9 }]}
            testID="v3-body-map-done"
          >
            <LinearGradient
              colors={n ? [...BRAND_GRADIENT] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.done}
            >
              <Text style={[styles.doneText, !n && styles.doneTextOff]}>{n ? `Done · ${n} ${n === 1 ? 'area' : 'areas'}` : 'Tap where you’re sore'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#000',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  sub: { fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary, marginTop: 3 },
  figureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  seg: { flexDirection: 'row', alignSelf: 'center', marginTop: 12, padding: 3, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 7, borderRadius: 11 },
  segOn: { backgroundColor: 'rgba(255,255,255,0.14)' },
  segText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textTertiary },
  segTextOn: { color: COLORS.textPrimary },
  segDot: { minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#FF8A1F', alignItems: 'center', justifyContent: 'center' },
  segDotText: { fontSize: 10.5, fontWeight: '800', color: '#140A00' },
  figure: { alignSelf: 'center', marginTop: 8, overflow: 'hidden', backgroundColor: '#000' },
  pickedScroll: { marginTop: 10, flexGrow: 0, height: 30 },
  picked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minWidth: '100%' },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pickDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF8A1F' },
  pickText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  hint: { fontSize: 12.5, lineHeight: 17, color: COLORS.textTertiary, textAlign: 'center', paddingHorizontal: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  cancel: { paddingHorizontal: 6, paddingVertical: 10 },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  done: { height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 16, fontWeight: '800', color: COLORS.accentInk },
  doneTextOff: { color: COLORS.textTertiary },
});
