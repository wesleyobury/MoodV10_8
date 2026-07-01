/**
 * /dev/screens — Tier 2 dev tooling. A flat, clickable list that deep-links
 * into any onboarding screen in two taps (DEV pill → target).
 *
 * Hard gates:
 *  • `__DEV__` only. In any production bundle this route redirects home.
 *  • Mock state injection routes through utils/devMocks.ts (auditable single
 *    source). No analytics fire from this screen.
 */
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import { routeForMood, type MoodId } from '../../utils/moodRoute';
import {
  clearDevMocks,
  setDevMockFounding,
  setDevMockMood,
} from '../../utils/devMocks';
import { DEV_TOOLS_ENABLED } from '../../utils/devFlags';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

// ── Mood option sets ────────────────────────────────────────────────────────
const ALL_MOODS: { id: MoodId; label: string }[] = [
  { id: 'sweat', label: 'sweat' },
  { id: 'muscle', label: 'gain_muscle' },
  { id: 'explosive', label: 'explosion' },
  { id: 'lazy', label: 'lazy' },
  { id: 'calisthenics', label: 'calisthenics' },
  { id: 'outdoor', label: 'outdoor' },
];
const MOVEMENT_MOODS = ALL_MOODS.filter((m) => m.id === 'explosive' || m.id === 'lazy');
const EQUIP_MOODS = ALL_MOODS.filter((m) => m.id === 'calisthenics' || m.id === 'outdoor');

type Variant = 'standard' | 'founding';
const VARIANTS: { id: Variant; label: string }[] = [
  { id: 'standard', label: 'new user (standard)' },
  { id: 'founding', label: 'founding-eligible' },
];

