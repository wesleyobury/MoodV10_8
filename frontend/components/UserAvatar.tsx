import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';

interface UserAvatarProps {
  uri?: string | null;
  /** Display name or username — first character is used for default avatar */
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const GOLD = '#F5C518';

/**
 * Renders a square (circular) avatar. If `uri` is provided, shows the image.
 * Otherwise falls back to the first letter of `name` rendered in white on a
 * brand-gold circle.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  name,
  size = 96,
  style,
  testID,
}) => {
  const initial = (name && name.trim().charAt(0).toUpperCase()) || '?';
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dim, style as any]}
        contentFit="cover"
        transition={150}
        testID={testID || 'user-avatar-image'}
      />
    );
  }
  return (
    <View
      style={[styles.fallback, dim, style]}
      testID={testID || 'user-avatar-fallback'}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default UserAvatar;
