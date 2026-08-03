import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CategoryTheme } from '@/lib/category-themes';

/** Diagonal-split category card — matches the website's CategoryGrid.tsx,
 * shared between the homepage "Make your selection" section and the Shop
 * tab (mirrors the website reusing the same component for the homepage
 * grid and /collections). */
export function CategoryCard({
  title,
  description,
  imageUrl,
  theme,
  onPress,
}: {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  theme: CategoryTheme;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={[theme.base, theme.base, theme.diagonal, theme.diagonal]}
        locations={[0, 0.35, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={2} style={[styles.heading, { color: theme.heading }]}>
          {title}
        </ThemedText>
        {!!description && (
          <ThemedText type="small" numberOfLines={2} style={{ color: theme.desc }}>
            {description}
          </ThemedText>
        )}
        <LinearGradient
          colors={['#7ed957', '#3fa34d', '#2c8a3e']}
          locations={[0, 0.65, 1]}
          style={styles.shopNowPill}>
          <ThemedText type="small" style={styles.shopNowText}>
            Shop Now
          </ThemedText>
        </LinearGradient>
      </View>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
      ) : (
        <View style={styles.imageFallback}>
          <ThemedText style={styles.imageFallbackEmoji}>🗂️</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    minHeight: 140,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  text: {
    flex: 1.2,
    padding: Spacing.three,
    justifyContent: 'center',
    gap: 4,
  },
  heading: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  image: {
    flex: 1,
    margin: Spacing.two,
  },
  imageFallback: {
    flex: 1,
    margin: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackEmoji: {
    fontSize: 44,
  },
  shopNowPill: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
  },
  shopNowText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
