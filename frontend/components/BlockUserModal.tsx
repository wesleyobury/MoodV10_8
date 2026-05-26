import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  token: string | null;
  onBlockSuccess?: () => void;
}

export default function BlockUserModal({
  visible,
  onClose,
  userId,
  username,
  token,
  onBlockSuccess,
}: BlockUserModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');

  const handleBlock = async () => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/moderation/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blocked_user_id: userId,
          reason: reason || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        onBlockSuccess?.();
      } else {
        Alert.alert('Error', data.detail || 'Failed to block user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setStep('confirm');
    onClose();
  };

  const renderConfirmStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="ban-outline" size={48} color="#FF4444" />
      </View>
      
      <Text style={styles.title}>Block @{username}?</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>When you block someone:</Text>
        <View style={styles.infoBullet}>
          <Ionicons name="checkmark" size={16} color="#FFD700" />
          <Text style={styles.bulletText}>They won't be able to see your posts or profile</Text>
        </View>
        <View style={styles.infoBullet}>
          <Ionicons name="checkmark" size={16} color="#FFD700" />
          <Text style={styles.bulletText}>You won't see their posts or profile</Text>
        </View>
        <View style={styles.infoBullet}>
          <Ionicons name="checkmark" size={16} color="#FFD700" />
          <Text style={styles.bulletText}>Any existing follows will be removed</Text>
        </View>
        <View style={styles.infoBullet}>
          <Ionicons name="checkmark" size={16} color="#FFD700" />
          <Text style={styles.bulletText}>Our team will be notified</Text>
        </View>
      </View>

      <TextInput
        style={styles.reasonInput}
        placeholder="Reason for blocking (optional)..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={2}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.blockButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleBlock}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.blockButtonText}>Block</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>User Blocked</Text>
      <Text style={styles.successText}>
        @{username} has been blocked. They will no longer appear in your feed and won't be able to interact with your content.
      </Text>
      <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {step === 'confirm' && renderConfirmStep()}
          {step === 'success' && renderSuccessStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontWeight: '600',
  },
  infoBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  reasonInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: 'white',
    fontSize: 14,
    minHeight: 60,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  blockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
