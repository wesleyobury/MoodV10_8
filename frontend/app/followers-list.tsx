import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';

interface FollowUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string;
  is_following: boolean;
  is_self: boolean;
}

export default function FollowersList() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token, user, isGuest } = useAuth();
  
  const userId = params.userId as string;
  const initialType = (params.type as 'followers' | 'following') || 'followers';
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialType);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);
  const [targetUsername, setTargetUsername] = useState<string>('');

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setTargetUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, [userId, token]);

  const fetchList = useCallback(async () => {
    try {
      const endpoint = activeTab === 'followers' 
        ? `${API_URL}/api/users/${userId}/followers`
        : `${API_URL}/api/users/${userId}/following`;
      
      const response = await fetch(endpoint, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data.followers || data.following || []);
      }
    } catch (error) {
      console.error('Error fetching list:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, activeTab, token]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    setLoading(true);
    fetchList();
  }, [fetchList]);

  const handleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (isGuest || !token) return;
    
    setFollowingInProgress(targetUserId);
    try {
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === targetUserId 
            ? { ...u, is_following: !isCurrentlyFollowing }
            : u
        ));
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setFollowingInProgress(null);
    }
  };

  const handleUserPress = (targetUserId: string) => {
    if (user && targetUserId === user.id) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/user-profile?userId=${targetUserId}`);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchList();
  };

  const renderUser = ({ item }: { item: FollowUser }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        {item.avatar ? (
          <Image 
            source={{ 
              uri: item.avatar.startsWith('http') 
                ? item.avatar 
                : `${API_URL}${item.avatar}` 
            }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.name} numberOfLines={1}>{item.name || item.username}</Text>
          <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>
      </View>
      
      {!item.is_self && !isGuest && (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.is_following && styles.followingButton
          ]}
          onPress={() => handleFollow(item.id, item.is_following)}
          disabled={followingInProgress === item.id}
        >
          {followingInProgress === item.id ? (
            <ActivityIndicator size='small' color={item.is_following ? '#FFD700' : '#000'} />
          ) : (
            <Text style={[
              styles.followButtonText,
              item.is_following && styles.followingButtonText
            ]}>
              {item.is_following ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'} 
        size={64} 
        color='#333' 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers' ? 'No Followers Yet' : 'Not Following Anyone'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'followers' 
          ? "When people follow this account, they'll appear here."
          : "When this account follows people, they'll appear here."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {targetUsername ? `@${targetUsername}` : 'Profile'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor='#FFD700'
            />
          }
        />
      )}
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 36,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFD700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  username: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  bio: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  followButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFD700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
