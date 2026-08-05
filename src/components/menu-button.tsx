import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';

/** Bare hamburger button — opens the "More" sheet with links to everything
 * that doesn't have a tab of its own yet (quick quote, signage calculator,
 * gallery, blog, about, etc.). Usable directly as a Stack `headerRight`, or
 * via <HeaderMenuButtons />/<FixedTopBar /> elsewhere. */
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

/** Compact search+menu pair with no outer padding — drop straight into a
 * Stack screen's `headerRight` (the header already provides its own
 * padding/spacing), so every screen in a Stack gets fixed, non-scrolling
 * access via `screenOptions={{ headerRight: () => <HeaderMenuButtons /> }}`. */
export function HeaderMenuButtons() {
  return (
    <View style={styles.headerRow}>
      <SearchButton />
      <MenuButton />
    </View>
  );
}

/** For flat tab screens with no native Stack header (Home, Cart) — an
 * absolutely-positioned bar pinned to the top of the screen, rendered as a
 * sibling to the screen's ScrollView (never inside it) so it never scrolls
 * away. Pair with <FixedTopBarSpacer /> as the first child inside the
 * ScrollView's content so the bar doesn't cover the first bit of content. */
export function FixedTopBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fixedBar, { paddingTop: insets.top + Spacing.one }]} pointerEvents="box-none">
      <Image source={{ uri: `${SITE_ORIGIN}/logo.avif` }} style={styles.logo} contentFit="contain" />
      <View style={styles.headerRow}>
        <SearchButton />
        <MenuButton />
      </View>
    </View>
  );
}

export const FIXED_TOP_BAR_HEIGHT = 44;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fixedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.one,
  },
  logo: {
    width: 100,
    height: 28,
  },
  button: {
    padding: Spacing.one,
  },
});
