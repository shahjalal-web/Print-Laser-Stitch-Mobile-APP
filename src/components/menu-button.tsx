import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

/** Bare hamburger button — opens the "More" sheet with links to everything
 * that doesn't have a tab of its own yet (quick quote, signage calculator,
 * gallery, blog, about, etc.). Usable directly as a Stack `headerRight`, or
 * via <MenuButtonRow /> on flat tab screens that have no native header. */
export function MenuButton() {
  return (
    <Pressable style={styles.button} onPress={() => router.push('/more')} hitSlop={8}>
      <Ionicons name="menu-outline" size={24} color="#f5f5f5" />
    </Pressable>
  );
}

export function SearchButton() {
  return (
    <Pressable style={styles.button} onPress={() => router.push('/search')} hitSlop={8}>
      <Ionicons name="search-outline" size={22} color="#f5f5f5" />
    </Pressable>
  );
}

export function MenuButtonRow() {
  return (
    <View style={styles.row}>
      <SearchButton />
      <MenuButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  button: {
    padding: Spacing.one,
  },
});
