/**
 * ConfigSheet: the one "Change" interaction on Home (Phase 2.6). Everything optional lives here:
 *
 *   FOCUS          What do you want to train?        MOOD's Pick | Targets (Strength / Sweat only)
 *   WORKOUT TYPE   Want a specific style of session?  Let MOOD choose | registry archetypes
 *   GOAL           What are you training for? (the funnel question; default: Training Profile goal; today only)
 *   DIFFICULTY     Beginner | Intermediate | Advanced (default: Training Profile experience; today only)
 *   LENGTH         60 | 30
 *
 * The backend takes one routing instruction (a Target or an archetype). The sheet keeps that graceful: picking a Focus
 * puts Workout Type back to "Let MOOD choose", picking a Workout Type puts Focus back to MOOD's Pick, and one quiet line
 * says which choice now leads. Edits stay in a draft until Done, so Home only ever shows a complete configuration.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import type { V3Experience } from '../../utils/v3Api';
import {
  ARCHETYPES,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  DURATIONS,
  HomeInputs,
  TARGETS,
  archetypeName,
  clearTarget,
  configSummary,
  focusSummary,
  effectiveDifficulty,
  isTargetSelected,
  setArchetype,
  setDifficulty,
  setDuration,
  targetLabel,
  targetSupported,
  toggleTarget,
  BODY_AREAS,
  STRENGTH_MUSCLES,
  bodyAreaOf,
  isStrengthMuscleSelected,
  pickBodyArea,
  toggleStrengthMuscle,
  GOAL_CHOICES,
  GOAL_LABEL,
  V3Goal,
  effectiveGoal,
  setGoal,
} from '../../utils/v3HomeModel';
import { V3Chip } from './V3Chip';

interface Props {
  visible: boolean;
  inputs: HomeInputs;
  suggest30?: boolean;
  /** training_profile.experience: the default Difficulty. */
  profileLevel: V3Experience | null;
  /** training_profile.goal (the funnel answer): the default Goal. */
  profileGoal?: V3Goal | null;
  onApply: (next: HomeInputs) => void;
  onClose: () => void;
  /** H1: the Build screen shows Length inline, so its Focus sheet hides it. Default true. */
  showLength?: boolean;
}

/** Upper Body / Lower Body is picked (Full Body is its own chip). */
function bodyAreaOrUpperLower(target: HomeInputs['target']): boolean {
  const a = bodyAreaOf(target);
  return !!a && a.id !== 'full_body';
}

