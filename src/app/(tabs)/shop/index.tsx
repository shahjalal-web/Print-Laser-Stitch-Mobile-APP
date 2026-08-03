import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/category-card';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { themeForCategory } from '@/lib/category-themes';

type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
  productsCount: number;
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
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
          renderItem={({ item, index }) => (
            <CategoryCard
              title={item.title}
              description={item.description}
              imageUrl={item.image?.url}
              theme={themeForCategory(item.handle, index)}
              onPress={() => router.push({ pathname: '/shop/[handle]', params: { handle: item.handle } })}
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
