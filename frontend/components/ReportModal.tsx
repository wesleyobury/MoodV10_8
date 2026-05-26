import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment' | 'profile';
  contentId: string;
  token: string | null;
}

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'Spam', icon: 'mail-unread-outline' },
  { id: 'harassment_bullying', label: 'Harassment/Bullying', icon: 'hand-left-outline' },
  { id: 'hate_speech', label: 'Hate Speech', icon: 'alert-circle-outline' },
  { id: 'nudity_sexual_content', label: 'Nudity/Sexual Content', icon: 'eye-off-outline' },
  { id: 'violence', label: 'Violence', icon: 'warning-outline' },
  { id: 'misinformation', label: 'Misinformation', icon: 'information-circle-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function ReportModal({
  visible,
  onClose,
  contentType,
  contentId,
  token,
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');

  const handleSubmit = async () => {
    if (!selectedCategory || !token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/moderation/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          category: selectedCategory,
          reason: additionalDetails || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        Alert.alert('Error', data.detail || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setAdditionalDetails('');
    setStep('select');
    onClose();
  };

  const renderSelectStep = () => (
    <>
      <Text style={styles.title}>Report {contentType}</Text>
      <Text style={styles.subtitle}>Why are you reporting this {contentType}?</Text>
      
      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {REPORT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && styles.categoryItemSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <View style={styles.categoryLeft}>
              <Ionicons
                name={category.icon as any}
                size={24}
                color={selectedCategory === category.id ? '#FFD700' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
            </View>
            {selectedCategory === category.id && (
              <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, !selectedCategory && styles.submitButtonDisabled]}
        onPress={() => setStep('details')}
        disabled={!selectedCategory}
      >
        <Text style={styles.submitButtonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderDetailsStep = () => (
    <>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('select')}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Additional Details</Text>
      <Text style={styles.subtitle}>
        Help us understand the issue better (optional)
      </Text>

      <TextInput
        style={styles.detailsInput}
        placeholder="Describe why this content is inappropriate..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={additionalDetails}
        onChangeText={setAdditionalDetails}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>Report Submitted</Text>
      <Text style={styles.successText}>
        Thank you for helping keep our community safe. Our team will review this report within 24 hours.
      </Text>
      <TouchableOpacity style={styles.submitButton} onPress={handleClose}>
        <Text style={styles.submitButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {step === 'select' && renderSelectStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'success' && renderSuccessStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesList: {
    maxHeight: 350,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  categoryLabelSelected: {
    color: '#FFD700',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 15,
    minHeight: 120,
    marginTop: 10,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
