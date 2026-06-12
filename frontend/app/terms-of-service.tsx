import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: June 2026</Text>

        {/* Zero Tolerance Policy - HARDENED VERSION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ZERO TOLERANCE FOR OBJECTIONABLE CONTENT</Text>
          <Text style={styles.importantText}>
            WE HAVE ABSOLUTELY ZERO TOLERANCE FOR OBJECTIONABLE CONTENT, ABUSIVE BEHAVIOR, OR ATTEMPTS TO EVADE MODERATION.
          </Text>
          <Text style={styles.paragraph}>
            By using this app, you agree that you will NOT create, upload, share, engage with, promote, or attempt to bypass safeguards related to any of the following:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Offensive, abusive, threatening, or violent content or behavior</Text>
            <Text style={styles.bulletItem}>• Harassment, bullying, intimidation, or stalking</Text>
            <Text style={styles.bulletItem}>• Hate speech, discrimination, or content targeting protected groups</Text>
            <Text style={styles.bulletItem}>• Sexually explicit, pornographic, or fetish content</Text>
            <Text style={styles.bulletItem}>• Sexual solicitation or sexually suggestive behavior</Text>
            <Text style={styles.bulletItem}>• Content involving minors in any sexualized or exploitative manner (reported immediately to authorities)</Text>
            <Text style={styles.bulletItem}>• Illegal activities, substances, or instructions</Text>
            <Text style={styles.bulletItem}>• Spam, scams, impersonation, or deceptive practices</Text>
            <Text style={styles.bulletItem}>• Attempts to evade detection, moderation systems, filters, or enforcement actions</Text>
          </View>
          <Text style={styles.importantText}>
            Violations may result in immediate and permanent account termination without notice.
          </Text>
        </View>

        {/* Community Safety & Moderation - NEW SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Safety & Moderation (Apple Guideline 1.2 Compliance)</Text>
          <Text style={styles.paragraph}>
            This app includes user-generated content and social features. To protect users and comply with Apple App Store Guideline 1.2, we maintain a strict zero-tolerance policy for objectionable content and abusive behavior.
          </Text>
          <Text style={styles.paragraph}>
            We provide the following safety mechanisms:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Content filtering using automated systems and human moderation</Text>
            <Text style={styles.bulletItem}>• In-app reporting tools allowing users to report offensive, abusive, or inappropriate content</Text>
            <Text style={styles.bulletItem}>• User blocking tools allowing users to block other users from interacting with them</Text>
            <Text style={styles.bulletItem}>• Administrative enforcement, including content removal and account suspension or termination</Text>
          </View>
          <Text style={styles.paragraph}>
            Reported content is reviewed as promptly as possible, typically within 24 hours.
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to our fitness application. By using this app, you agree to these Terms of Service. 
            Please read them carefully before using our services.
          </Text>
        </View>

        {/* Health Disclaimer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Fitness Disclaimer</Text>
          <Text style={styles.importantText}>
            MOOD is not a medical device. Workouts are suggestions, not medical advice. Consult a physician before starting any exercise program.
          </Text>
          <Text style={styles.paragraph}>
            The fitness content, workouts, and health information provided in this app are for 
            general informational purposes only and are not intended as medical advice. This app 
            does not provide medical diagnoses, treatment recommendations, or professional health advice.
          </Text>
          <Text style={styles.paragraph}>
            By using this app, you acknowledge and agree that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You should consult with a qualified healthcare provider before starting any new exercise program</Text>
            <Text style={styles.bulletItem}>• You are responsible for determining whether any exercise or workout is appropriate for your physical condition</Text>
            <Text style={styles.bulletItem}>• You should immediately stop exercising if you experience pain, dizziness, or discomfort</Text>
            <Text style={styles.bulletItem}>• The app creators are not responsible for any injuries that may occur from following the workouts</Text>
            <Text style={styles.bulletItem}>• Results may vary and are not guaranteed</Text>
          </View>
        </View>

        {/* Acceptance of Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using our application, you confirm that you:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Are at least 13 years of age</Text>
            <Text style={styles.bulletItem}>• Have read and understood these Terms of Service</Text>
            <Text style={styles.bulletItem}>• Agree to be bound by these terms</Text>
            <Text style={styles.bulletItem}>• Have consulted or will consult a healthcare professional before beginning any fitness program</Text>
          </View>
        </View>

        {/* User Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Accounts</Text>
          <Text style={styles.paragraph}>
            When you create an account, you agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Provide accurate and complete information</Text>
            <Text style={styles.bulletItem}>• Maintain the security of your account credentials</Text>
            <Text style={styles.bulletItem}>• Accept responsibility for all activities under your account</Text>
            <Text style={styles.bulletItem}>• Notify us immediately of any unauthorized access</Text>
          </View>
          <Text style={styles.paragraph}>
            You can delete your account directly in the app settings. Deleting your account removes your personal profile, workout history, community content, and associated data.
          </Text>
        </View>

        {/* Subscriptions & Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscriptions & Billing</Text>
          <Text style={styles.paragraph}>
            MOOD offers the following auto-renewable subscriptions through Apple:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• MOOD Monthly — $9.99 per month</Text>
            <Text style={styles.bulletItem}>• MOOD Annual — $79 per year</Text>
            <Text style={styles.bulletItem}>• Founding Member Annual — $39 per year</Text>
          </View>
          <Text style={styles.paragraph}>
            These subscriptions auto-renew unless canceled at least 24 hours before the end of the current billing period. Renewal charges occur within 24 hours before the period ends.
          </Text>
          <Text style={styles.paragraph}>
            All payment processing is handled by Apple. We do not receive or store your credit card or payment credentials. Manage and cancel your subscriptions through your Apple ID account settings in the App Store.
          </Text>
          <Text style={styles.paragraph}>
            Your subscription status is shared with our backend to provide access to premium content and entitlement services.
          </Text>
        </View>

        {/* User Blocking - NEW SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Blocking</Text>
          <Text style={styles.paragraph}>
            Users may block other users at any time using in-app controls. Blocking prevents further interaction, including viewing profiles, commenting, messaging, or engaging with content. Abuse of the blocking system or attempts to circumvent blocks constitutes a violation of these Terms.
          </Text>
        </View>

        {/* User Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User-Generated Content</Text>
          <Text style={styles.paragraph}>
            You may post content including photos, videos, comments, and workout data. By posting content, you:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Grant us a non-exclusive license to use, display, and distribute your content</Text>
            <Text style={styles.bulletItem}>• Confirm you own or have rights to the content you post</Text>
            <Text style={styles.bulletItem}>• Agree not to post illegal, harmful, or objectionable content</Text>
            <Text style={styles.bulletItem}>• Accept that we may remove content that violates these terms</Text>
          </View>
        </View>

        {/* Prohibited Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prohibited Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Harass, bully, or intimidate other users</Text>
            <Text style={styles.bulletItem}>• Post spam, advertisements, or malicious content</Text>
            <Text style={styles.bulletItem}>• Impersonate others or provide false information</Text>
            <Text style={styles.bulletItem}>• Attempt to hack or disrupt the app's functionality</Text>
            <Text style={styles.bulletItem}>• Use the app for any illegal purposes</Text>
            <Text style={styles.bulletItem}>• Share content that is violent, hateful, or sexually explicit</Text>
          </View>
        </View>

        {/* Explicit Content Prohibition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prohibited Sexual Content</Text>
          <Text style={styles.paragraph}>
            The following content is STRICTLY PROHIBITED and will result in immediate account termination:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Pornographic or sexually explicit images, videos, or text</Text>
            <Text style={styles.bulletItem}>• Nudity or partial nudity intended to be sexual</Text>
            <Text style={styles.bulletItem}>• Sexual solicitation or offers of sexual services</Text>
            <Text style={styles.bulletItem}>• Content depicting sexual acts or fetishes</Text>
            <Text style={styles.bulletItem}>• Sexually suggestive content involving minors (ZERO TOLERANCE - reported to authorities)</Text>
            <Text style={styles.bulletItem}>• Links to pornographic websites or adult content</Text>
            <Text style={styles.bulletItem}>• Sexual harassment or unsolicited sexual messages</Text>
            <Text style={styles.bulletItem}>• Content promoting or glorifying non-consensual sexual activity</Text>
          </View>
          <Text style={styles.paragraph}>
            We use automated filtering and human moderation to detect and remove prohibited content. 
            Attempting to bypass our filters will result in permanent account suspension.
          </Text>
        </View>

        {/* Content Moderation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Moderation</Text>
          <Text style={styles.paragraph}>
            We reserve the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Review and moderate user-generated content</Text>
            <Text style={styles.bulletItem}>• Remove content that violates these terms</Text>
            <Text style={styles.bulletItem}>• Suspend or terminate accounts for violations</Text>
            <Text style={styles.bulletItem}>• Report illegal content to appropriate authorities</Text>
          </View>
          <Text style={styles.paragraph}>
            We aim to review reported content within 24 hours and take appropriate action to maintain 
            a safe and positive community.
          </Text>
        </View>

        {/* Enforcement Authority - NEW SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enforcement Authority</Text>
          <Text style={styles.paragraph}>
            We reserve sole discretion to determine whether content or behavior violates these Terms. We are not obligated to provide warnings or appeals prior to enforcement actions, including suspension or termination.
          </Text>
        </View>

        {/* Dynamic Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dynamic Content & Features</Text>
          <Text style={styles.paragraph}>
            Our app includes features that provide dynamic, personalized content:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• "Choose for me" - Algorithmically selects workouts based on your preferences and history</Text>
            <Text style={styles.bulletItem}>• Daily workout recommendations - Automatically generated suggestions</Text>
            <Text style={styles.bulletItem}>• Featured workouts - Curated content that may change over time</Text>
          </View>
          <Text style={styles.paragraph}>
            These features use algorithms to personalize your experience. Results are not guaranteed, 
            and workout recommendations may vary. We reserve the right to modify, update, or remove 
            features at any time.
          </Text>
        </View>

        {/* Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The app, including its design, features, and content (excluding user-generated content), 
            is owned by us and protected by intellectual property laws. You may not copy, modify, 
            distribute, or create derivative works without our permission.
          </Text>
        </View>

        {/* Disclaimer of Warranties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT 
            THE APP WILL BE ERROR-FREE, SECURE, OR CONTINUOUSLY AVAILABLE. FITNESS RESULTS ARE 
            NOT GUARANTEED AND DEPEND ON INDIVIDUAL EFFORT AND CIRCUMSTANCES.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE APP, 
            INCLUDING BUT NOT LIMITED TO PHYSICAL INJURIES RESULTING FROM EXERCISE.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account at any time for violations of these terms. 
            You may also delete your account at any time through the app settings. Upon account 
            deletion, your posts, comments, and associated data will be permanently removed.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may update these Terms of Service from time to time. We will notify you of significant 
            changes by posting a notice in the app. Continued use of the app after changes constitutes 
            acceptance of the new terms.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms of Service, please contact us through the app's 
            support feature in settings.
          </Text>
          <Text style={styles.paragraph}>
            For safety, abuse, or objectionable content concerns, users may contact us directly at:
          </Text>
          <Text style={styles.contactText}>wes@officialmoodapp.com</Text>
          <Text style={styles.paragraph}>
            Privacy Policy: You can review our Privacy Policy from within the app or at the Privacy Policy page linked from the terms acceptance screen.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#999',
    marginBottom: 8,
  },
  importantText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#ccc',
    fontWeight: '600',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 4,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 24,
    color: '#888',
  },
  contactText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
