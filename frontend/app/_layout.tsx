import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider, useCart } from '../contexts/CartContext';
import { BadgeProvider } from '../contexts/BadgeContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OnboardingFunnelProvider } from '../contexts/OnboardingFunnelContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { AchievementsProvider } from '../contexts/AchievementsContext';
import { DraftsProvider } from '../contexts/DraftsContext';
import { HealthProvider } from '../contexts/HealthContext';
import HealthOnboardingGate from '../components/HealthOnboardingGate';
import { PaywallModal } from '../components/PaywallModal';
import { FoundingMemberGate } from '../components/FoundingMemberGate';
import { LegalReacceptGate } from '../components/LegalReacceptGate';
import { FunnelEntryGate } from '../components/FunnelEntryGate';
import ProfilePicPromptGate from '../components/ProfilePicPromptGate';
import { Analytics } from '../utils/analytics';
import { initNotifications, notificationService } from '../utils/notifications';
import FloatingCart from '../components/FloatingCart';
import DevPill from '../components/DevPill';
import ErrorBoundary from '../components/ErrorBoundary';
import AppBootstrap from '../components/AppBootstrap';
import { ForceUpdateGate } from '../components/ForceUpdateGate';
import { AddWorkoutCoachmarkProvider } from '../components/AddWorkoutCoachmark';
import { FoundingOfferModal } from '../components/FoundingOfferModal';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { installErrorReporter } from '../utils/errorReporter';
import DraftRouteTracker from '../components/DraftRouteTracker';

// Phase 3 — lightweight crash telemetry (reports unhandled JS errors to the
// backend). Installed at module load so it catches errors from app startup.
installErrorReporter();

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might already be hidden
});

// App State Tracker Component
function AppStateTracker() {
  const { token } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (token) {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          Analytics.appOpened(token);
        } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
          Analytics.appBackgrounded(token);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token]);

  return null;
}

/**
 * Runs initNotifications() automatically when a user is authenticated.
 * Fires once after login and once on every authenticated cold-start.
 * Also re-runs when app returns to foreground (in case user toggled
 * permissions in OS Settings).
 * Injects cart + router into the notification service for deep-link navigation.
 * Signals navigation-ready once this component is mounted (it lives inside
 * the Stack, so the router is guaranteed usable at this point).
 */
function NotificationInitializer() {
  const { token, isGuest } = useAuth();
  const { replaceCart } = useCart();
  const router = useRouter();
  const initDoneForToken = useRef<string | null>(null);
  const coldStartChecked = useRef(false);

  // Inject nav context into the notification service whenever it changes
  useEffect(() => {
    notificationService.setNavContext(replaceCart, router);
  }, [replaceCart, router]);

  // Signal navigation ready on first mount — this component renders inside
  // <Stack> so the router is guaranteed to be usable. This drains any
  // pending notification responses that were queued before nav was ready.
  useEffect(() => {
    notificationService.onNavigationReady();
  }, []);

  // V2.1 — Tap HANDLING must not depend on auth.
  //
  // setupListeners() and handleColdStartNotification() used to sit behind
  // `if (!token || isGuest) return`, so a guest — or any user whose stored
  // token hadn't finished restoring at the moment they tapped — registered no
  // listener at all and never drained the cold-start queue. Worse,
  // onNavigationReady() fires unconditionally, so the queue was drained before
  // the listener that fills it existed: the tap was simply lost.
  //
  // Registering a listener requires no credentials. Only token REGISTRATION
  // (initNotifications, which POSTs a device token) genuinely needs auth, so
  // that stays gated in the effect below.
  const listenersReady = useRef(false);
  useEffect(() => {
    if (listenersReady.current) return;
    listenersReady.current = true;

    notificationService.setupListeners();
    if (!coldStartChecked.current) {
      coldStartChecked.current = true;
      notificationService.handleColdStartNotification();
    }
  }, []);

  // Auto-init on first auth or token change (login / app restore).
  // Token registration + analytics attribution only — needs a real user.
  useEffect(() => {
    if (!token || isGuest) return;
    if (initDoneForToken.current === token) return; // already ran for this token
    initDoneForToken.current = token;

    // Fire-and-forget; don't block rendering
    (async () => {
      console.log('🔔 NotificationInitializer: running initNotifications');
      notificationService.setAuthToken(token);
      await initNotifications(token);
    })();
  }, [token, isGuest]);

  // Re-check when app returns from background (user may have changed OS perm)
  useEffect(() => {
    if (!token || isGuest) return;

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && token) {
        // Re-run init to pick up any permission changes
        initNotifications(token).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [token, isGuest]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => notificationService.cleanup();
  }, []);

  return null;
}

