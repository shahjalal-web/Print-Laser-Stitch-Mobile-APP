import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkImage } from '@/components/network-image';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';

type CollectionProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: { url: string; altText: string | null } | null;
  minPrice: string | null;
  currencyCode: string | null;
};

type CollectionDetail = {
  id: string;
  handle: string;
  title: string;
  description: string;
  products: CollectionProduct[];
};

export default function CategoryScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const navigation = useNavigation();
  const {
    data: collection,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useApiQuery<CollectionDetail>(handle ? `/api/collections/${handle}` : null);
  const loadFailed = !isLoading && !collection && !!error;

  useEffect(() => {
    if (collection) navigation.setOptions({ title: collection.title });
  }, [collection, navigation]);

  if (isLoading) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed || !collection) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load this category.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <FlatList
          data={collection.products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              No products in this category yet.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/shop/product/[handle]',
                  params: {
                    handle: item.handle,
                    title: item.title,
                    image: item.featuredImage?.url ?? '',
                    price: item.minPrice ?? '',
                  },
                })
              }>
              <ThemedView type="backgroundElement" style={styles.imageWrap}>
                <NetworkImage
                  uri={item.featuredImage?.url}
                  width={170}
                  style={styles.image}
                  contentFit="cover"
                  fallback={<ThemedText style={styles.imageFallback}>🗂️</ThemedText>}
                />
              </ThemedView>
              <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.minPrice ? `From $${Number(item.minPrice).toFixed(2)}` : 'View options'}
              </ThemedText>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  centerText: { textAlign: 'center', marginTop: Spacing.six },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    gap: Spacing.one,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    fontSize: 40,
  },
  title: {
    marginTop: Spacing.one,
  },
});
