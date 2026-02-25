import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  const [pushType, setPushType] = useState<'featured_workout' | 'featured_suggestion'>('featured_suggestion');
  const [selectedWorkout, setSelectedWorkout] = useState<FeaturedWorkout | null>(null);
  const [customCopy, setCustomCopy] = useState('');
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
    if (isAuthorized && pushType === 'featured_workout') {
      fetchFeaturedWorkouts();
    }
  }, [isAuthorized, pushType]);

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

    setSending(true);
    
    try {
      const endpoint = pushType === 'featured_workout' 
        ? '/api/admin/notifications/featured-workout'
        : '/api/admin/notifications/featured-suggestion';
      
      const body = pushType === 'featured_workout'
        ? { 
            workout_id: selectedWorkout!.id, 
            workout_name: selectedWorkout!.name,
            workout_image: selectedWorkout!.image_url 
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
          `${data.notifications_sent} notifications sent!`,
          [{ text: 'OK', onPress: () => {
            setSelectedWorkout(null);
            setCustomCopy('');
            setSelectedCopyIndex(null);
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
          </View>
        </View>

        {/* Featured Workout Selection */}
        {pushType === 'featured_workout' && (
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
                {pushType === 'featured_workout' ? 'New Featured Workout' : 'MOOD'}
              </Text>
            </View>
            <Text style={styles.previewBody}>
              {pushType === 'featured_workout' 
                ? (selectedWorkout ? `"${selectedWorkout.name}" just dropped` : 'Select a workout above')
                : (customCopy || 'Select a message above')}
            </Text>
            <Text style={styles.previewDeepLink}>
              {pushType === 'featured_workout' 
                ? '→ Opens workout cart' 
                : '→ Opens home screen'}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={sendPush}
          disabled={sending || (pushType === 'featured_workout' && !selectedWorkout) || (pushType === 'featured_suggestion' && !customCopy)}
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
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
