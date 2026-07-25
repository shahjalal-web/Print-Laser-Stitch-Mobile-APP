import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/lib/auth-store';
import { CartProvider } from '@/lib/cart-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
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
          </Stack>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
