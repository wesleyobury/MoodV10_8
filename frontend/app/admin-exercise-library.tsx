import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';

import { API_URL } from '../utils/apiConfig';

interface Exercise {
  _id: string;
  name: string;
  aliases: string[];
  equipment: string[];
  muscle_group: string;
  thumbnail_url: string;
  video_url: string;
  cues: string[];
  mistakes: string[];
  created_at?: string;
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Abs', 'Glutes', 'Quads', 'Hamstrings', 'Calves',
  'Full Body', 'Compound', 'Cardio', 'Plyometric'
];

export default function AdminExerciseLibrary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    aliases: '',
    equipment: '',
    muscle_group: '',
    thumbnail_url: '',
    video_url: '',
    cue1: '',
    cue2: '',
    cue3: '',
    mistake1: '',
    mistake2: '',
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, [token]);

  const checkAdminAndLoad = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please log in to access this page');
        router.back();
        return;
      }

      // Check admin status using /api/auth/me which returns is_admin_effective
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await response.json();
      
      // Use is_admin_effective which checks username, email, and allowlist
      if (!userData.is_admin_effective) {
        Alert.alert('Access Denied', 'Admin access required');
        router.back();
        return;
      }
      
      setIsAdmin(true);
      loadExercises();
    } catch (error) {
      console.error('Error checking admin:', error);
      Alert.alert('Error', 'Failed to verify admin access');
      router.back();
    }
  };

  const loadExercises = async (search = '') => {
    try {
      setLoading(true);
      
      const url = search 
        ? `${API_URL}/api/admin/exercises?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/admin/exercises`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    // Debounce search
    const timer = setTimeout(() => {
      loadExercises(text);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const openAddModal = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      aliases: '',
      equipment: '',
      muscle_group: '',
      thumbnail_url: '',
      video_url: '',
      cue1: '',
      cue2: '',
      cue3: '',
      mistake1: '',
      mistake2: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      aliases: exercise.aliases.join(', '),
      equipment: exercise.equipment.join(', '),
      muscle_group: exercise.muscle_group || '',
      thumbnail_url: exercise.thumbnail_url,
      video_url: exercise.video_url,
      cue1: exercise.cues[0] || '',
      cue2: exercise.cues[1] || '',
      cue3: exercise.cues[2] || '',
      mistake1: exercise.mistakes[0] || '',
      mistake2: exercise.mistakes[1] || '',
    });
    setModalVisible(true);
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        // Cap exercise-library uploads at 1080p H.264 — matches our delivery
        // ladder (HLS 1080p / MP4 720p) so we never ingest a 4K master.
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        // Create form data for upload
        const formDataUpload = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'video.mov';
        
        formDataUpload.append('file', {
          uri,
          name: filename,
          type: 'video/quicktime',
        } as any);

        const response = await fetch(`${API_URL}/api/admin/exercises/upload-video`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        });

        const data = await response.json();
        
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            video_url: data.video_url,
            thumbnail_url: data.thumbnail_url,
          }));
          Alert.alert('Success', 'Video uploaded successfully!');
        } else {
          Alert.alert('Error', data.detail || 'Failed to upload video');
        }
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const saveExercise = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Exercise name is required');
      return;
    }

    try {
      setSaving(true);
      
      const exerciseData = {
        name: formData.name.trim(),
        aliases: formData.aliases.split(',').map(a => a.trim()).filter(a => a),
        equipment: formData.equipment.split(',').map(e => e.trim()).filter(e => e),
        muscle_group: formData.muscle_group,
        thumbnail_url: formData.thumbnail_url,
        video_url: formData.video_url,
        cues: [formData.cue1, formData.cue2, formData.cue3].filter(c => c.trim()),
        mistakes: [formData.mistake1, formData.mistake2].filter(m => m.trim()),
      };

      console.log('Saving exercise:', exerciseData);

      const url = editingExercise 
        ? `${API_URL}/api/exercises/${editingExercise._id}`
        : `${API_URL}/api/exercises`;
      
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: editingExercise ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exerciseData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        Alert.alert('Success', editingExercise ? 'Exercise updated!' : 'Exercise created!');
        setModalVisible(false);
        loadExercises(searchQuery);
      } else {
        Alert.alert('Error', data.detail || data.message || 'Failed to save exercise');
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = (exercise: Exercise) => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/exercises/${exercise._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              
              const data = await response.json();
              if (data.success) {
                loadExercises(searchQuery);
              } else {
                Alert.alert('Error', data.detail || 'Failed to delete');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadExercises(); }}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{exercises.length} exercises in library</Text>
      </View>

      {/* Exercise List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise._id}
              style={styles.exerciseCard}
              onPress={() => openEditModal(exercise)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseImageContainer}>
                {exercise.thumbnail_url ? (
                  <Image source={{ uri: exercise.thumbnail_url }} style={styles.exerciseImage} />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Ionicons name="videocam-outline" size={24} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                {exercise.video_url && (
                  <View style={styles.videoIndicator}>
                    <Ionicons name="play" size={12} color="#fff" />
                  </View>
                )}
              </View>
              
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {exercise.muscle_group && (
                  <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
                )}
                <Text style={styles.exerciseEquipment}>
                  {exercise.equipment.length > 0 ? exercise.equipment.join(', ') : 'No equipment'}
                </Text>
                <View style={styles.cuesMistakesRow}>
                  <Text style={styles.cueCount}>
                    <Ionicons name="checkmark-circle" size={12} color="#4CAF50" /> {exercise.cues.length} cues
                  </Text>
                  <Text style={styles.mistakeCount}>
                    <Ionicons name="alert-circle" size={12} color="#FF6B6B" /> {exercise.mistakes.length} mistakes
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteExercise(exercise)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header - Fixed at top, outside KeyboardAvoidingView */}
          <SafeAreaView edges={['top']} style={styles.modalHeaderSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalHeaderButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
              </Text>
              <TouchableOpacity onPress={saveExercise} disabled={saving} style={styles.modalHeaderButton}>
                {saving ? (
                  <ActivityIndicator size="small" color="#D4AF37" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Scrollable content with keyboard handling */}
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={true}
            >
              {/* Video Preview with Overlay - Shows how it will look */}
              <View style={styles.previewSection}>
                <TouchableOpacity 
                  style={styles.videoPreviewContainer} 
                  onPress={pickVideo}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#D4AF37" />
                      <Text style={styles.uploadingText}>Uploading video...</Text>
                    </View>
                  ) : formData.thumbnail_url ? (
                    <Image source={{ uri: formData.thumbnail_url }} style={styles.videoThumbnail} />
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.placeholderText}>Tap to upload video</Text>
                    </View>
                  )}
                  
                  {/* Overlay text inputs on preview */}
                  <View style={styles.overlayContent}>
                    {/* Exercise name input overlayed at bottom */}
                    <View style={styles.overlayGradient}>
                      <TextInput
                        style={styles.overlayNameInput}
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        placeholder="Exercise Name"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                      />
                      <TextInput
                        style={styles.overlayEquipmentInput}
                        value={formData.equipment}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, equipment: text }))}
                        placeholder="Equipment (comma separated)"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                      />
                    </View>
                  </View>
                  
                  {/* Upload indicator badge */}
                  {!formData.video_url && !uploading && (
                    <View style={styles.uploadBadge}>
                      <Ionicons name="cloud-upload" size={14} color="#000" />
                      <Text style={styles.uploadBadgeText}>Upload</Text>
                    </View>
                  )}
                  
                  {formData.video_url && (
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#000" />
                      <Text style={styles.uploadBadgeText}>Uploaded</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Muscle Group Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Muscle Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleGroupScroll}>
                  {MUSCLE_GROUPS.map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[
                        styles.muscleGroupChip,
                        formData.muscle_group === group && styles.muscleGroupChipSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, muscle_group: group }))}
                    >
                      <Text style={[
                        styles.muscleGroupText,
                        formData.muscle_group === group && styles.muscleGroupTextSelected
                      ]}>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Aliases */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aliases</Text>
                <Text style={styles.inputHint}>Alternative names for search (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.aliases}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, aliases: text }))}
                  placeholder="e.g., squat, bb squat, back squat"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              {/* Key Cues */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" /> 3 Key Cues
                </Text>
                <Text style={styles.sectionSubtitle}>Form tips for proper execution</Text>
                
                <Text style={styles.inputLabel}>Cue 1</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cue1}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cue1: text }))}
                  placeholder="e.g., Keep chest up and core braced"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <Text style={styles.inputLabel}>Cue 2</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cue2}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cue2: text }))}
                  placeholder="e.g., Drive through heels"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <Text style={styles.inputLabel}>Cue 3</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cue3}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cue3: text }))}
                  placeholder="e.g., Knees track over toes"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              {/* Common Mistakes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" /> 2 Common Mistakes
                </Text>
                <Text style={styles.sectionSubtitle}>What to avoid</Text>
                
                <Text style={styles.inputLabel}>Mistake 1</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mistake1}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, mistake1: text }))}
                  placeholder="e.g., Letting knees cave inward"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <Text style={styles.inputLabel}>Mistake 2</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mistake2}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, mistake2: text }))}
                  placeholder="e.g., Rounding the lower back"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={{ height: 200 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 12,
  },
  exerciseImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 3,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 2,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  cuesMistakesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cueCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  mistakeCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  deleteButton: {
    padding: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeaderSafeArea: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#000',
  },
  modalHeaderButton: {
    minWidth: 60,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  saveText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 200,
  },
  // Preview section styles
  previewSection: {
    marginBottom: 20,
  },
  videoPreviewContainer: {
    width: '100%',
    aspectRatio: 9/16,
    maxHeight: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 8,
  },
  uploadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  uploadingText: {
    color: '#D4AF37',
    fontSize: 14,
    marginTop: 12,
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  overlayGradient: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayNameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    padding: 0,
    marginBottom: 6,
  },
  overlayEquipmentInput: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    padding: 0,
  },
  uploadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.3)',
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontSize: 14,
  },
  uploadedUrl: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  muscleGroupScroll: {
    marginTop: 8,
  },
  muscleGroupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  muscleGroupChipSelected: {
    backgroundColor: '#D4AF37',
  },
  muscleGroupText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  muscleGroupTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
});
