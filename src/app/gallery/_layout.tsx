import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { HeaderMenuButtons } from '@/components/menu-button';
import { Colors } from '@/constants/theme';

export default function GalleryLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Gallery' }} />
    </Stack>
  );
}
