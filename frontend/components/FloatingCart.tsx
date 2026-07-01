import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useCart } from '../contexts/CartContext';
import { useRouter, useRootNavigationState, usePathname } from 'expo-router';

// Screens where the floating cart stays out of the way (active workout flow).
const HIDDEN_ROUTES = ['/workout-guidance', '/workout-session'];

const FloatingCart: React.FC = () => {
  const { cartItems } = useCart();
  const rootNavigationState = useRootNavigationState();
  const pathname = usePathname();
  const cartCount = cartItems.length;

  // Don't render until navigation is ready
  if (!rootNavigationState?.key) {
    return null;
  }

  const router = useRouter();

  const handleCartPress = () => {
    router.push('/cart');
  };

  if (cartCount === 0) {
    return null;
  }

  // Hidden during the workout session/guidance screens.
  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCartPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="fitness" size={24} color="#0c0c0c" />
        </LinearGradient>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartCount}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 999,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'visible',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FloatingCart;
