/**
 * How sharing to an Instagram Story works (founder ask, Oct 2026), shown when the athlete taps Share to Story:
 * the overlay is saved to the camera roll, Instagram opens on the Story camera, and IG's Add photo sticker puts the
 * overlay on top of their photo. "Don't show this again" is remembered on this phone.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { COLORS } from '../../../constants/brand';

const KEY = 'mood.v3.igTipOff.v1';
const IG_GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

export async function loadIgTipOff(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}
export async function saveIgTipOff(): Promise<void> {
  try { await AsyncStorage.setItem(KEY, '1'); } catch { /* best effort */ }
}

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'download-outline', title: 'Your overlay saves to your camera roll', body: 'A see-through version of your stats card, ready to sit on top of any photo.' },
  { icon: 'camera-outline', title: 'Instagram opens to your Story', body: 'Take a photo or video, or pick one from your gallery.' },
  { icon: 'images-outline', title: 'Tap Add photo to place the overlay', body: 'In the sticker tray, tap Add photo (the photo sticker), choose your MOOD overlay from Recents, then drag and pinch to place it.' },
];

export function InstagramTip({ visible, bottomInset, onClose, onGo }: { visible: boolean; bottomInset: number; onClose: () => void; onGo: (dontShowAgain: boolean) => void }) {
  const [dontShow, setDontShow] = useState(false);
  useEffect(() => { if (visible) setDontShow(false); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomInset + 16 }]} testID="v3-ig-tip">
        <View style={styles.grab} />
        <View style={styles.head}>
          <LinearGradient colors={IG_GRADIENT} locations={[0, 0.25, 0.5, 0.75, 1]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.logo as any}>
            <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>Share to your Story</Text>
        </View>
        {STEPS.map((st, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={st.icon} size={15} color={COLORS.accent} />
                <Text style={styles.stepTitle}>{st.title}</Text>
              </View>
              <Text style={styles.stepBody}>{st.body}</Text>
            </View>
          </View>
        ))}
        <Pressable onPress={() => setDontShow((v) => !v)} style={styles.check} hitSlop={6} testID="v3-ig-tip-dontshow" accessibilityRole="checkbox" accessibilityState={{ checked: dontShow }}>
          <Ionicons name={dontShow ? 'checkbox' : 'square-outline'} size={19} color={dontShow ? COLORS.accent : COLORS.textTertiary} />
          <Text style={styles.checkText}>{"Don't show this again"}</Text>
        </Pressable>
        <Pressable onPress={() => onGo(dontShow)} testID="v3-ig-tip-go" style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
          <LinearGradient colors={IG_GRADIENT} locations={[0, 0.25, 0.5, 0.75, 1]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.go as any}>
            <Text style={styles.goText}>Got it, open Instagram</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#121214', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  step: { flexDirection: 'row', gap: 12, marginTop: 16 },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 1 },
  numText: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  stepTitle: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  stepBody: { fontSize: 13.5, lineHeight: 19, color: COLORS.textTertiary, marginTop: 3 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 14 },
  checkText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  go: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  goText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
});
