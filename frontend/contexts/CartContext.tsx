import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { API_URL } from '../utils/apiConfig';
import { prefetchCartImages } from '../utils/mediaPrefetch';

export interface WorkoutItem {
  id: string;
  name: string;
  duration: string;
  description: string;
  battlePlan: string;
  imageUrl: string;
  intensityReason: string;
  equipment: string;
  difficulty: string;
  workoutType: string;
  moodCard: string;
  moodTips: {
    icon: string;
    title: string;
    description: string;
  }[];
  // Optional: track source for analytics
  source?: 'custom' | 'build_for_me';
}

interface CartContextType {
  cartItems: WorkoutItem[];
  addToCart: (workout: WorkoutItem, options?: { source?: 'custom' | 'build_for_me', token?: string | null }) => void;
  removeFromCart: (workoutId: string) => void;
  clearCart: () => void;
  replaceCart: (items: WorkoutItem[]) => void;
  isInCart: (workoutId: string) => boolean;
  reorderCart: (startIndex: number, endIndex: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<WorkoutItem[]>([]);
  const tokenRef = useRef<string | null>(null);

  // Track cart item added event
  const trackCartItemAdded = async (workout: WorkoutItem, source: 'custom' | 'build_for_me', token?: string | null) => {
    const authToken = token || tokenRef.current;
    if (!authToken) return; // Don't track for guests without token
    
    try {
      await fetch(`${API_URL}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          event_type: 'cart_item_added',
          metadata: {
            workout_id: workout.id,
            workout_name: workout.name,
            moodCard: workout.moodCard,
            workoutType: workout.workoutType,
            equipment: workout.equipment,
            difficulty: workout.difficulty,
            source: source, // 'custom' or 'build_for_me'
          },
        }),
      });
    } catch (error) {
      console.log('Failed to track cart item:', error);
    }
  };

  const addToCart = (workout: WorkoutItem, options?: { source?: 'custom' | 'build_for_me', token?: string | null }) => {
    const source = options?.source || 'custom';
    const token = options?.token;
    
    // Store token for future tracking
    if (token) {
      tokenRef.current = token;
    }
    
    setCartItems(prevItems => {
      const isAlreadyInCart = prevItems.some(item => item.id === workout.id);
      if (isAlreadyInCart) {
        return prevItems;
      }
      
      // Track the event
      trackCartItemAdded({ ...workout, source }, source, token);
      
      return [...prevItems, { ...workout, source }];
    });
  };

  const removeFromCart = (workoutId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== workoutId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const replaceCart = (items: WorkoutItem[]) => {
    setCartItems(items);
  };

  const isInCart = useCallback((workoutId: string) => {
    return cartItems.some(item => item.id === workoutId);
  }, [cartItems]);

  const reorderCart = (startIndex: number, endIndex: number) => {
    const result = Array.from(cartItems);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setCartItems(result);
  };

  // Prefetch cart item images whenever cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      prefetchCartImages(cartItems);
    }
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        replaceCart,
        isInCart,
        reorderCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
