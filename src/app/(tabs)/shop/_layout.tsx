import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { HeaderMenuButtons } from '@/components/menu-button';
import { Colors } from '@/constants/theme';

export default function ShopLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <HeaderMenuButtons />,
      }}>
      <Stack.Screen name="index" options={{ title: 'Shop' }} />
      <Stack.Screen name="[handle]" options={{ title: '' }} />
      <Stack.Screen name="product/[handle]" options={{ title: '' }} />
      {/* Own nested _layout.tsx handles their headers — suppress this
          stack's header so they don't get a second one stacked on top. */}
      <Stack.Screen name="vehicle-stickers" options={{ headerShown: false }} />
      <Stack.Screen name="gallery" options={{ headerShown: false }} />
      <Stack.Screen name="vinyl-stickers" options={{ title: 'Custom Vinyl Stickers' }} />
      <Stack.Screen name="vinyl-stickers-proof" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="decal-quote" options={{ title: 'Quick Quote' }} />
      <Stack.Screen name="signage-quotes" options={{ title: 'Decal Signage Calculator' }} />
      <Stack.Screen name="about" options={{ title: 'About Us' }} />
      <Stack.Screen name="template-fit/[handle]" options={{ title: 'Fit Your Design' }} />
    </Stack>
  );
}
