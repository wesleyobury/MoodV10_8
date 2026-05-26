import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  is_following?: boolean;
  is_self?: boolean;
}

interface FollowListModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export default function FollowListModal({
  visible,
  onClose,
  userId,
  type,
}: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user: currentUser } = useAuth();
  const router = useRouter();

  // Reset and fetch when modal opens or type changes
  useEffect(() => {
    if (visible && userId) {
      setUsers([]); // Reset users when opening
      setError(null);
      fetchUsers();
    }
  }, [visible, userId, type]);

  const fetchUsers = useCallback(async () => {
    if (!userId) {
      console.log('No userId provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const endpoint = type === 'followers' 
        ? `${API_URL}/api/users/${userId}/followers`
        : `${API_URL}/api/users/${userId}/following`;

      console.log(`Fetching ${type} from:`, endpoint);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, { headers });

      console.log(`${type} response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`${type} data received:`, data?.users?.length || 0, 'users');
        
        // API returns { users: [...] }
        const userList = data.users || [];
        setUsers(userList);
      } else {
        const errorText = await response.text();
        console.error(`Failed to fetch ${type}:`, response.status, errorText);
        setError(`Failed to load ${type}`);
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Error loading ${type}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, type, token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (user: User) => {
    onClose();
    // If it's the current user, go to profile tab
    if (currentUser && user.id === currentUser.id) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/user-profile?userId=${user.id}`);
    }
  };

  const getAvatarUri = (avatar: string | undefined | null): string | null => {
    if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined') {
      return null;
    }
    // Already a full URL (Cloudinary, etc.)
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    // Handle relative URLs from our API
    if (avatar.startsWith('/api/')) {
      return `${API_URL}${avatar}`;
    }
    // Other relative paths
    return `${API_URL}/${avatar.replace(/^\//, '')}`;
  };

  const renderUser = ({ item }: { item: User }) => {
    const avatarUri = getAvatarUri(item.avatar);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        {avatarUri ? (
          <Image 
            source={{ uri: avatarUri }} 
            style={styles.avatar}
            defaultSource={require('../assets/images/icon.png')}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          {item.name && item.name !== item.username && (
            <Text style={styles.name}>{item.name}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading {type}...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={type === 'followers' ? 'people-outline' : 'person-add-outline'}
                size={48}
                color="#666"
              />
              <Text style={styles.emptyText}>
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFD700"
                />
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  retryButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
});
