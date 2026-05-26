import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { API_URL } from '../utils/apiConfig';

/**
 * SERVER-AUTHORITATIVE BADGE CONTEXT
 * 
 * RULES:
 * 1. Badge count ONLY comes from GET /api/notifications/unread-count
 * 2. No local increment/decrement logic
 * 3. No derived counts from arrays
 * 4. markAllRead() calls server, then sets to 0
 * 5. Refresh is blocked briefly after marking read to prevent race conditions
 */

interface BadgeContextType {
  unreadNotifications: number;
  unreadMessages: number;
  totalBadgeCount: number;
  isFetching: boolean;
  fetchUnreadCount: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markMessagesAsRead: () => void;
  refreshBadges: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType>({
  unreadNotifications: 0,
  unreadMessages: 0,
  totalBadgeCount: 0,
  isFetching: false,
  fetchUnreadCount: async () => {},
  markAllNotificationsRead: async () => {},
  markMessagesAsRead: () => {},
  refreshBadges: async () => {},
});

export const useBadges = () => useContext(BadgeContext);

interface BadgeProviderProps {
  children: React.ReactNode;
  token: string | null;
  isGuest: boolean;
}

export function BadgeProvider({ children, token, isGuest }: BadgeProviderProps) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  
  // Prevent duplicate fetches
  const fetchingRef = useRef(false);
  // Track if we've done initial fetch for this token
  const initializedRef = useRef(false);
  // Store token to detect changes
  const tokenRef = useRef<string | null>(null);
  // Block notification refresh briefly after marking read (prevents race condition)
  const notificationRefreshBlockedUntil = useRef<number>(0);

  /**
   * AUTHORITATIVE: Fetch unread notification count from server
   * This is the ONLY way to set unreadNotifications
   */
  const fetchUnreadNotificationCount = useCallback(async (force: boolean = false) => {
    if (!token || isGuest) {
      setUnreadNotifications(0);
      return;
    }
    
    // Check if refresh is blocked (recently marked all as read)
    if (!force && Date.now() < notificationRefreshBlockedUntil.current) {
      console.log('🔔 Notification refresh blocked (recently marked as read)');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const count = data.unread_count || 0;
        console.log(`🔔 Server unread notification count: ${count}`);
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  }, [token, isGuest]);

  /**
   * Fetch unread message count from server
   */
  const fetchUnreadMessageCount = useCallback(async () => {
    if (!token || isGuest) {
      setUnreadMessages(0);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/conversations/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const count = data.unread_count || 0;
        console.log(`🔔 Server unread message count: ${count}`);
        setUnreadMessages(count);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  }, [token, isGuest]);

  /**
   * Fetch all badge counts from server
   */
  const fetchUnreadCount = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsFetching(true);
    
    try {
      await Promise.all([
        fetchUnreadNotificationCount(),
        fetchUnreadMessageCount()
      ]);
    } finally {
      fetchingRef.current = false;
      setIsFetching(false);
    }
  }, [fetchUnreadNotificationCount, fetchUnreadMessageCount]);

  /**
   * Mark all notifications as read on server
   * This is the ONLY way to clear the notification badge
   * Blocks refresh for 3 seconds to prevent race conditions
   */
  const markAllNotificationsRead = useCallback(async () => {
    if (!token || isGuest) return;
    
    try {
      console.log('🔔 Marking all notifications as read on server...');
      
      // Immediately set to 0 (optimistic, but server will confirm)
      setUnreadNotifications(0);
      
      // Block refresh for 3 seconds to prevent race condition
      notificationRefreshBlockedUntil.current = Date.now() + 3000;
      
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔔 Server confirmed: marked ${data.marked_count} notifications as read`);
        // Keep at 0 - server confirmed
        setUnreadNotifications(0);
      } else {
        console.error('🔔 Server error marking notifications as read');
        // On error, fetch fresh count after block expires
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [token, isGuest]);

  /**
   * Mark messages as read (clears message badge locally)
   * Note: The actual read status is managed by the conversation/message endpoints
   */
  const markMessagesAsRead = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  /**
   * Refresh all badges - calls server for authoritative counts
   */
  const refreshBadges = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Initialize on token change
  useEffect(() => {
    // Detect token change
    if (token !== tokenRef.current) {
      tokenRef.current = token;
      initializedRef.current = false;
      // Reset block on token change
      notificationRefreshBlockedUntil.current = 0;
    }
    
    if (token && !isGuest && !initializedRef.current) {
      initializedRef.current = true;
      fetchUnreadCount();
    } else if (!token || isGuest) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
    }
  }, [token, isGuest, fetchUnreadCount]);

  // Periodic refresh every 2 minutes
  useEffect(() => {
    if (!token || isGuest) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [token, isGuest, fetchUnreadCount]);

  // Calculate total badge count (notifications + messages for Explore tab)
  const totalBadgeCount = unreadNotifications + unreadMessages;

  const value: BadgeContextType = {
    unreadNotifications,
    unreadMessages,
    totalBadgeCount,
    isFetching,
    fetchUnreadCount,
    markAllNotificationsRead,
    markMessagesAsRead,
    refreshBadges,
  };

  return (
    <BadgeContext.Provider value={value}>
      {children}
    </BadgeContext.Provider>
  );
}

export { BadgeContext };
