import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

type GalleryItem = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mainCategoryHandle: string;
  mainCategoryLabel: string;
  subCategory: string | null;
};

export default function GalleryScreen() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<GalleryItem[]>('/api/admin/gallery')
      .then(setItems)
      .catch(() => setLoadFailed(true));
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items ?? []) {
      if (!seen.has(item.mainCategoryHandle)) seen.set(item.mainCategoryHandle, item.mainCategoryLabel);
    }
    return Array.from(seen, ([handle, label]) => ({ handle, label }));
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return selected ? items.filter((i) => i.mainCategoryHandle === selected) : items;
  }, [items, selected]);

  if (!items && !loadFailed) {
    return (
      <ThemedView style={styles.centerFlex}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (loadFailed) {
    return (
      <ThemedView style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load the gallery.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        {categories.length > 0 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ handle: null, label: 'All' }, ...categories]}
            keyExtractor={(c) => c.handle ?? 'all'}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item: c }) => {
              const isActive = selected === c.handle;
              return (
                <Pressable onPress={() => setSelected(c.handle)} style={[styles.chip, isActive && styles.chipActive]}>
                  <ThemedText type="small" themeColor={isActive ? undefined : 'textSecondary'} style={isActive ? { color: Brand.yellow } : undefined}>
                    {c.label}
                  </ThemedText>
                </Pressable>
              );
            }}
          />
        )}

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {items && items.length === 0 ? 'Our gallery is being updated — check back soon.' : 'No projects in this category yet.'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => item.mediaType === 'video' && WebBrowser.openBrowserAsync(item.mediaUrl)}>
              <ThemedView type="backgroundElement" style={styles.imageWrap}>
                <Image source={{ uri: item.mediaUrl }} style={styles.image} contentFit="cover" />
                {item.mediaType === 'video' && (
                  <View style={styles.playBadge}>
                    <ThemedText style={styles.playIcon}>▶</ThemedText>
                  </View>
                )}
              </ThemedView>
              {!!item.subCategory && (
                <ThemedText type="small" numberOfLines={1} style={styles.caption}>
                  {item.subCategory}
                </ThemedText>
              )}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  centerText: { textAlign: 'center', marginTop: Spacing.six },
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  chipActive: {
    borderColor: Brand.yellow,
    backgroundColor: 'rgba(217, 240, 0, 0.12)',
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    gap: 2,
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
  playBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  caption: {
    marginTop: Spacing.one,
  },
});
