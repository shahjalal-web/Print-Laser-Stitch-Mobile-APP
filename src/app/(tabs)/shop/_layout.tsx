import { Stack } from 'expo-router';

import { MenuButton } from '@/components/menu-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function ShopLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ title: 'Shop', headerRight: () => <MenuButton /> }} />
      <Stack.Screen name="[handle]" options={{ title: '' }} />
      <Stack.Screen name="product/[handle]" options={{ title: '' }} />
    </Stack>
  );
}
