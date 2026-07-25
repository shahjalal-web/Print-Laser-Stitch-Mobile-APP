import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

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
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    api
      .get<CollectionDetail>(`/api/collections/${handle}`)
      .then((data) => {
        setCollection(data);
        navigation.setOptions({ title: data.title });
      })
      .catch(() => setLoadFailed(true));
  }, [handle, navigation]);

  if (!collection && !loadFailed) {
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
                {item.featuredImage && (
                  <Image source={{ uri: item.featuredImage.url }} style={styles.image} contentFit="cover" />
                )}
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: Spacing.one,
  },
});
