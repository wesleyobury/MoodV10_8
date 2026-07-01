import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseLookupTriggerProps {
  onPress: () => void;
}

export default function ExerciseLookupTrigger({ onPress }: ExerciseLookupTriggerProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="search" size={16} color="#8a8a92" />
      <Text style={styles.text}>Search tutorials manually</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141417',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  text: {
    fontSize: 14,
    color: '#8a8a92',
    fontWeight: '400',
  },
});
