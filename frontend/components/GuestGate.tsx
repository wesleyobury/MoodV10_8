/**
 * GuestGate (Oct 2026): workouts need a profile. A guest who reaches a workout screen (Build, Cart, Guided Session, the V2
 * player, Saved) sees the sign-up prompt over a plain screen instead; closing it goes back to where they were.
 */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/brand';
import GuestPromptModal from './GuestPromptModal';

export default function GuestGate({ action }: { action: string }) {
  const router = useRouter();
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} testID="guest-gate">
      <GuestPromptModal visible onClose={close} action={action} />
    </View>
  );
}