// Navigation stack configuration
function NavigationStack() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: styles.screenContent,
        animation: 'default'
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="shared-workout" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name='workout-session' options={{ headerShown: false }} />
      <Stack.Screen name='settings' options={{ headerShown: false }} />
      <Stack.Screen name="admin-add-workout" options={{ headerShown: false }} />
      <Stack.Screen name="saved-builds" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/medical-disclaimer" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="onboarding/health-connect" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen
        name="pulse-sync"
        options={{
          headerShown: false,
          gestureEnabled: false,
          // Full-screen take-over so the achievement screen + tab bar are
          // hidden during the magic moment. Fades in via Reanimated, so we
          // suppress the native push transition to avoid a double-animation.
          animation: 'fade',
          animationDuration: 0,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen name="onboarding-funnel" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="dev/screens" options={{ headerShown: false }} />
    </Stack>
  );
}

// Main App Content
function AppContent() {
  return (
    <ForceUpdateGate>
      <AddWorkoutCoachmarkProvider>
        <AppStateTracker />
        <NotificationInitializer />
        <HealthOnboardingGate />
        <NavigationStack />
        <FloatingCart />
        <DevPill />
        <FoundingMemberGate />
        <FoundingOfferModal />
        <LegalReacceptGate />
        <FunnelEntryGate />
        <ProfilePicPromptGate />
        <PaywallModal />
        <ConnectionBanner />
      </AddWorkoutCoachmarkProvider>
    </ForceUpdateGate>
  );
}

// Providers wrapper with auth context consumer for BadgeProvider
function BadgeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { token, isGuest } = useAuth();
  return (
    <BadgeProvider token={token} isGuest={isGuest}>
      {children}
    </BadgeProvider>
  );
}

// Providers wrapper
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <DraftsProvider>
          {/* V2.1 — keeps an in-progress Saved Build's resume_route pointed at the
              screen the user is actually on, now that drafts start at intensity
              confirm rather than at the cart. Renders nothing. */}
          <DraftRouteTracker />
          <BadgeProviderWrapper>
            <OnboardingProvider>
              <OnboardingFunnelProvider>
                <SubscriptionProvider>
                  <HealthProvider>
                    <AchievementsProvider>{children}</AchievementsProvider>
                  </HealthProvider>
                </SubscriptionProvider>
              </OnboardingFunnelProvider>
            </OnboardingProvider>
          </BadgeProviderWrapper>
        </DraftsProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appReady, setAppReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const splashHiddenRef = useRef(false);

  // Handle app ready - hide splash screen
  const handleAppReady = useCallback(async () => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    
    console.log('RootLayout: App ready, hiding splash screen');
    setAppReady(true);
    
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore - splash screen might already be hidden
    }
  }, []);

  // Handle error boundary retry
  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
    splashHiddenRef.current = false;
  }, []);

  // Safety timeout - hide splash screen after 4 seconds no matter what
  // AppBootstrap handles the 3-second boot, this is a fallback
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!splashHiddenRef.current) {
        console.warn('RootLayout: Safety timeout - forcing splash hide');
        splashHiddenRef.current = true;
        try {
          await SplashScreen.hideAsync();
        } catch (e) {}
        setAppReady(true);
      }
    }, 4000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Show solid black while fonts load (never white)
  if (!fontsLoaded && !fontError) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <StatusBar style="light" backgroundColor='#000000' translucent={false} />
      <SafeAreaProvider style={styles.rootContainer}>
        <ErrorBoundary key={retryKey} onRetry={handleRetry}>
          <AppProviders>
            <AppBootstrap onReady={handleAppReady}>
              <AppContent />
            </AppBootstrap>
          </AppProviders>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenContent: {
    backgroundColor: '#000000',
  },
});
