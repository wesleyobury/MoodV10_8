/**
 * Founder welcome message on Profile (Oct 2026): a quiet card ("Welcome to MOOD / A quick message from Wes") that opens a
 * sheet with the message and the video, which starts playing straight away (no thumbnail). Opening it clears the Profile
 * tab badge (utils/founderMessage).
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS } from '../constants/brand';
import { FounderMessage, markFounderMessageSeen } from '../utils/founderMessage';

export function FounderMessageCard({ message, unseen, uid, onOpened }: { message: FounderMessage; unseen: boolean; uid: string | null; onOpened?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => {
          setOpen(true);
          markFounderMessageSeen(uid);
          onOpened?.();
        }}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        accessibilityLabel="Welcome to MOOD. Play a quick message from Wes, the founder."
        testID="profile-founder-message"
      >
        <View style={styles.play}>
          <Ionicons name="play" size={15} color={COLORS.accentInk} style={{ marginLeft: 2 }} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>Welcome to MOOD</Text>
            {unseen ? (
              <View style={styles.newPill}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sub}>A quick message from Wes, our founder</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.4)" />
      </Pressable>
      <FounderMessageSheet visible={open} message={message} onClose={() => setOpen(false)} />
    </>
  );
}

function FounderMessageSheet({ visible, message, onClose }: { visible: boolean; message: FounderMessage; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {visible ? <SheetBody message={message} onClose={onClose} /> : null}
    </Modal>
  );
}

function SheetBody({ message, onClose }: { message: FounderMessage; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer(message.videoUrl, (p) => {
    p.loop = false;
    p.play();
  });
  useEffect(() => () => {
    try {
      player.pause();
    } catch {
      /* already released */
    }
  }, [player]);
  // portrait founder video: as tall as fits under the text, never wider than the sheet
  const videoH = Math.min(height * 0.58, (width - 40) * (16 / 9));
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="founder-message-sheet">
      <View style={styles.grabber} />
      <View style={styles.head}>
        <Text style={styles.eyebrow}>FROM THE FOUNDER</Text>
        <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close" testID="founder-message-close">
          <Ionicons name="close" size={20} color={COLORS.textPrimary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sheetTitle}>Hey, I’m Wes.</Text>
        <Text style={styles.body}>{message.text}</Text>
        <View style={[styles.video, { height: videoH }]}>
          <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsFullscreen />
        </View>
      </ScrollView>
      <Pressable onPress={onClose} style={({ pressed }) => [styles.done, pressed && { opacity: 0.85 }]} testID="founder-message-done">
        <Text style={styles.doneText}>Let’s train</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, marginTop: 10, borderRadius: 18,
    backgroundColor: 'rgba(255,215,0,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,215,0,0.28)',
  },
  play: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent },
  title: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  newPill: { paddingHorizontal: 6, height: 16, borderRadius: 8, justifyContent: 'center', backgroundColor: COLORS.accent },
  newText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: COLORS.accentInk },
  sheet: { flex: 1, backgroundColor: COLORS.bg },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 14, marginBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2.4, color: COLORS.accent },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  sheetTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, marginTop: 6 },
  body: { fontSize: 15.5, lineHeight: 22, color: COLORS.textSecondary, marginTop: 8 },
  video: { marginTop: 18, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  done: { marginHorizontal: 20, marginTop: 10, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  doneText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
