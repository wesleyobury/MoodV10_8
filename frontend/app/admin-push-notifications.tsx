import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';

interface FeaturedWorkout {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  mood?: string;
}

export default function AdminPushNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Push form state
  const [pushType, setPushType] = useState<'featured_workout' | 'featured_suggestion' | 'custom'>('featured_suggestion');
  // V2.1 custom-push composer: attach a built cart to a fully authored push.
  const [attachCart, setAttachCart] = useState(false);
  // V2.1 — audience selection. The composer previously had no targeting at all:
  // every custom push went to every non-banned user, so an announcement meant
  // for one segment (pricing news for non-subscribers) could not be sent
  // without spamming paying customers with an offer they already have.
  const [segment, setSegment] = useState<string>('all');
  const [segments, setSegments] = useState<{ segment: string; description: string; size?: number }[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<FeaturedWorkout | null>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  
  // Data
  const [featuredWorkouts, setFeaturedWorkouts] = useState<FeaturedWorkout[]>([]);
  const [copyLibrary, setCopyLibrary] = useState<string[]>([]);
  const [selectedCopyIndex, setSelectedCopyIndex] = useState<number | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  useEffect(() => {
    checkAuthorization();
    fetchCopyLibrary();
  }, [token, user]);

  useEffect(() => {
    if (isAuthorized) {
      // Live segment sizes, so a blast can be sized BEFORE it goes out.
      fetch(`${API_URL}/api/admin/notifications/segments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d?.segments) setSegments(d.segments); })
        .catch(() => {});
    }
    if (isAuthorized && (pushType === 'featured_workout' || (pushType === 'custom' && attachCart))) {
      fetchFeaturedWorkouts();
    }
  }, [isAuthorized, pushType, attachCart]);

  const checkAuthorization = async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthorized(data.is_admin === true);
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedWorkouts = async () => {
    setLoadingWorkouts(true);
    try {
      const response = await fetch(`${API_URL}/api/featured/workouts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map the response to our interface
        const workouts = (data.workouts || []).map((w: any) => ({
          id: w._id,
          name: w.title,
          description: w.subtitle,
          image_url: w.heroImageUrl,
          mood: w.mood,
        }));
        setFeaturedWorkouts(workouts);
      }
    } catch (error) {
      console.error('Error fetching featured workouts:', error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const fetchCopyLibrary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/copy-library`);
      if (response.ok) {
        const data = await response.json();
        setCopyLibrary(data.copy || []);
      }
    } catch (error) {
      console.error('Error fetching copy library:', error);
    }
  };

  const sendPush = async () => {
    if (pushType === 'featured_workout' && !selectedWorkout) {
      Alert.alert('Error', 'Please select a featured workout');
      return;
    }
    if (pushType === 'custom') {
      if (!customTitle.trim() || !customBody.trim()) {
        Alert.alert('Error', 'A custom push needs both a title and a body');
        return;
      }
      if (attachCart && !selectedWorkout) {
        Alert.alert('Error', 'Pick a workout to attach, or turn off "Attach a cart"');
        return;
      }
    }

    setSending(true);
    
    try {
      const endpoint =
        pushType === 'custom'
          ? '/api/admin/notifications/custom'
          : pushType === 'featured_workout'
          ? '/api/admin/notifications/featured-workout'
          : '/api/admin/notifications/featured-suggestion';
      
      const body = pushType === 'custom'
        ? {
            title: customTitle.trim(),
            body: customBody.trim(),
            featured_workout_id: attachCart && selectedWorkout ? selectedWorkout.id : null,
            segment,
          }
        : pushType === 'featured_workout'
        ? { 
            workout_id: selectedWorkout!.id, 
            workout_name: selectedWorkout!.name,
            workout_image: selectedWorkout!.image_url,
            custom_title: customTitle || null,
            custom_body: customBody || null
          }
        : { custom_copy: customCopy || null };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Success',
          // The custom endpoint returns a full delivery report (sent /
          // opted-out / failed) rather than a bare count, so a blast that
          // reached almost nobody can't read as a success.
          data.message || `${data.notifications_sent} notifications sent!`,
          [{ text: 'OK', onPress: () => {
            setSelectedWorkout(null);
            setCustomCopy('');
            setCustomTitle('');
            setCustomBody('');
            setSelectedCopyIndex(null);
            setAttachCart(false);
          }}]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending push:', error);
      Alert.alert('Error', 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isAuthorized) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color="#666" />
        <Text style={styles.unauthorizedText}>Admin access required</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                pushType === 'featured_suggestion' && styles.typeButtonActive,
              ]}
              onPress={() => setPushType('featured_suggestion')}
            >
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={pushType === 'featured_suggestion' ? '#0c0c0c' : '#888'} 
              />
              <Text style={[
                styles.typeButtonText,
                pushType === 'featured_suggestion' && styles.typeButtonTextActive,
              ]}>
                Featured Suggestion
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                pushType === 'featured_workout' && styles.typeButtonActive,
              ]}
              onPress={() => setPushType('featured_workout')}
            >
              <Ionicons 
                name="flash" 
                size={20} 
                color={pushType === 'featured_workout' ? '#0c0c0c' : '#888'} 
              />
              <Text style={[
                styles.typeButtonText,
                pushType === 'featured_workout' && styles.typeButtonTextActive,
              ]}>
                Featured Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                pushType === 'custom' && styles.typeButtonActive,
              ]}
              onPress={() => setPushType('custom')}
            >
              <Ionicons
                name="create"
                size={20}
                color={pushType === 'custom' ? '#0c0c0c' : '#888'}
              />
              <Text style={[
                styles.typeButtonText,
                pushType === 'custom' && styles.typeButtonTextActive,
              ]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Custom composer (V2.1) ───────────────────────────── */}
        {pushType === 'custom' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <TextInput
              style={styles.customCopyInput}
              placeholder="Notification title"
              placeholderTextColor="#666"
              value={customTitle}
              onChangeText={setCustomTitle}
              maxLength={120}
            />
            <Text style={styles.charCount}>{customTitle.length}/120</Text>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Body</Text>
            <TextInput
              style={[styles.customCopyInput, styles.customBodyInput]}
              placeholder="Notification body"
              placeholderTextColor="#666"
              value={customBody}
              onChangeText={setCustomBody}
              maxLength={400}
              multiline
            />
            <Text style={styles.charCount}>{customBody.length}/400</Text>

            <Text style={styles.segLabel}>Audience</Text>
            <View style={styles.segWrap}>
              {(segments.length
                ? segments
                : [{ segment: 'all', description: 'Every non-banned user.' }]
              ).map(sg => {
                const active = segment === sg.segment;
                return (
                  <TouchableOpacity
                    key={sg.segment}
                    style={[styles.segChip, active && styles.segChipOn]}
                    onPress={() => setSegment(sg.segment)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segChipText, active && styles.segChipTextOn]}>
                      {sg.segment.replace(/_/g, ' ')}
                      {typeof sg.size === 'number' ? `  ${sg.size}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.attachHint}>
              {segments.find(x => x.segment === segment)?.description || ''}
            </Text>

            <TouchableOpacity
              style={styles.attachRow}
              onPress={() => {
                const next = !attachCart;
                setAttachCart(next);
                if (!next) setSelectedWorkout(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={attachCart ? 'checkbox' : 'square-outline'}
                size={22}
                color={attachCart ? '#FFD700' : '#666'}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.attachLabel}>Attach a cart</Text>
                <Text style={styles.attachHint}>
                  Tapping the notification opens the app with this workout
                  preloaded, one tap from Begin Workout.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Workout Selection — also the cart picker for custom pushes */}
        {(pushType === 'featured_workout' || (pushType === 'custom' && attachCart)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Featured Workout</Text>
            {loadingWorkouts ? (
              <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 20 }} />
            ) : featuredWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={32} color="#666" />
                <Text style={styles.emptyStateText}>No active featured workouts</Text>
              </View>
            ) : (
              <View style={styles.workoutList}>
                {featuredWorkouts.map((workout) => (
                  <TouchableOpacity
                    key={workout.id}
                    style={[
                      styles.workoutItem,
                      selectedWorkout?.id === workout.id && styles.workoutItemSelected,
                    ]}
                    onPress={() => setSelectedWorkout(workout)}
                  >
                    <View style={styles.workoutItemContent}>
                      <View style={styles.workoutItemIcon}>
                        <Ionicons 
                          name="flash" 
                          size={18} 
                          color={selectedWorkout?.id === workout.id ? '#FFD700' : '#888'} 
                        />
                      </View>
                      <View style={styles.workoutItemInfo}>
                        <Text style={[
                          styles.workoutItemName,
                          selectedWorkout?.id === workout.id && styles.workoutItemNameSelected,
                        ]}>
                          {workout.name}
                        </Text>
                        {workout.mood && (
                          <Text style={styles.workoutItemMood}>{workout.mood}</Text>
                        )}
                      </View>
                    </View>
                    {selectedWorkout?.id === workout.id && (
                      <Ionicons name="checkmark-circle" size={22} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Custom Title/Body for featured workout push */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Custom Push Copy (optional)</Text>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Leave blank for random copy from library</Text>
            <TextInput
              style={[styles.customCopyInput, { marginBottom: 10 }]}
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Custom title (e.g. workout name)"
              placeholderTextColor="#666"
            />
            <TextInput
              style={[styles.customCopyInput, { minHeight: 60 }]}
              value={customBody}
              onChangeText={setCustomBody}
              placeholder="Custom body (exact copy for banner)"
              placeholderTextColor="#666"
              multiline
            />
          </View>
        )}

        {/* Featured Suggestion Form */}
        {pushType === 'featured_suggestion' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Message</Text>
            <View style={styles.copyLibrary}>
              {copyLibrary.map((copy, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.copyItem,
                    selectedCopyIndex === index && styles.copyItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCopyIndex(index);
                    setCustomCopy(copy);
                  }}
                >
                  <Text style={[
                    styles.copyItemText,
                    selectedCopyIndex === index && styles.copyItemTextSelected,
                  ]}>
                    {copy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIcon}>
                <Ionicons 
                  name={pushType === 'featured_workout' ? 'flash' : 'sparkles'} 
                  size={16} 
                  color="#FFD700" 
                />
              </View>
              <Text style={styles.previewTitle}>
                {pushType === 'custom'
                  ? (customTitle || 'Your title')
                  : pushType === 'featured_workout'
                  ? (customTitle || (selectedWorkout ? selectedWorkout.name : 'New Featured Workout'))
                  : 'MOOD'}
              </Text>
            </View>
            <Text style={styles.previewBody}>
              {pushType === 'custom'
                ? (customBody || 'Your body text')
                : pushType === 'featured_workout' 
                ? (customBody || (selectedWorkout ? `"${selectedWorkout.name}" just dropped` : 'Select a workout above'))
                : (customCopy || 'Select a message above')}
            </Text>
            <Text style={styles.previewDeepLink}>
              {pushType === 'custom'
                ? (attachCart
                    ? (selectedWorkout
                        ? `→ Opens cart preloaded with "${selectedWorkout.name}"`
                        : '→ Pick a workout to attach')
                    : '→ Opens home screen')
                : pushType === 'featured_workout' 
                ? '→ Opens workout cart' 
                : '→ Opens home screen'}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={sendPush}
          disabled={
            sending ||
            (pushType === 'featured_workout' && !selectedWorkout) ||
            (pushType === 'featured_suggestion' && !customCopy) ||
            (pushType === 'custom' &&
              (!customTitle.trim() || !customBody.trim() || (attachCart && !selectedWorkout)))
          }
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#0c0c0c" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#0c0c0c" />
                <Text style={styles.sendButtonText}>Send to All Users</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This will send a push notification to all users who have notifications enabled.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  typeButtonTextActive: {
    color: '#0c0c0c',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  workoutList: {
    gap: 8,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  workoutItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  workoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutItemInfo: {
    flex: 1,
  },
  workoutItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  workoutItemNameSelected: {
    color: '#FFD700',
  },
  workoutItemMood: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  copyLibrary: {
    gap: 8,
  },
  copyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  copyItemSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  copyItemText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  copyItemTextSelected: {
    color: '#FFD700',
  },
  customCopyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  previewBody: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginLeft: 38,
  },
  previewDeepLink: {
    fontSize: 12,
    color: '#666',
    marginLeft: 38,
    marginTop: 8,
    fontStyle: 'italic',
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c0c0c',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
  },
  customBodyInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  segLabel: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 18, marginBottom: 8 },
  segWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segChip: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  segChipOn: { backgroundColor: 'rgba(255,215,0,0.14)', borderColor: 'rgba(255,215,0,0.5)' },
  segChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },
  segChipTextOn: { color: '#FFD700' },
  attachLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  attachHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 17,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
