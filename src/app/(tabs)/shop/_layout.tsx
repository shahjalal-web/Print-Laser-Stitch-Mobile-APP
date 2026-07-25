import { Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';

import { MenuButton, SearchButton } from '@/components/menu-button';
import { Colors, Spacing } from '@/constants/theme';

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
      <Stack.Screen
        name="index"
        options={{
          title: 'Shop',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <SearchButton />
              <MenuButton />
            </View>
          ),
        }}
      />
      <Stack.Screen name="[handle]" options={{ title: '' }} />
      <Stack.Screen name="product/[handle]" options={{ title: '' }} />
    </Stack>
  );
}
