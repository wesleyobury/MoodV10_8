import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';

interface CompUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  comp_granted_at: string | null;
  comp_granted_by: string | null;
}

export default function AdminComp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [identifier, setIdentifier] = useState('');
  const [granting, setGranting] = useState(false);
  const [compUsers, setCompUsers] = useState<CompUser[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const checkAuthorization = useCallback(async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/me`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setIsAuthorized(data.is_admin === true);
      }
    } catch (e) {
      console.error('Comp: auth check failed', e);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const loadCompUsers = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/comp-users`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCompUsers(data.users || []);
      }
    } catch (e) {
      console.error('Comp: list failed', e);
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  useEffect(() => {
    if (isAuthorized) loadCompUsers();
  }, [isAuthorized, loadCompUsers]);

  const grant = async () => {
    const id = identifier.trim();
    if (!id) {
      Alert.alert('Enter a creator', 'Add an email, username, or user ID first.');
      return;
    }
    setGranting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(id)}/comp`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setIdentifier('');
        Alert.alert('Comped', `${id} now has free lifetime access.`);
        loadCompUsers();
      } else {
        Alert.alert('No match', `Couldn't find an account for "${id}". They need to sign up in MOOD first.`);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong granting access.');
    } finally {
      setGranting(false);
    }
  };

  const revoke = (u: CompUser) => {
    Alert.alert(
      'Revoke access?',
      `Remove free access from ${u.username || u.email || u.user_id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(u.user_id)}/comp`, {
                method: 'DELETE',
                headers: authHeaders,
              });
              if (res.ok) {
                loadCompUsers();
              } else {
                Alert.alert('Error', 'Failed to revoke access.');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to revoke access.');
            }
          },
        },
      ]
    );
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isAuthorized) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color="#666" />
        <Text style={styles.unauthorizedText}>Admin access required</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comp Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Grant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Give a creator free access</Text>
          <Text style={styles.helper}>
            Enter their email, username, or user ID. They must have signed up in MOOD first. This grants lifetime free
            access instantly — no App Store code needed.
          </Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="creator@email.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onSubmitEditing={grant}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.grantButton, granting && styles.buttonDisabled]}
            onPress={grant}
            disabled={granting}
          >
            {granting ? (
              <ActivityIndicator size="small" color="#0c0c0c" />
            ) : (
              <>
                <Ionicons name="gift" size={18} color="#0c0c0c" />
                <Text style={styles.grantButtonText}>Grant free access</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Current comps */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Comped accounts ({compUsers.length})</Text>
            <TouchableOpacity onPress={loadCompUsers} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          {loadingList ? (
            <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 20 }} />
          ) : compUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color="#666" />
              <Text style={styles.emptyStateText}>No comped accounts yet</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {compUsers.map((u) => (
                <View key={u.user_id} style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{u.username || u.name || u.email || u.user_id}</Text>
                    {!!u.email && <Text style={styles.rowSub}>{u.email}</Text>}
                    {!!u.comp_granted_at && (
                      <Text style={styles.rowMeta}>Comped {fmtDate(u.comp_granted_at)}</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.revokeButton} onPress={() => revoke(u)}>
                    <Text style={styles.revokeButtonText}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Comp = lifetime full access, enforced server-side. Works before the app is live and never expires.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helper: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 12,
  },
  grantButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c0c0c',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  rowSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  revokeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 90, 0.4)',
  },
  revokeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5A5A',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 40,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
