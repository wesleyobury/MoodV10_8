/**
 * ExerciseSheet: the Cart row's detail (H2). Everything the Phase 2.6 Details screen showed per exercise, one tap deep:
 *
 *   media (MOOD static photo; Watch demo when the library has video)   or an intentional monogram
 *   name · equipment · muscles · where it sits (Main Lift, A1, ANCHOR ...)
 *   prescription, rest, effort, block format
 *   load guidance · quality stop · progression · all cues
 *   Swap exercise (slot-level, revalidated by the server; same endpoint as before)
 *
 * The sheet always renders the item from the current envelope, so after a swap it shows the new exercise in place.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';
import type { V3Workout } from '../../utils/v3Api';
import { itemDetail } from '../../utils/v3CartFormat';
import { TRAINING_TERMS, TermId } from '../../utils/v3PlainLanguage';
import { hasVideo } from '../../utils/v3OverviewFormat';
import { exerciseImageUrl } from '../../utils/v3ExerciseImages';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';
import ExerciseLookupSheet from '../ExerciseLookupSheet';
import { ExerciseThumb } from './ExerciseThumb';

interface Props {
  workout: V3Workout | null;
  itemId: string | null;
  swapping: boolean;
  onSwap: (itemId: string) => void;
  onClose: () => void;
  /** Short confirmation shown inside the sheet (the screen's toast sits behind the modal). */
  notice?: string | null;
}

export function ExerciseSheet({ workout, itemId, swapping, onSwap, onClose, notice }: Props) {
  const insets = useSafeAreaInsets();
  const [demoOpen, setDemoOpen] = useState(false);
  const [openTerm, setOpenTerm] = useState<TermId | null>(null);
  const found = workout && itemId ? itemDetail(workout, itemId) : null;
  const visible = !!found;
  const it = found?.item;
  const d = found?.detail;
  const rawImg = it ? exerciseImageUrl(it) : null;
  const thumb = rawImg ? optimizedImageUrl(rawImg, 1080) : null;
  const video = it ? hasVideo(it) : false;
  const canSwap = !!it?.swap?.swappable;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      {it && d ? (
        <>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]} testID="v3-exercise-sheet">
          <View style={styles.grip} />
          {notice ? (
            <View style={styles.notice} testID="v3-sheet-notice">
              <Ionicons name="checkmark-circle" size={15} color={COLORS.accent} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {thumb ? (
              <Pressable onPress={() => video && setDemoOpen(true)} disabled={!video} style={styles.media} testID="v3-sheet-media">
                <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFillObject as any} />
                {video ? (
                  <View style={styles.play}>
                    <Ionicons name="play" size={20} color={COLORS.accentInk} />
                  </View>
                ) : null}
              </Pressable>
            ) : (
              <View style={styles.monoRow}>
                <ExerciseThumb item={it} size={64} />
              </View>
            )}

            <Text style={styles.role}>{d.role.toUpperCase()}</Text>
            <Text style={styles.name} testID="v3-sheet-name">
              {it.exercise.name}
            </Text>
            <Text style={styles.sub}>{[d.equipment, d.muscles.join(', ') || null].filter(Boolean).join(' · ')}</Text>

            <View style={styles.rxCard}>
              <Text style={styles.rx} testID="v3-sheet-rx">
                {d.rx}
              </Text>
              {d.facts.map((f) => (
                <View key={f.label}>
                  <Pressable
                    style={styles.fact}
                    disabled={!f.term}
                    onPress={() => setOpenTerm((t) => (t === f.term ? null : f.term ?? null))}
                    testID={`v3-sheet-fact-${f.label.toLowerCase()}`}
                  >
                    <Text style={styles.factLabel}>{f.label}</Text>
                    <Text style={styles.factValue}>{f.value}</Text>
                    {f.term ? <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.45)" style={{ marginLeft: 4 }} /> : null}
                  </Pressable>
                  {f.term && openTerm === f.term ? (
                    <Text style={styles.termDef} testID="v3-sheet-term-def">
                      <Text style={styles.termName}>{TRAINING_TERMS[f.term].term}: </Text>
                      {TRAINING_TERMS[f.term].definition}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {d.fit ? <Section icon="options-outline" title="Make it fit you" text={d.fit} testID="v3-sheet-fit" /> : null}
            {d.loadGuidance ? <Section icon="barbell-outline" title="Load" text={d.loadGuidance} /> : null}
            {d.qualityStop ? <Section icon="speedometer-outline" title="Quality stop" text={d.qualityStop} /> : null}
            {d.progression ? <Section icon="trending-up" title="Progression" text={d.progression} /> : null}

            {d.cues.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cues</Text>
                {d.cues.map((c, i) => (
                  <View key={i} style={styles.cue}>
                    <View style={styles.bullet} />
                    <Text style={styles.cueText}>{c}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            {video ? (
              <Pressable onPress={() => setDemoOpen(true)} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]} testID="v3-sheet-demo">
                <Ionicons name="play-circle-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.btnText}>Watch demo</Text>
              </Pressable>
            ) : null}
            {canSwap ? (
              <Pressable
                onPress={() => onSwap(it.item_id)}
                disabled={swapping}
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
                testID={`v3-swap-${it.item_id}`}
                accessibilityState={{ busy: swapping }}
              >
                {swapping ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="swap-horizontal" size={18} color={COLORS.textPrimary} />}
                <Text style={styles.btnText}>{swapping ? 'Swapping…' : 'Swap exercise'}</Text>
              </Pressable>
            ) : null}
          </View>

        </View>
          <ExerciseLookupSheet
            visible={demoOpen}
            onClose={() => setDemoOpen(false)}
            initialExercise={
              it.exercise.media?.video_url
                ? {
                    _id: it.exercise.media.library_id ?? it.exercise.id,
                    name: it.exercise.name,
                    aliases: [],
                    equipment: it.exercise.equipment_label ? [it.exercise.equipment_label] : [],
                    thumbnail_url: it.exercise.media.thumbnail_url ?? '',
                    video_url: it.exercise.media.video_url,
                    cues: d.cues,
                  }
                : null
            }
          />
        </>
      ) : null}
    </Modal>
  );
}

function Section({ icon, title, text, testID }: { icon: string; title: string; text: string; testID?: string }) {
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon as any} size={14} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    paddingTop: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#121212',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginBottom: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  noticeText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  media: { height: 190, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1a1a1a', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  play: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.textPrimary },
  monoRow: { marginBottom: 14 },
  role: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.accent },
  name: { fontSize: 26, lineHeight: 31, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginTop: 4 },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  rxCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  rx: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'], marginBottom: 4 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingTop: 9 },
  factLabel: { fontSize: 13, color: COLORS.textTertiary },
  termDef: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, marginTop: 6, paddingLeft: 2 },
  termName: { fontWeight: '700', color: COLORS.textPrimary },
  factValue: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right' },
  section: { marginTop: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.2 },
  sectionText: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, marginTop: 5 },
  cue: { flexDirection: 'row', gap: 10, marginTop: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.textPrimary, opacity: 0.6, marginTop: 8 },
  cueText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
});
