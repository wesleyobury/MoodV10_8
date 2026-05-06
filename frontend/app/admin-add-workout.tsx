import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

const MOODS = ['Muscle Gainer', 'Sweat', 'Explosion', "I'm Feeling Lazy", 'Outdoors', 'Calisthenics'];
const MUSCLES_BY_MOOD: Record<string, string[]> = {
  'Muscle Gainer': ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Abs'],
  'Sweat': [''],
  'Explosion': [''],
  "I'm Feeling Lazy": [''],
  'Outdoors': [''],
  'Calisthenics': [''],
};
const CATEGORIES = ['Compound', 'Isolation', 'Mixed'];
const EQUIPMENTS = ['Dumbbells', 'Squat Rack', 'Cables', 'Smith Machine', 'Barbell', 'Bodyweight', 'Bench', 'Kettlebells'];
const INTENSITIES: ('beginner' | 'intermediate' | 'advanced')[] = ['beginner', 'intermediate', 'advanced'];
const TIP_ICONS = ['flash', 'flame', 'pulse', 'body', 'time', 'trending-down', 'footsteps', 'barbell', 'repeat', 'arrow-forward', 'flag'];

interface MoodTip { icon: string; title: string; description: string; }

export default function AdminAddWorkout() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [mood, setMood] = useState(MOODS[0]);
  const [muscle, setMuscle] = useState('Legs');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [equipment, setEquipment] = useState(EQUIPMENTS[0]);
  const [intensity, setIntensity] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [battlePlan, setBattlePlan] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [intensityReason, setIntensityReason] = useState('');

  const [tips, setTips] = useState<MoodTip[]>([{ icon: 'flash', title: '', description: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const muscleOptions = useMemo(() => MUSCLES_BY_MOOD[mood] || [''], [mood]);

  const updateTip = (i: number, key: keyof MoodTip, val: string) => {
    setTips((prev) => prev.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)));
  };
  const addTip = () => setTips((prev) => [...prev, { icon: 'flash', title: '', description: '' }]);
  const removeTip = (i: number) => setTips((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!name.trim() || !duration.trim() || !description.trim() || !battlePlan.trim()) {
      Alert.alert('Missing fields', 'Name, Duration, Description and Battle Plan are required.');
      return;
    }
    setSubmitting(true);
    try {
      const cleanedTips = tips
        .map((t) => ({ icon: t.icon, title: t.title.trim(), description: t.description.trim() }))
        .filter((t) => t.title || t.description);

      const resp = await fetch(`${API_URL}/api/admin/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood, muscle, category, equipment, intensity,
          name: name.trim(),
          duration: duration.trim(),
          description: description.trim(),
          battlePlan,
          imageUrl: imageUrl.trim(),
          intensityReason: intensityReason.trim(),
          moodTips: cleanedTips,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({} as any));
        throw new Error(err?.detail || `HTTP ${resp.status}`);
      }
      Alert.alert('Workout added', 'It will appear in the matching carousel after a refresh.', [
        { text: 'Add another', onPress: () => {
          setName(''); setDuration(''); setDescription(''); setBattlePlan(''); setImageUrl('');
          setIntensityReason(''); setTips([{ icon: 'flash', title: '', description: '' }]);
        }},
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not save workout.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderChipRow = <T extends string>(values: readonly T[], current: T, onSelect: (v: T) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {values.map((v) => (
        <TouchableOpacity
          key={v}
          onPress={() => onSelect(v)}
          style={[styles.chip, current === v && styles.chipActive]}
        >
          <Text style={[styles.chipText, current === v && styles.chipTextActive]}>{v || '—'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} testID="admin-add-workout-back">
          <Ionicons name="chevron-back" size={26} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Workout</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Mood</Text>
        {renderChipRow(MOODS, mood, setMood)}

        <Text style={styles.label}>Muscle group</Text>
        {renderChipRow(muscleOptions as string[], muscle, setMuscle)}

        <Text style={styles.label}>Category</Text>
        {renderChipRow(CATEGORIES, category, setCategory)}

        <Text style={styles.label}>Equipment</Text>
        {renderChipRow(EQUIPMENTS, equipment, setEquipment)}

        <Text style={styles.label}>Intensity</Text>
        {renderChipRow(INTENSITIES, intensity, setIntensity as any)}

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Tempo Step-Ups"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          testID="admin-workout-name"
        />

        <Text style={styles.label}>Duration *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 14–16 min"
          placeholderTextColor="#555"
          value={duration}
          onChangeText={setDuration}
          testID="admin-workout-duration"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Short blurb about this workout."
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          testID="admin-workout-description"
        />

        <Text style={styles.label}>Battle Plan *</Text>
        <TextInput
          style={[styles.input, styles.multiline, { minHeight: 90 }]}
          placeholder={'e.g. 4 rounds\n• 8 per leg (3s down)\nRest 90s'}
          placeholderTextColor="#555"
          value={battlePlan}
          onChangeText={setBattlePlan}
          multiline
          testID="admin-workout-battleplan"
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#555"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
          testID="admin-workout-image"
        />

        <Text style={styles.label}>Why this intensity</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="One-line rationale, optional"
          placeholderTextColor="#555"
          value={intensityReason}
          onChangeText={setIntensityReason}
          multiline
          testID="admin-workout-intensity-reason"
        />

        <Text style={[styles.label, { marginTop: 18 }]}>MOOD Tips</Text>
        {tips.map((tip, i) => (
          <View key={i} style={styles.tipBlock}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipIndex}>Tip {i + 1}</Text>
              {tips.length > 1 && (
                <TouchableOpacity onPress={() => removeTip(i)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { marginVertical: 6 }]}>
              {TIP_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => updateTip(i, 'icon', ic)}
                  style={[styles.iconChip, tip.icon === ic && styles.iconChipActive]}
                >
                  <Ionicons name={ic as any} size={16} color={tip.icon === ic ? '#0c0c0c' : '#bbb'} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#555"
              value={tip.title}
              onChangeText={(t) => updateTip(i, 'title', t)}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Description"
              placeholderTextColor="#555"
              value={tip.description}
              onChangeText={(t) => updateTip(i, 'description', t)}
            />
          </View>
        ))}

        <TouchableOpacity onPress={addTip} style={styles.addTipBtn} testID="admin-add-tip-btn">
          <Ionicons name="add" size={16} color="#FFD700" />
          <Text style={styles.addTipText}>Add another tip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          testID="admin-add-workout-submit"
        >
          <Text style={styles.submitText}>{submitting ? 'Saving…' : 'Save workout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#111',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  label: { color: '#bbb', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#222', backgroundColor: '#0c0c0c' },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#bbb', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#0c0c0c' },
  input: {
    backgroundColor: '#0c0c0c',
    borderWidth: 1,
    borderColor: '#1c1c1c',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  tipBlock: { backgroundColor: '#080808', borderWidth: 1, borderColor: '#161616', borderRadius: 12, padding: 12, marginBottom: 10 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tipIndex: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  iconChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c0c0c', borderWidth: 1, borderColor: '#1c1c1c' },
  iconChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  addTipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  addTipText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },
  submit: { marginTop: 22, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  submitText: { color: '#0c0c0c', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
});
