import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HeaderBackButton } from '@/components/menu-button';
import { AuthProvider } from '@/lib/auth-store';
import { CartProvider } from '@/lib/cart-store';
import { CrashScreen, ErrorBoundary, installGlobalErrorHandler, useGlobalCrashError } from '@/lib/crash-diagnostics';

installGlobalErrorHandler();
SplashScreen.preventAutoHideAsync();
// Screens (and every animated background/effect they own — see
// AmbientBackground) get frozen once they're no longer focused, instead of
// running forever in the background as the user navigates deeper into the
// stack. Without this, every screen's drifting-orb animation keeps consuming
// CPU indefinitely, and they stack up as more screens get pushed.
enableFreeze(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const globalCrash = useGlobalCrashError();

  if (globalCrash) {
    return <CrashScreen {...globalCrash} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <CartProvider>
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="search" options={{ presentation: 'modal', headerShown: true, title: 'Search' }} />
                <Stack.Screen name="more" options={{ presentation: 'modal', headerShown: true, title: 'More' }} />
                <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: true, title: 'Log In' }} />
                <Stack.Screen
                  name="signup"
                  options={{ presentation: 'modal', headerShown: true, title: 'Sign Up', headerLeft: () => <HeaderBackButton /> }}
                />
              </Stack>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
