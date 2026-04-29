import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { API_URL } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { Workout } from '../types/workout';

export interface SendWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  workout: Workout | null;
  equipment: string;
  difficulty: string;
  /** Parent mood-card name, e.g. "Muscle Gainer" */
  moodCategory?: string;
  /** Sub-path label, e.g. "Chest", "Cardio" */
  subtext?: string;
}

interface SearchUser {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  is_self?: boolean;
}

const DEBOUNCE_MS = 250;

export default function SendWorkoutModal({
  visible,
  onClose,
  workout,
  equipment,
  difficulty,
  moodCategory,
  subtext,
}: SendWorkoutModalProps) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  // Slide-up animation when opening
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset state when closing
      setQuery('');
      setResults([]);
      setSearching(false);
      setSendingTo(null);
      setSentTo(null);
      checkScale.setValue(0);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `${API_URL}/api/users/search/query?q=${encodeURIComponent(trimmed)}&limit=20`;
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data: SearchUser[] = await resp.json();
          // Exclude self
          const filtered = data.filter((u) => u.id !== user?.id && !u.is_self);
          setResults(filtered);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.warn('User search failed:', e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, token, user?.id]);

  const handleSend = async (recipient: SearchUser) => {
    if (!workout || sendingTo) return;
    setSendingTo(recipient.id);
    try {
      const resp = await fetch(`${API_URL}/api/messages/send-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_user_id: recipient.id,
          workout,
          equipment,
          difficulty,
          mood_category: moodCategory || '',
          subtext: subtext || '',
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({} as any));
        const detail = errBody?.detail;
        const msg =
          resp.status === 404
            ? "We couldn't reach the messaging service. Try again in a moment."
            : (typeof detail === 'string' ? detail : 'Send failed. Please try again.');
        throw new Error(msg);
      }

      const data = await resp.json();

      // Success: animate the row's pill to a gold checkmark
      setSendingTo(null);
      setSentTo(recipient.id);
      checkScale.setValue(0);
      Animated.spring(checkScale, {
        toValue: 1,
        speed: 16,
        bounciness: 12,
        useNativeDriver: true,
      }).start();

      // Hold the check for ~750ms, then close + navigate
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          router.push({
            pathname: '/chat',
            params: {
              conversationId: data.thread_id,
              userId: recipient.id,
              username: recipient.username,
              name: recipient.name || '',
              avatar: recipient.avatar || '',
            },
          });
        }, 200);
      }, 750);
    } catch (e: any) {
      console.warn('send-workout failed:', e?.message || e);
      setSendingTo(null);
      // Surface the error so the user knows the send didn't go through
      Alert.alert(
        'Couldn\u2019t send workout',
        e?.message || 'Please check your connection and try again.'
      );
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const renderUser = ({ item }: { item: SearchUser }) => {
    const avatarUri =
      item.avatar && item.avatar.startsWith('http')
        ? item.avatar
        : item.avatar
        ? `${API_URL}${item.avatar}`
        : null;
    const isSending = sendingTo === item.id;
    const isSent = sentTo === item.id;

    return (
      <Pressable
        onPress={() => handleSend(item)}
        disabled={!!sendingTo || !!sentTo}
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        testID={`send-workout-user-row-${item.username}`}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={18} color="#666" />
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name || item.username}
          </Text>
          <Text style={styles.rowUsername} numberOfLines={1}>@{item.username}</Text>
        </View>
        {isSending ? (
          <ActivityIndicator color="#FFD700" size="small" />
        ) : isSent ? (
          <Animated.View
            style={[styles.sentCheck, { transform: [{ scale: checkScale }] }]}
            testID="send-workout-sent-check"
          >
            <Ionicons name="checkmark" size={18} color="#0c0c0c" />
          </Animated.View>
        ) : (
          <View style={styles.sendPill}>
            <Ionicons name="paper-plane" size={14} color="#0c0c0c" />
            <Text style={styles.sendPillText}>Send</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const showEmpty = !searching && query.trim().length > 0 && results.length === 0;
  const showHint = !searching && query.trim().length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="send-workout-modal"
    >
      <Pressable style={styles.backdrop} onPress={onClose} testID="send-workout-backdrop" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Grab handle */}
          <View style={styles.grabHandle} />

          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Send workout</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} testID="send-workout-close-btn">
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users"
              placeholderTextColor="#666"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              testID="send-workout-search-input"
            />
            {searching && <ActivityIndicator size="small" color="#FFD700" />}
          </View>

          {/* Results */}
          <View style={styles.resultsWrap}>
            {showHint ? (
              <View style={styles.placeholder}>
                <Ionicons name="people-outline" size={32} color="#333" />
                <Text style={styles.placeholderText}>Search for a user to send this workout to</Text>
              </View>
            ) : showEmpty ? (
              <View style={styles.placeholder} testID="send-workout-empty-state">
                <Ionicons name="search-outline" size={32} color="#333" />
                <Text style={styles.placeholderText}>No users found</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                renderItem={renderUser}
                keyExtractor={(u) => u.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  kbView: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '85%',
    minHeight: '55%',
  },
  grabHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#222',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1c1c1c',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  resultsWrap: { flex: 1, marginTop: 6 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  placeholderText: { color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowPressed: { opacity: 0.6 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#161616',
    marginRight: 12,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, marginRight: 10 },
  rowName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rowUsername: { color: '#666', fontSize: 12, marginTop: 1 },
  sendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 6,
  },
  sendPillText: { color: '#0c0c0c', fontSize: 12, fontWeight: '700' },
  sentCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: 1, backgroundColor: '#111', marginLeft: 54 },
});