export function ConfigSheet({ visible, inputs, suggest30, profileLevel, profileGoal = null, onApply, onClose, showLength = true }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<HomeInputs>(inputs);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(inputs);
      setNote(null);
    }
  }, [visible, inputs]);

  const canTarget = targetSupported(draft.direction);
  /** Strength (founder edit pass): MOOD's Pick / Body Area / Specific Muscle. Target routing chooses the architecture, so the
   *  internal session types (Upper Push, Lower Hinge ...) are not a second targeting system in the UI. */
  const strength = draft.direction === 'strength';

  const pickArea = (id: string) => {
    setDraft({ ...pickBodyArea(draft, id), archetype: null });
    setNote(null);
  };
  const pickMuscle = (id: string) => {
    const r = toggleStrengthMuscle(draft, id);
    if (r.limitHit) {
      setNote('Up to 3 muscles. MOOD builds the session around them.');
      return;
    }
    setDraft(r.inputs);
    setNote(null);
  };

  const pickFocus = (chipId: string | null) => {
    if (chipId === null) {
      setDraft(clearTarget(draft));
      setNote(null);
      return;
    }
    const hadType = draft.archetype;
    // a muscle tapped while Upper / Lower Body is picked starts a fresh muscle selection
    const base = bodyAreaOrUpperLower(draft.target) ? clearTarget(draft) : draft;
    const r = toggleTarget(base, chipId);
    if (r.limitHit) {
      setNote('Up to 3 muscle groups. Arms counts as two.');
      return;
    }
    setDraft(r.inputs);
    const lbl = targetLabel(r.inputs.target);
    setNote(hadType && lbl ? `MOOD now builds the session around ${lbl}.` : null);
  };

  const pickType = (id: string | null) => {
    const hadFocus = targetLabel(draft.target);
    const next = setArchetype(draft, id);
    setDraft(next);
    setNote(id && hadFocus ? `${archetypeName(id)} now shapes the session.` : null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="v3-config-sheet">
        <View style={styles.grip} />
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {strength ? (
            <>
              <View style={styles.group}>
                <Text style={styles.label}>MOOD&apos;S PICK</Text>
                <Text style={styles.question}>Let MOOD choose from your profile and recent training</Text>
                <View style={styles.wrap}>
                  <V3Chip
                    size="sm"
                    label="MOOD's Pick"
                    icon="sparkles"
                    selected={draft.target === null && !draft.archetype}
                    onPress={() => {
                      setDraft({ ...clearTarget(draft), archetype: null });
                      setNote(null);
                    }}
                    testID="v3-focus-moods-pick"
                  />
                </View>
              </View>
              <View style={styles.group}>
                <Text style={styles.label}>BODY AREA</Text>
                <View style={styles.row}>
                  {BODY_AREAS.map((a) => (
                    <V3Chip key={a.id} size="sm" label={a.label} selected={bodyAreaOf(draft.target)?.id === a.id} onPress={() => pickArea(a.id)} testID={`v3-area-${a.id}`} />
                  ))}
                </View>
              </View>
              <View style={styles.group}>
                <Text style={styles.label}>SPECIFIC MUSCLE</Text>
                <Text style={styles.hint}>Up to 3</Text>
                <View style={[styles.wrap, { marginTop: 10 }]}>
                  {STRENGTH_MUSCLES.map((m) => (
                    <V3Chip key={m.id} size="sm" label={m.label} selected={isStrengthMuscleSelected(draft, m.id)} onPress={() => pickMuscle(m.id)} testID={`v3-muscle-${m.id}`} />
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
          {canTarget ? (
              <View style={styles.group}>
                <Text style={styles.label}>FOCUS</Text>
                <Text style={styles.question}>What do you want to train?</Text>
                <View style={styles.wrap}>
                  <V3Chip size="sm" label="MOOD's Pick" icon="sparkles" selected={draft.target === null} onPress={() => pickFocus(null)} testID="v3-focus-moods-pick" />
                  {/* founder review: Upper Body / Lower Body as one-tap areas (the same Target sets Strength's BODY AREA sends) */}
                  {BODY_AREAS.filter((a) => a.id !== 'full_body').map((a) => (
                    <V3Chip key={a.id} size="sm" label={a.label} selected={bodyAreaOf(draft.target)?.id === a.id} onPress={() => pickArea(a.id)} testID={`v3-focus-${a.id}`} />
                  ))}
                  {TARGETS.map((t) => (
                    <V3Chip
                      key={t.id}
                      size="sm"
                      label={t.label}
                      // while an area is picked, its muscles are not shown as separately selected
                      selected={t.muscles === 'full_body' ? draft.target === 'full_body' : !bodyAreaOrUpperLower(draft.target) && isTargetSelected(draft, t.id)}
                      onPress={() => pickFocus(t.id)}
                      testID={`v3-focus-${t.id}`}
                    />
                  ))}
                </View>
              </View>
            ) : null}
  
            <View style={styles.group}>
              <Text style={styles.label}>WORKOUT TYPE</Text>
              <Text style={styles.question}>Want a specific style of session?</Text>
              <View style={styles.wrap}>
                <V3Chip size="sm" label="Let MOOD choose" selected={draft.archetype === null} onPress={() => pickType(null)} testID="v3-type-moods" />
                {ARCHETYPES[draft.direction].map((a) => (
                  <V3Chip key={a.id} size="sm" label={a.name} selected={draft.archetype === a.id} onPress={() => pickType(a.id)} testID={`v3-type-${a.id}`} />
                ))}
              </View>
            </View>
  
            </>
          )}

          {note ? (
            <Text style={styles.note} testID="v3-config-note">
              {note}
            </Text>
          ) : null}

          <View style={styles.group} testID="v3-goal-group">
            <Text style={styles.label}>GOAL</Text>
            <Text style={styles.question}>What are you training for?</Text>
            <View style={styles.wrap}>
              {GOAL_CHOICES.map((g) => (
                <V3Chip
                  key={g.id}
                  size="sm"
                  label={g.label}
                  selected={effectiveGoal(draft, profileGoal) === g.id}
                  onPress={() => setDraft(setGoal(draft, g.id, profileGoal))}
                  testID={`v3-goal-${g.id}`}
                />
              ))}
            </View>
            <Text style={styles.hint} testID="v3-goal-hint">
              {draft.goal && profileGoal
                ? `Today only. Your Training Profile stays ${GOAL_LABEL[profileGoal]}.`
                : profileGoal
                  ? 'Your answer from setup.'
                  : 'Today only.'}
            </Text>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>DIFFICULTY</Text>
            <View style={styles.row}>
              {DIFFICULTIES.map((x) => (
                <V3Chip
                  key={x.id}
                  size="sm"
                  label={x.label}
                  selected={effectiveDifficulty(draft, profileLevel) === x.id}
                  onPress={() => setDraft(setDifficulty(draft, x.id, profileLevel))}
                  testID={`v3-difficulty-${x.id}`}
                />
              ))}
            </View>
            <Text style={styles.hint} testID="v3-difficulty-hint">
              {draft.difficulty && profileLevel
                ? `Today only. Your Training Profile stays ${DIFFICULTY_LABEL[profileLevel]}.`
                : profileLevel
                  ? 'From your Training Profile.'
                  : 'Today only.'}
            </Text>
          </View>

          {showLength ? (
          <View style={styles.group}>
            <Text style={styles.label}>LENGTH</Text>
            <View style={styles.row}>
              {DURATIONS.map((d) => (
                <V3Chip
                  key={d}
                  size="sm"
                  label={`${d} min`}
                  badge={suggest30 && d === 30 && draft.duration !== 30 ? 'SUGGESTED' : undefined}
                  selected={draft.duration === d}
                  onPress={() => setDraft(setDuration(draft, d))}
                  testID={`v3-length-${d}`}
                />
              ))}
            </View>
          </View>
          ) : null}
        </ScrollView>

        <Pressable onPress={() => onApply(draft)} testID="v3-config-done" style={({ pressed }) => [styles.doneWrap, pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.done}>
            <Text style={styles.doneText}>{showLength ? `Done · ${configSummary(draft)}` : `Done · ${focusSummary(draft)}`}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '86%',
    paddingTop: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: COLORS.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 6 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  group: { marginTop: 18 },
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  question: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4, marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  hint: { fontSize: 12, color: COLORS.textTertiary, marginTop: 8 },
  note: { fontSize: 12.5, lineHeight: 18, color: COLORS.textSecondary, marginTop: 12 },
  doneWrap: { marginHorizontal: 20, marginTop: 12 },
  done: { height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 16, fontWeight: '800', color: COLORS.accentInk },
});
