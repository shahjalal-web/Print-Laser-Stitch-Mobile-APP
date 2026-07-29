import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';

type PartKey = 'hoodSet' | 'bedside' | 'fullSet' | 'top';

type StickerPart = {
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  skinName?: string;
};

export type VehicleSticker = {
  id: string;
  make: string;
  model: string;
  years: number[];
  imageUrl?: string;
  parts: Partial<Record<PartKey, StickerPart>>;
};

export default function VehicleStickersScreen() {
  const {
    data: vehicles,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useApiQuery<VehicleSticker[]>('/api/admin/vehicles');
  const loadFailed = !isLoading && !vehicles && !!error;
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');

  const makes = useMemo(() => [...new Set((vehicles ?? []).map((v) => v.make))].sort(), [vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (vehicles ?? []).filter((v) => {
      if (make && v.make !== make) return false;
      if (q && !`${v.make} ${v.model}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [vehicles, make, search]);

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
        <ThemedText themeColor="textSecondary">Couldn&apos;t load vehicles right now. Pull down to try again.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <View style={styles.filters}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search make or model…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...makes]}
            keyExtractor={(m) => m}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item: m }) => {
              const isActive = m === 'All' ? make === '' : make === m;
              return (
                <Pressable
                  onPress={() => setMake(m === 'All' ? '' : m)}
                  style={[styles.chip, isActive && styles.chipActive]}>
                  <ThemedText type="small" themeColor={isActive ? undefined : 'textSecondary'} style={isActive ? styles.chipTextActive : undefined}>
                    {m}
                  </ThemedText>
                </Pressable>
              );
            }}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={Brand.cyan} />}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              No vehicles found.
            </ThemedText>
          }
          renderItem={({ item: v }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: '/vehicle-stickers/[id]', params: { id: v.id } })}>
              <ThemedView type="backgroundElement" style={styles.imageWrap}>
                {v.imageUrl ? (
                  <Image source={{ uri: v.imageUrl }} style={styles.image} contentFit="cover" />
                ) : (
                  <ThemedText style={styles.imageFallback}>🚗</ThemedText>
                )}
              </ThemedView>
              <ThemedText type="smallBold" numberOfLines={1}>
                {v.make}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {v.model} · {v.years[0]}–{v.years[v.years.length - 1]}
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
  filters: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  chipRow: {
    gap: Spacing.two,
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
    borderColor: Brand.cyan,
    backgroundColor: 'rgba(24, 211, 232, 0.12)',
  },
  chipTextActive: {
    color: Brand.cyan,
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
    aspectRatio: 4 / 3,
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
});
