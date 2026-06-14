import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TermsPrivacyConsentModalProps {
  visible: boolean;
  onAccept: () => void | Promise<void>;
  onViewPrivacyPolicy: () => void;
  onViewTerms: () => void;
}

export default function TermsPrivacyConsentModal({
  visible,
  onAccept,
  onViewPrivacyPolicy,
  onViewTerms,
}: TermsPrivacyConsentModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#FFD700" />
            </View>
            <Text style={styles.modalTitle}>Terms & Privacy</Text>
            <Text style={styles.modalSubtitle}>
              Please review our terms and privacy practices
            </Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.zeroToleranceNotice}>
              <View style={styles.zeroToleranceHeader}>
                <Ionicons name="warning" size={20} color="#FF3B30" />
                <Text style={styles.zeroToleranceTitle}>Community Guidelines</Text>
              </View>
              <Text style={styles.zeroToleranceText}>
                We have <Text style={styles.boldText}>zero tolerance</Text> for objectionable content or abusive users.{' '}
                Violations result in immediate account suspension or ban.
              </Text>
            </View>

            <View style={styles.privacySummarySection}>
              <Text style={styles.privacySummaryTitle}>What we collect:</Text>

              <View style={styles.privacyItem}>
                <View style={styles.privacyIconBadge}>
                  <Ionicons name="fitness" size={16} color="#FFD700" />
                </View>
                <View style={styles.privacyItemContent}>
                  <Text style={styles.privacyItemTitle}>Workout Data</Text>
                  <Text style={styles.privacyItemText}>
                    Exercise progress, equipment & difficulty preferences
                  </Text>
                </View>
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyIconBadge}>
                  <Ionicons name="analytics" size={16} color="#FFD700" />
                </View>
                <View style={styles.privacyItemContent}>
                  <Text style={styles.privacyItemTitle}>App Usage</Text>
                  <Text style={styles.privacyItemText}>
                    Session data, navigation patterns to improve experience
                  </Text>
                </View>
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyIconBadge}>
                  <Ionicons name="people" size={16} color="#FFD700" />
                </View>
                <View style={styles.privacyItemContent}>
                  <Text style={styles.privacyItemTitle}>Social Activity</Text>
                  <Text style={styles.privacyItemText}>
                    Posts, likes, comments, and follows (when you use these features)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.privacyNote}>
              <Ionicons name="information-circle" size={18} color="#888" />
              <Text style={styles.privacyNoteText}>
                We never sell your data. Your information is used only to improve your fitness journey.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <View style={styles.policyLinksRow}>
              <TouchableOpacity style={styles.viewPolicyButton} onPress={onViewPrivacyPolicy}>
                <Ionicons name="document-text-outline" size={16} color="#FFD700" />
                <Text style={styles.viewPolicyText}>Privacy Policy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.viewPolicyButton} onPress={onViewTerms}>
                <Ionicons name="reader-outline" size={16} color="#FFD700" />
                <Text style={styles.viewPolicyText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.agreementText}>
              By tapping 'Accept & Continue', you agree to our Terms of Service and Privacy Policy,
              including our zero tolerance policy for objectionable content.
            </Text>

            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.acceptButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalScroll: {
    maxHeight: 280,
  },
  zeroToleranceNotice: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  zeroToleranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  zeroToleranceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF3B30',
  },
  zeroToleranceText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FF6B6B',
  },
  boldText: {
    fontWeight: '700',
  },
  privacySummarySection: {
    marginBottom: 16,
  },
  privacySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  privacyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyItemContent: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  privacyItemText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    lineHeight: 18,
  },
  modalActions: {
    marginTop: 20,
  },
  policyLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  viewPolicyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    gap: 6,
  },
  viewPolicyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  agreementText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
});
