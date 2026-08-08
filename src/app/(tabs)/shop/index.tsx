import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/category-card';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { themeForCategory, type CategoryTheme } from '@/lib/category-themes';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';

type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
  productsCount: number;
};

// Not a real Shopify collection — the Custom Vinyl Sticker Builder is its own
// configurator (`/shop/vinyl-stickers`), so it can't come back from
// `/api/collections`. The Home tab already has its own dedicated promo
// section for it; this is a Shop-tab-only addition, pinned first, so it
// doesn't touch the shared `collections` data Home also reads from (which
// would've made it show up there too).
const VINYL_STICKERS_HANDLE = '__vinyl-stickers-configurator__';
const VINYL_STICKERS_CARD: Collection = {
  id: VINYL_STICKERS_HANDLE,
  handle: VINYL_STICKERS_HANDLE,
  title: 'Custom Vinyl Stickers',
  description: 'Upload your artwork, pick a shape, size and finish, then see an instant proof before you check out.',
  image: { url: `${SITE_ORIGIN}/vinyl-sticker-logo.png`, altText: null },
  productsCount: 0,
};
const VINYL_STICKERS_THEME: CategoryTheme = {
  base: '#ffb366',
  diagonal: '#ff8c1a',
  heading: '#5c2e00',
  desc: '#6b3a00',
};

export default function ShopScreen() {
  const { data: collections, isLoading, isRefreshing, error, refetch } = useApiQuery<Collection[]>('/api/collections');
  const loadFailed = !isLoading && !collections && !!error;

  if (isLoading) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load the catalog. Pull down to try again later.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <FlatList
          data={collections ? [VINYL_STICKERS_CARD, ...collections] : collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
          renderItem={({ item, index }) => (
            <CategoryCard
              title={item.title}
              description={item.description}
              imageUrl={item.image?.url}
              theme={item.handle === VINYL_STICKERS_HANDLE ? VINYL_STICKERS_THEME : themeForCategory(item.handle, index)}
              onPress={() =>
                item.handle === VINYL_STICKERS_HANDLE
                  ? router.push('/shop/vinyl-stickers')
                  : router.push({ pathname: '/shop/[handle]', params: { handle: item.handle } })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  list: {
    padding: Spacing.four,
  },
  separator: {
    height: Spacing.three,
    backgroundColor: 'transparent',
  },
});