// ── Lightweight dropdown (no new deps) ──────────────────────────────────────
function DevSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <>
      <TouchableOpacity style={styles.select} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.selectText} numberOfLines={1}>
          {current?.label ?? value}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            {options.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.modalOption}
                onPress={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                <Text style={[styles.modalOptionText, o.id === value && styles.modalOptionActive]}>
                  {o.label}
                </Text>
                {o.id === value && <Ionicons name="checkmark" size={16} color={COLORS.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ── A single deep-link row ──────────────────────────────────────────────────
function Row({
  label,
  route,
  onPress,
  right,
}: {
  label: string;
  route: string;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowButton} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowRoute}>{route}</Text>
      </TouchableOpacity>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function DevScreens() {
  const router = useRouter();
  const { refreshEntitlement } = useAuth();
  const { openPaywall } = useSubscription();

  // Per-row dropdown selections
  const [introMood, setIntroMood] = useState<MoodId>('sweat');
  const [movementMood, setMovementMood] = useState<MoodId>('explosive');
  const [equipMood, setEquipMood] = useState<MoodId>('calisthenics');
  const [revealVariant, setRevealVariant] = useState<Variant>('standard');
  const [cleared, setCleared] = useState(false);

  // Production: never expose this surface. Dev builds (__DEV__) and opted-in
  // QA builds (EXPO_PUBLIC_DEV_SCREENS=true) pass.
  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;

  const go = (path: string) => router.push(path as any);

  const goMoodIntro = async () => {
    await setDevMockMood(introMood);
    router.push('/mood-intro');
  };

  const goFirstDecision = (mood: MoodId) => {
    const r = routeForMood(mood);
    if (r) router.push({ pathname: r.pathname as any, params: r.params });
  };

  const goRevealPayoff = async () => {
    await setDevMockFounding(revealVariant === 'founding');
    await refreshEntitlement();
    router.push({
      pathname: '/onboarding-funnel/reveal-payoff' as any,
      params: revealVariant === 'founding' ? { __dev_mock_founding: 'true' } : {},
    });
  };

  const handleClear = async () => {
    await clearDevMocks();
    await refreshEntitlement();
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Dev · Screens</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
          <Text style={styles.clearBtnText}>{cleared ? 'Cleared ✓' : 'Clear mock state'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionHeader title="Landing / Auth" />
        <Row label="Landing" route="/" onPress={() => go('/')} />
        <Row label="Login" route="/auth/login" onPress={() => go('/auth/login')} />
        <Row label="Register" route="/auth/register" onPress={() => go('/auth/register')} />

        <SectionHeader title="Onboarding Funnel" />
        <Row label="Intro (cinematic)" route="/onboarding-funnel/intro" onPress={() => go('/onboarding-funnel/intro')} />
        <Row label="Step 1 — Mood" route="/onboarding-funnel/step-1-mood" onPress={() => go('/onboarding-funnel/step-1-mood')} />
        <Row label="Step 2 — Goal" route="/onboarding-funnel/step-2-goal" onPress={() => go('/onboarding-funnel/step-2-goal')} />
        <Row label="Step 3 — Level" route="/onboarding-funnel/step-3-level" onPress={() => go('/onboarding-funnel/step-3-level')} />
        <Row label="Step 4 — Barrier" route="/onboarding-funnel/step-4-barrier" onPress={() => go('/onboarding-funnel/step-4-barrier')} />
        <Row label="Step 5 — Length" route="/onboarding-funnel/step-5-length" onPress={() => go('/onboarding-funnel/step-5-length')} />
        <Row label="Step 6 — Social Proof" route="/onboarding-funnel/step-6-social-proof" onPress={() => go('/onboarding-funnel/step-6-social-proof')} />
        <Row label="Name capture" route="/onboarding-funnel/name" onPress={() => go('/onboarding-funnel/name')} />
        <Row label="Reveal — Loading" route="/onboarding-funnel/reveal-loading" onPress={() => go('/onboarding-funnel/reveal-loading')} />
        <Row
          label="Reveal — Payoff (Soft Paywall #1)"
          route="/onboarding-funnel/reveal-payoff"
          onPress={goRevealPayoff}
          right={<DevSelect value={revealVariant} options={VARIANTS} onChange={setRevealVariant} />}
        />

        <SectionHeader title="Paywalls (modal triggers)" />
        <Row
          label="Soft Paywall #2 (post-workout)"
          route="openPaywall('post_achievement_close_soft')"
          onPress={() => openPaywall('post_achievement_close_soft')}
        />
        <Row
          label="Hard Paywall #3 (workout #2 / cap)"
          route="openPaywall('generate_after_cap')"
          onPress={() => openPaywall('generate_after_cap')}
        />

        <SectionHeader title="Post-Funnel" />
        <Row label="Health Connect (wearables)" route="/onboarding/health-connect" onPress={() => go('/onboarding/health-connect')} />
        <Row
          label="Mood Intro"
          route="/mood-intro"
          onPress={goMoodIntro}
          right={<DevSelect value={introMood} options={ALL_MOODS} onChange={setIntroMood} />}
        />

        <SectionHeader title="Mood First-Decision Screens" />
        <Row
          label="Training Type (sweat)"
          route="/workout-type"
          onPress={() => goFirstDecision('sweat')}
        />
        <Row
          label="Muscle Groups (gain_muscle)"
          route="/body-parts"
          onPress={() => goFirstDecision('muscle')}
        />
        <Row
          label="Movement Type (explosion / lazy)"
          route="/explosiveness-type · /lazy-training-type"
          onPress={() => goFirstDecision(movementMood)}
          right={<DevSelect value={movementMood} options={MOVEMENT_MOODS} onChange={setMovementMood} />}
        />
        <Row
          label="Equipment (calisthenics / outdoor)"
          route="/calisthenics-equipment · /outdoor-equipment"
          onPress={() => goFirstDecision(equipMood)}
          right={<DevSelect value={equipMood} options={EQUIP_MOODS} onChange={setEquipMood} />}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  clearBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rowButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rowRoute: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontFamily: 'SpaceMono',
    marginTop: 3,
  },
  rowRight: { maxWidth: 150 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectText: { fontSize: 12, color: COLORS.textSecondary, flexShrink: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modalSheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalOptionText: { fontSize: 15, color: COLORS.textSecondary },
  modalOptionActive: { color: COLORS.accent, fontWeight: '700' },
});
