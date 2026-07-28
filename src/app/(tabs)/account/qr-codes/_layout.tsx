import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { HeaderMenuButtons } from '@/components/menu-button';
import { Colors } from '@/constants/theme';

export default function QrCodesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'QR Codes' }} />
      <Stack.Screen name="new" options={{ title: 'New QR Code' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit QR Code' }} />
    </Stack>
  );
}
