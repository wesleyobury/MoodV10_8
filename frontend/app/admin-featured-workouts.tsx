/**
 * Featured Workouts Admin Editor
 * 
 * - View/reorder featured carousel
 * - Create new featured workouts from saved workouts
 * - View workout exercises in cart format
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { API_URL } from '../utils/apiConfig';

interface FeaturedWorkout {
  _id: string;
  title: string;
  mood: string;
  duration?: string;
  badge?: string;
  heroImageUrl?: string;
  difficulty?: string;
  exercises: any[];
  created_at?: string;
}

interface SavedWorkout {
  id: string;
  name: string;
  workouts: any[];
  total_duration: number;
  source?: string;
  mood?: string;
  title?: string;
  created_at: string;
}

interface FeaturedConfig {
  featuredWorkoutIds: string[];
  ttlHours: number;
}

const BADGE_OPTIONS = ['', 'Top pick', 'Trending', 'Popular', 'Staff pick', 'New', 'Intense'];

export default function FeaturedWorkoutsEditor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FeaturedConfig>({ featuredWorkoutIds: [], ttlHours: 12 });
  const [allWorkouts, setAllWorkouts] = useState<FeaturedWorkout[]>([]);
  const [featuredWorkouts, setFeaturedWorkouts] = useState<FeaturedWorkout[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [showAddToFeatured, setShowAddToFeatured] = useState(false);
  const [showCreateFromSaved, setShowCreateFromSaved] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState<FeaturedWorkout | null>(null);
  
  // Create from saved form
  const [selectedSavedWorkout, setSelectedSavedWorkout] = useState<SavedWorkout | null>(null);
  const [newBadge, setNewBadge] = useState('');
  const [newHeroImage, setNewHeroImage] = useState('');

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Fetch featured config
      const configRes = await fetch(`${API_URL}/api/featured/config`);
      const configData = await configRes.json();
      setConfig(configData);
      
      // Fetch all featured workouts (admin)
      const workoutsRes = await fetch(`${API_URL}/api/featured/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (workoutsRes.status === 403) {
        Alert.alert('Access Denied', 'Admin access required.');
        router.back();
        return;
      }
      
      const workoutsData = await workoutsRes.json();
      setAllWorkouts(workoutsData.workouts || []);
      
      // Build featured list in order
      const featuredIds = configData.featuredWorkoutIds || [];
      const workoutMap = new Map((workoutsData.workouts || []).map((w: FeaturedWorkout) => [w._id, w]));
      const orderedFeatured = featuredIds
        .map((id: string) => workoutMap.get(id))
        .filter(Boolean) as FeaturedWorkout[];
      setFeaturedWorkouts(orderedFeatured);
      
      // Fetch admin's saved workouts
      const savedRes = await fetch(`${API_URL}/api/saved-workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedWorkouts(savedData || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Publish featured config
  const handlePublish = async () => {
    if (featuredWorkouts.length === 0) {
      Alert.alert('Error', 'Featured list cannot be empty');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/featured/config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featuredWorkoutIds: featuredWorkouts.map(w => w._id),
          ttlHours: config.ttlHours,
        }),
      });
      
      if (response.ok) {
        setHasChanges(false);
        Alert.alert('Success', 'Featured workouts published!');
        fetchData();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to publish');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  // Reorder
  const handleDragEnd = ({ data }: { data: FeaturedWorkout[] }) => {
    setFeaturedWorkouts(data);
    setHasChanges(true);
  };

  // Remove from featured
  const handleRemoveFromFeatured = (workoutId: string) => {
    Alert.alert('Remove from Featured', 'Remove this workout from the carousel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setFeaturedWorkouts(prev => prev.filter(w => w._id !== workoutId));
          setHasChanges(true);
        },
      },
    ]);
  };

  // Add existing workout to featured
  const handleAddToFeatured = (workout: FeaturedWorkout) => {
    if (featuredWorkouts.find(w => w._id === workout._id)) {
      Alert.alert('Already Featured', 'This workout is already in the featured list.');
      return;
    }
    setFeaturedWorkouts(prev => [...prev, workout]);
    setHasChanges(true);
    setShowAddToFeatured(false);
  };

  // Delete workout
  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert('Delete Workout', 'Permanently delete this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/featured/workouts/${workoutId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.ok) {
              fetchData();
              Alert.alert('Deleted', 'Workout removed');
            } else {
              const errorData = await response.json();
              Alert.alert('Error', errorData.detail || 'Failed to delete');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  // Create featured workout from saved workout
  const handleCreateFromSaved = async () => {
    if (!selectedSavedWorkout) return;
    
    // Get mood from first exercise's moodCard, fallback to parsing from name
    const firstExercise = selectedSavedWorkout.workouts[0];
    const mood = firstExercise?.moodCard || selectedSavedWorkout.name.split(' - ')[0] || 'Workout';
    
    // Title is the full saved workout name (what admin named it)
    const title = selectedSavedWorkout.name;
    
    // Convert saved workout exercises to featured workout format
    const exercises = selectedSavedWorkout.workouts.map((ex, index) => ({
      exerciseId: '',
      order: index,
      name: ex.name || '',
      equipment: ex.equipment || '',
      description: ex.description || '',
      battlePlan: ex.battlePlan || '',
      duration: ex.duration || '',
      imageUrl: ex.imageUrl || '',
      intensityReason: ex.intensityReason || '',
      difficulty: ex.difficulty || 'intermediate',
      workoutType: ex.workoutType || `${mood} - ${title}`,
      moodCard: ex.moodCard || mood,
      moodTips: ex.moodTips || [],
    }));
    
    const workoutData = {
      title,
      mood,
      duration: `${selectedSavedWorkout.total_duration} min`,
      badge: newBadge || undefined,
      difficulty: 'Intermediate',
      heroImageUrl: newHeroImage || exercises[0]?.imageUrl || undefined,
      exercises,
    };
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/featured/workouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });
      
      if (response.ok) {
        setShowCreateFromSaved(false);
        setSelectedSavedWorkout(null);
        setNewBadge('');
        setNewHeroImage('');
        fetchData();
        Alert.alert('Success', 'Featured workout created from saved workout!');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to create');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create workout');
    } finally {
      setSaving(false);
    }
  };

  // Render featured item
  const renderFeaturedItem = ({ item, drag, isActive }: RenderItemParams<FeaturedWorkout>) => (
    <ScaleDecorator>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={drag}
        disabled={isActive}
        style={[styles.featuredItem, isActive && styles.featuredItemActive]}
      >
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three" size={24} color="#666" />
        </View>
        
        <TouchableOpacity 
          style={styles.featuredItemContent}
          onPress={() => setViewingWorkout(item)}
        >
          <Text style={styles.featuredItemTitle} numberOfLines={1}>
            {item.mood} - {item.title}
          </Text>
          <Text style={styles.featuredItemMeta}>
            {item.exercises?.length || 0} exercises • {item.duration || 'No duration'}
          </Text>
          {item.badge && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveFromFeatured(item._id)}
        >
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Featured Workouts</Text>
          <View style={{ width: 80 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Featured Workouts</Text>
          <TouchableOpacity
            onPress={handlePublish}
            disabled={!hasChanges || saving}
            style={[styles.publishButton, (!hasChanges || saving) && styles.publishButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.publishButtonText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        {hasChanges && (
          <View style={styles.changesIndicator}>
            <Ionicons name="alert-circle" size={16} color="#FFD700" />
            <Text style={styles.changesText}>Unsaved changes</Text>
          </View>
        )}

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Featured Carousel */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Carousel Order</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddToFeatured(true)}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hint}>Long press to drag & reorder • Tap to view</Text>
            
            {featuredWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No featured workouts</Text>
              </View>
            ) : (
              <DraggableFlatList
                data={featuredWorkouts}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item._id}
                renderItem={renderFeaturedItem}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* All Featured Workouts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Featured ({allWorkouts.length})</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateFromSaved(true)}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Create from Saved</Text>
              </TouchableOpacity>
            </View>
            
            {allWorkouts.map((workout) => (
              <TouchableOpacity 
                key={workout._id} 
                style={styles.workoutListItem}
                onPress={() => setViewingWorkout(workout)}
              >
                <View style={styles.workoutListContent}>
                  <Text style={styles.workoutListTitle}>{workout.mood} - {workout.title}</Text>
                  <Text style={styles.workoutListMeta}>
                    {workout.exercises?.length || 0} exercises • {workout.duration}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteWorkout(workout._id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {allWorkouts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No featured workouts created yet</Text>
                <Text style={styles.emptyStateHint}>Create one from your saved workouts</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add to Featured Modal */}
        <Modal visible={showAddToFeatured} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 20 : 0 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddToFeatured(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add to Carousel</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {allWorkouts
                .filter(w => !featuredWorkouts.find(f => f._id === w._id))
                .map((workout) => (
                  <TouchableOpacity
                    key={workout._id}
                    style={styles.selectableWorkout}
                    onPress={() => handleAddToFeatured(workout)}
                  >
                    <View style={styles.selectableWorkoutContent}>
                      <Text style={styles.selectableWorkoutTitle}>
                        {workout.mood} - {workout.title}
                      </Text>
                      <Text style={styles.selectableWorkoutMeta}>
                        {workout.exercises?.length || 0} exercises
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#4A90D9" />
                  </TouchableOpacity>
                ))}
              
              {allWorkouts.filter(w => !featuredWorkouts.find(f => f._id === w._id)).length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>All workouts are already in carousel</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Create from Saved Workout Modal */}
        <Modal visible={showCreateFromSaved} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 20 : 0 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowCreateFromSaved(false);
                setSelectedSavedWorkout(null);
                setNewBadge('');
                setNewHeroImage('');
              }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create from Saved</Text>
              {selectedSavedWorkout ? (
                <TouchableOpacity onPress={handleCreateFromSaved} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#4A90D9" />
                  ) : (
                    <Text style={styles.modalSave}>Create</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ width: 60 }} />
              )}
            </View>
            
            <ScrollView style={styles.modalContent}>
              {!selectedSavedWorkout ? (
                <>
                  <Text style={styles.selectLabel}>Select a saved workout:</Text>
                  {savedWorkouts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="bookmark-outline" size={48} color="#666" />
                      <Text style={styles.emptyStateText}>No saved workouts</Text>
                      <Text style={styles.emptyStateHint}>Save workouts from your workout sessions first</Text>
                    </View>
                  ) : (
                    savedWorkouts.map((sw) => (
                      <TouchableOpacity
                        key={sw.id}
                        style={styles.selectableWorkout}
                        onPress={() => setSelectedSavedWorkout(sw)}
                      >
                        <View style={styles.selectableWorkoutContent}>
                          <Text style={styles.selectableWorkoutTitle}>{sw.name}</Text>
                          <Text style={styles.selectableWorkoutMeta}>
                            {sw.workouts?.length || 0} exercises • {sw.total_duration} min
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              ) : (
                <>
                  {/* Selected workout preview */}
                  <View style={styles.selectedPreview}>
                    <Text style={styles.selectedPreviewTitle}>{selectedSavedWorkout.name}</Text>
                    <Text style={styles.selectedPreviewMeta}>
                      {selectedSavedWorkout.workouts?.length || 0} exercises • {selectedSavedWorkout.total_duration} min
                    </Text>
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => setSelectedSavedWorkout(null)}
                    >
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Optional settings */}
                  <Text style={styles.inputLabel}>Badge (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {BADGE_OPTIONS.map((badge) => (
                      <TouchableOpacity
                        key={badge || 'none'}
                        style={[styles.chip, newBadge === badge && styles.chipSelected]}
                        onPress={() => setNewBadge(badge)}
                      >
                        <Text style={[styles.chipText, newBadge === badge && styles.chipTextSelected]}>
                          {badge || 'None'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <Text style={styles.inputLabel}>Hero Image URL (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newHeroImage}
                    onChangeText={setNewHeroImage}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                  />
                  <Text style={styles.inputHint}>
                    Leave empty to use the first exercise's image
                  </Text>
                  
                  {/* Exercises preview */}
                  <Text style={styles.exercisesHeader}>
                    Exercises ({selectedSavedWorkout.workouts?.length || 0})
                  </Text>
                  {selectedSavedWorkout.workouts?.map((ex, index) => (
                    <View key={index} style={styles.exercisePreview}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exercisePreviewContent}>
                        <Text style={styles.exercisePreviewName}>{ex.name}</Text>
                        <Text style={styles.exercisePreviewEquipment}>{ex.equipment}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* View Workout Modal */}
        <Modal visible={!!viewingWorkout} animationType="slide" presentationStyle="fullScreen">
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setViewingWorkout(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {viewingWorkout?.mood} - {viewingWorkout?.title}
              </Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Workout Info */}
              <View style={styles.workoutInfoCard}>
                {viewingWorkout?.heroImageUrl && (
                  <Image 
                    source={{ uri: viewingWorkout.heroImageUrl }} 
                    style={styles.workoutHeroImage}
                  />
                )}
                <View style={styles.workoutInfoContent}>
                  <Text style={styles.workoutInfoTitle}>{viewingWorkout?.title}</Text>
                  <Text style={styles.workoutInfoMood}>{viewingWorkout?.mood}</Text>
                  <View style={styles.workoutInfoRow}>
                    <Text style={styles.workoutInfoMeta}>
                      <Ionicons name="time-outline" size={14} color="#888" /> {viewingWorkout?.duration}
                    </Text>
                    {viewingWorkout?.badge && (
                      <View style={styles.workoutBadge}>
                        <Text style={styles.workoutBadgeText}>{viewingWorkout.badge}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Exercises */}
              <Text style={styles.exercisesHeader}>
                Exercises ({viewingWorkout?.exercises?.length || 0})
              </Text>
              
              {viewingWorkout?.exercises?.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseEquipment}>{exercise.equipment}</Text>
                    
                    {exercise.duration && (
                      <View style={styles.exerciseMetaRow}>
                        <Ionicons name="time-outline" size={12} color="#666" />
                        <Text style={styles.exerciseMetaText}>{exercise.duration}</Text>
                      </View>
                    )}
                    
                    {exercise.description && (
                      <Text style={styles.exerciseDescription} numberOfLines={2}>
                        {exercise.description}
                      </Text>
                    )}
                    
                    {exercise.battlePlan && (
                      <View style={styles.battlePlanContainer}>
                        <Text style={styles.battlePlanLabel}>Battle Plan:</Text>
                        <Text style={styles.battlePlanText}>{exercise.battlePlan}</Text>
                      </View>
                    )}
                  </View>
                  
                  {exercise.imageUrl && (
                    <Image 
                      source={{ uri: exercise.imageUrl }} 
                      style={styles.exerciseImage}
                    />
                  )}
                </View>
              ))}
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  publishButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#333',
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  changesText: {
    color: '#FFD700',
    fontSize: 13,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 15,
    marginTop: 8,
  },
  emptyStateHint: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  featuredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  featuredItemActive: {
    backgroundColor: '#222',
    borderColor: '#4A90D9',
  },
  dragHandle: {
    paddingRight: 8,
  },
  featuredItemContent: {
    flex: 1,
    paddingRight: 8,
  },
  featuredItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  featuredItemMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    padding: 4,
  },
  workoutListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  workoutListContent: {
    flex: 1,
  },
  workoutListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  workoutListMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalCancel: {
    fontSize: 16,
    color: '#888',
  },
  modalSave: {
    fontSize: 16,
    color: '#4A90D9',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  selectableWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectableWorkoutContent: {
    flex: 1,
  },
  selectableWorkoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  selectableWorkoutMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  
  // Create from saved
  selectedPreview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4A90D9',
  },
  selectedPreviewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  selectedPreviewMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  changeButton: {
    marginTop: 12,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipSelected: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  chipText: {
    color: '#999',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  exercisesHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  exercisePreviewContent: {
    flex: 1,
  },
  exercisePreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  exercisePreviewEquipment: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  
  // View workout
  workoutInfoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  workoutHeroImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#222',
  },
  workoutInfoContent: {
    padding: 16,
  },
  workoutInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  workoutInfoMood: {
    fontSize: 14,
    color: '#4A90D9',
    marginTop: 4,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  workoutInfoMeta: {
    fontSize: 13,
    color: '#888',
  },
  workoutBadge: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  workoutBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseEquipment: {
    fontSize: 13,
    color: '#4A90D9',
    marginTop: 2,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 12,
    color: '#666',
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    lineHeight: 16,
  },
  battlePlanContainer: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  battlePlanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A90D9',
    marginBottom: 4,
  },
  battlePlanText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#222',
    marginLeft: 12,
  },
});
