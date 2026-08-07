import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NetworkImage } from '@/components/network-image';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { useCart } from '@/lib/cart-store';
import type { VehicleSticker } from './index';

type PartKey = 'hoodSet' | 'bedside' | 'fullSet' | 'top';

const PART_LABELS: Record<PartKey, string> = {
  hoodSet: 'Hood Set',
  bedside: 'Bedside',
  fullSet: 'Full Set',
  top: 'Back',
};
const PART_ICONS: Record<PartKey, string> = {
  hoodSet: '🚘',
  bedside: '🛻',
  fullSet: '✨',
  top: '🔙',
};
const ALL_PARTS: PartKey[] = ['hoodSet', 'bedside', 'fullSet', 'top'];

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { addItem, items } = useCart();

  const { data: vehicles, isLoading, error } = useApiQuery<VehicleSticker[]>('/api/admin/vehicles');
  const vehicle = useMemo(() => vehicles?.find((x) => x.id === id) ?? null, [vehicles, id]);
  const loadFailed = !isLoading && (!!error || !vehicle);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    if (!vehicle) return;
    navigation.setOptions({ title: `${vehicle.make} ${vehicle.model}` });
    setYear((current) => current ?? vehicle.years[vehicle.years.length - 1]);
  }, [vehicle, navigation]);

  const sortedYears = useMemo(() => (vehicle ? [...vehicle.years].sort((a, b) => b - a) : []), [vehicle]);

  function isInCart(part: PartKey): boolean {
    if (!vehicle || !year) return false;
    return items.some(
      (i) => i.kind === 'vehicle-sticker' && i.make === vehicle.make && i.model === vehicle.model && i.year === year && i.part === part,
    );
  }

  function handleAdd(part: PartKey) {
    if (!vehicle || !year || isInCart(part)) return;
    const info = vehicle.parts[part];
    if (!info) return;
    const label = `${year} ${vehicle.make} ${vehicle.model}`;
    addItem({
      kind: 'vehicle-sticker',
      title: `Vehicle Sticker Kit — ${label}`,
      subtitle: PART_LABELS[part],
      thumbnail: info.imageUrls?.[0] ?? info.imageUrl ?? '',
      unitLabel: `$${info.price.toFixed(2)}`,
      totalPrice: info.price,
      quantity: 1,
      make: vehicle.make,
      model: vehicle.model,
      year,
      part,
      partLabel: PART_LABELS[part],
    });
    Alert.alert('Added to cart', `${PART_LABELS[part]} for ${label}`);
  }

  if (!vehicle && !loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed || !vehicle) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load this vehicle.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Year
        </ThemedText>
        <View style={styles.yearRow}>
          {sortedYears.map((y) => {
            const isActive = year === y;
            return (
              <Pressable key={y} onPress={() => setYear(y)} style={[styles.yearChip, isActive && styles.yearChipActive]}>
                <ThemedText type="small" themeColor={isActive ? undefined : 'textSecondary'} style={isActive ? { color: Brand.cyan } : undefined}>
                  {y}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Choose a set
        </ThemedText>
        <View style={styles.partsGrid}>
          {ALL_PARTS.map((part) => {
            const info = vehicle.parts[part];
            if (!info) return null;
            const inCart = isInCart(part);
            const img = info.imageUrls?.[0] ?? info.imageUrl;
            return (
              <View key={part} style={styles.partCard}>
                <ThemedView type="backgroundElement" style={styles.partImageWrap}>
                  <NetworkImage
                    uri={img}
                    width={170}
                    style={styles.partImage}
                    contentFit="cover"
                    fallback={<ThemedText style={styles.partIcon}>{PART_ICONS[part]}</ThemedText>}
                  />
                </ThemedView>
                <ThemedText type="smallBold">{PART_LABELS[part]}</ThemedText>
                {!!info.skinName && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {info.skinName}
                  </ThemedText>
                )}
                <ThemedText type="subtitle" style={{ color: Brand.yellow, fontSize: 20 }}>
                  ${info.price.toFixed(2)}
                </ThemedText>
                <Pressable
                  disabled={inCart}
                  onPress={() => handleAdd(part)}
                  style={[styles.addButton, inCart && styles.addButtonDisabled]}>
                  <ThemedText type="smallBold" style={inCart ? styles.addButtonTextDisabled : styles.addButtonText}>
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  yearChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  yearChipActive: {
    borderColor: Brand.cyan,
    backgroundColor: 'rgba(24, 211, 232, 0.12)',
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  partCard: {
    width: '47%',
    gap: 2,
  },
  partImageWrap: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  partImage: {
    width: '100%',
    height: '100%',
  },
  partIcon: {
    fontSize: 40,
  },
  addButton: {
    marginTop: Spacing.two,
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(24, 211, 232, 0.15)',
  },
  addButtonText: {
    color: '#000000',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  addButtonTextDisabled: {
    color: Brand.cyan,
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
