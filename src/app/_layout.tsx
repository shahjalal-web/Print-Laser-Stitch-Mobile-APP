import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HeaderMenuButtons } from '@/components/menu-button';
import { AuthProvider } from '@/lib/auth-store';
import { CartProvider } from '@/lib/cart-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <CartProvider>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="vehicle-stickers" />
              <Stack.Screen name="gallery" />
              <Stack.Screen name="search" options={{ presentation: 'modal', headerShown: true, title: 'Search' }} />
              <Stack.Screen name="more" options={{ presentation: 'modal', headerShown: true, title: 'More' }} />
              <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: true, title: 'Log In' }} />
              <Stack.Screen name="signup" options={{ presentation: 'modal', headerShown: true, title: 'Sign Up' }} />
              <Stack.Screen
                name="template-fit/[handle]"
                options={{ headerShown: true, title: 'Fit Your Design', headerRight: () => <HeaderMenuButtons /> }}
              />
              <Stack.Screen
                name="vinyl-stickers"
                options={{ headerShown: true, title: 'Custom Vinyl Stickers', headerRight: () => <HeaderMenuButtons /> }}
              />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
