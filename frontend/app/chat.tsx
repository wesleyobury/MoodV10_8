import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';
import WorkoutShareMessageCard from '../components/WorkoutShareMessageCard';
import WelcomeVideoMessage from '../components/WelcomeVideoMessage';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachment_type?: string;
  attachment?: any;
}

export default function Chat() {
  const params = useLocalSearchParams();
  const { conversationId, userId, username, name, avatar, fromShare } = params as {
    conversationId?: string;
    userId: string;
    username: string;
    name: string;
    avatar: string;
    fromShare?: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [shareToastVisible, setShareToastVisible] = useState(false);
  const shareToastAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, user } = useAuth();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeConversation = async () => {
    if (!token || !userId) return;

    try {
      // Create or get existing conversation
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversationId(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
    return null;
  };

  const fetchMessages = async (convId?: string) => {
    const targetId = convId || activeConversationId;
    if (!token || !targetId) return;

    try {
      const response = await fetch(`${API_URL}/api/conversations/${targetId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (conversationId) {
        setActiveConversationId(conversationId);
        await fetchMessages(conversationId);
      } else if (userId) {
        const convId = await initializeConversation();
        if (convId) {
          await fetchMessages(convId);
        }
      }
      setLoading(false);
    };

    init();

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId, userId, token]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const sendMessage = async () => {
    if (!token || !activeConversationId || !newMessage.trim()) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`${API_URL}/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    // Handle ISO date strings - append Z if no timezone specified to treat as UTC
    let date: Date;
    if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
      date = new Date(dateString);
    } else {
      // Assume UTC if no timezone, then convert to local
      date = new Date(dateString + 'Z');
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    // Handle ISO date strings - append Z if no timezone specified to treat as UTC
    let date: Date;
    if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'Z');
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showDate = index === 0 || 
      formatDate(item.created_at) !== formatDate(messages[index - 1].created_at);

    // Welcome video attachment — render a video card (from officialmoodapp).
    if (item.attachment_type === 'welcome_video' && item.attachment?.video_url) {
      return (
        <>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          )}
          <WelcomeVideoMessage
            videoUrl={item.attachment.video_url}
            thumbnailUrl={item.attachment.thumbnail_url}
            caption={item.attachment.caption || item.content}
          />
          <Text
            style={[
              styles.messageTime,
              styles.otherMessageTime,
              { alignSelf: 'flex-start', paddingHorizontal: 12 },
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </>
      );
    }

    // Workout share attachment — render premium card instead of bubble
    if (item.attachment_type === 'workout_share' && item.attachment) {
      return (
        <>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          )}
          <WorkoutShareMessageCard
            attachment={item.attachment}
            isOwn={isOwnMessage}
          />
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              { alignSelf: isOwnMessage ? 'flex-end' : 'flex-start', paddingHorizontal: 12 },
            ]}
          >
            {formatTime(item.created_at)}
            {isOwnMessage && (
              <Text> {item.read ? '✓✓' : '✓'}</Text>
            )}
          </Text>
        </>
      );
    }

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          </View>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.created_at)}
            {isOwnMessage && (
              <Text> {item.read ? '✓✓' : '✓'}</Text>
            )}
          </Text>
        </View>
      </>
    );
  };

  const avatarUri = avatar && avatar.startsWith('http') 
    ? avatar 
    : avatar ? `${API_URL}${avatar}` : null;

  useEffect(() => {
    if (fromShare === '1') {
      setShareToastVisible(true);
      Animated.sequence([
        Animated.spring(shareToastAnim, {
          toValue: 1,
          speed: 14,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(shareToastAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setShareToastVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromShare]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* New-thread toast (shown after navigating from Send Workout flow) */}
      {shareToastVisible && (
        <Animated.View
          style={[
            styles.shareToast,
            {
              top: insets.top + 8,
              opacity: shareToastAnim,
              transform: [{
                translateY: shareToastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              }],
            },
          ]}
          pointerEvents="none"
          testID="share-thread-toast"
        >
          <Ionicons name="link" size={14} color="#0c0c0c" />
          <Text style={styles.shareToastText}>New thread started</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color='#fff' />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerUser}
          onPress={() => router.push({
            pathname: '/user-profile',
            params: { userId }
          })}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={18} color="#666" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name || username}</Text>
            <Text style={styles.headerUsername}>@{username}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name='send' size={20} color={newMessage.trim() ? '#000' : '#666'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerUsername: {
    fontSize: 12,
    color: '#888',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#3a3a3a',  // Gray for your messages
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#2a2a2a',  // Charcoal for their messages
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#888',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  // "New thread started" toast that appears after navigating from Send-Workout flow
  shareToast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  shareToastText: {
    color: '#0c0c0c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
