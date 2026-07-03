import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface TermsAcceptanceModalProps {
  visible: boolean;
  onAccept: () => Promise<void>;
  isLoading?: boolean;
}

export default function TermsAcceptanceModal({ 
  visible, 
  onAccept, 
  isLoading = false 
}: TermsAcceptanceModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    if (!agreed || submitting) return;
    
    setSubmitting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openTermsOfService = () => {
    router.push('/terms-of-service');
  };

  const openPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const openCommunityGuidelines = () => {
    router.push('/community-guidelines');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>End User License Agreement</Text>
            <Text style={styles.subtitle}>Please review and accept to continue</Text>
            <Text style={styles.lastUpdated}>Last Updated: June 2026</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            
            {/* License Grant */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>1. License Grant</Text>
              <Text style={styles.eulaText}>
                We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes in accordance with this Agreement.
              </Text>
              <Text style={styles.eulaText}>
                We reserve the right to revoke this license at any time for violations of this Agreement or our Terms of Service.
              </Text>
            </View>

            {/* Restrictions */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>2. Restrictions</Text>
              <Text style={styles.eulaText}>You may NOT:</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Copy, modify, reverse engineer, decompile, or distribute the App</Text>
                <Text style={styles.bulletItem}>• Circumvent security, moderation, or safety systems</Text>
                <Text style={styles.bulletItem}>• Automate access, scrape content, or interfere with platform integrity</Text>
                <Text style={styles.bulletItem}>• Use the App for unlawful, abusive, or harmful purposes</Text>
              </View>
            </View>

            {/* Zero Tolerance */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>3. User-Generated Content & Zero Tolerance</Text>
              <Text style={styles.eulaTextBold}>
                The App includes user-generated content. We maintain zero tolerance for objectionable or abusive content.
              </Text>
              <Text style={styles.eulaText}>You agree that you will not upload, post, or engage with:</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Pornographic or sexually explicit content</Text>
                <Text style={styles.bulletItem}>• Harassment, hate speech, or threats</Text>
                <Text style={styles.bulletItem}>• Content involving minors</Text>
                <Text style={styles.bulletItem}>• Violent, illegal, or exploitative material</Text>
                <Text style={styles.bulletItem}>• Attempts to evade moderation or enforcement</Text>
              </View>
              <Text style={styles.eulaTextBold}>
                Violations may result in immediate termination without notice.
              </Text>
            </View>

            {/* Moderation */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>4. Moderation & Enforcement</Text>
              <Text style={styles.eulaText}>We reserve the right to:</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Monitor and review content</Text>
                <Text style={styles.bulletItem}>• Remove content at our sole discretion</Text>
                <Text style={styles.bulletItem}>• Suspend or terminate accounts</Text>
                <Text style={styles.bulletItem}>• Report illegal activity to authorities</Text>
              </View>
              <Text style={styles.eulaText}>
                You acknowledge that enforcement decisions are final.
              </Text>
            </View>

            {/* Health Disclaimer */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>5. Health & Fitness Disclaimer</Text>
              <Text style={styles.eulaText}>
                The App provides general fitness information only and does NOT provide medical advice.
              </Text>
              <Text style={styles.eulaText}>
                You assume all risks associated with physical activity. Consult a qualified healthcare professional before beginning any exercise program.
              </Text>
            </View>

            {/* Subscriptions & Billing */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>6. Subscriptions & Billing</Text>
              <Text style={styles.eulaText}>
                The App offers auto-renewing subscriptions through Apple. All billing is handled by Apple, and Apple processes your payment information.
              </Text>
              <Text style={styles.eulaText}>
                Subscription options may include:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• MOOD Monthly — $9.99 per month</Text>
                <Text style={styles.bulletItem}>• MOOD Annual — $79.99 per year</Text>
                <Text style={styles.bulletItem}>• Founding Member Annual — $39 per year</Text>
              </View>
              <Text style={styles.eulaText}>
                Subscriptions renew automatically unless canceled at least 24 hours before the end of the current billing period. Manage and cancel subscriptions through your Apple ID account settings.
              </Text>
              <Text style={styles.eulaText}>
                We may receive subscription status and entitlement information from Apple so we can grant access to premium features, but we do not receive your payment credentials.
              </Text>
            </View>

            {/* No Warranty */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>7. No Warranty</Text>
              <Text style={styles.eulaTextCaps}>
                THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
              </Text>
            </View>

            {/* Limitation of Liability */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>8. Limitation of Liability</Text>
              <Text style={styles.eulaTextCaps}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM YOUR USE OF THE APP, INCLUDING PERSONAL INJURY.
              </Text>
            </View>

            {/* Termination */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>9. Termination</Text>
              <Text style={styles.eulaText}>
                This Agreement remains effective until terminated. We may terminate it at any time if you violate its terms. Upon termination, all rights granted to you cease immediately.
              </Text>
            </View>

            {/* Apple Disclaimer */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>10. Apple Disclaimer</Text>
              <Text style={styles.eulaText}>
                This Agreement is between you and MOOD, not Apple. Apple is not responsible for the App or its content and has no obligation to provide support.
              </Text>
            </View>

            {/* Governing Law */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>11. Governing Law</Text>
              <Text style={styles.eulaText}>
                This Agreement is governed by the laws of the United States and the State of Texas, without regard to conflict-of-law principles.
              </Text>
            </View>

            {/* Entire Agreement */}
            <View style={styles.eulaSection}>
              <Text style={styles.eulaSectionTitle}>12. Entire Agreement</Text>
              <Text style={styles.eulaText}>
                This Agreement, together with the Terms of Service and Privacy Policy, constitutes the entire agreement between you and MOOD.
              </Text>
            </View>

            {/* Links to Full Documents */}
            <View style={styles.linksSection}>
              <TouchableOpacity style={styles.linkButton} onPress={openTermsOfService}>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.linkText}>Read Full Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton} onPress={openCommunityGuidelines}>
                <Ionicons name="people-outline" size={18} color="#fff" />
                <Text style={styles.linkText}>Community Guidelines</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Checkbox Agreement */}
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={16} color="#000" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the{' '}
              <Text style={styles.linkInline} onPress={openTermsOfService}>
                Terms of Service
              </Text>
              ,{' '}
              <Text style={styles.linkInline} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
              , and{' '}
              <Text style={styles.linkInline} onPress={openCommunityGuidelines}>
                Community Guidelines
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            style={[
              styles.acceptButton,
              (!agreed || submitting) && styles.acceptButtonDisabled
            ]}
            onPress={handleAccept}
            disabled={!agreed || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>I Agree - Continue</Text>
            )}
          </TouchableOpacity>

          {/* Notice */}
          <Text style={styles.notice}>
            You must accept to use social features
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  contentScroll: {
    maxHeight: 320,
  },
  eulaSection: {
    marginBottom: 16,
  },
  eulaSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  eulaText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#999',
    marginBottom: 4,
  },
  eulaTextBold: {
    fontSize: 12,
    lineHeight: 18,
    color: '#ccc',
    fontWeight: '600',
    marginBottom: 4,
  },
  eulaTextCaps: {
    fontSize: 11,
    lineHeight: 16,
    color: '#888',
    marginBottom: 4,
  },
  bulletList: {
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 20,
    color: '#888',
  },
  linksSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  linkInline: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  acceptButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  notice: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});
