import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-store';

type ShopifyImageT = { url: string; altText: string | null };
type ShopifyMediaT =
  | { type: 'image'; url: string; altText: string | null }
  | { type: 'video'; url: string; mimeType: string; previewImageUrl: string | null; altText: string | null };
type SelectedOption = { name: string; value: string };
type Variant = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  image: ShopifyImageT | null;
};
type Option = { id: string; name: string; values: string[] };

type Product = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  featuredImage: ShopifyImageT | null;
  media: ShopifyMediaT[];
  options: Option[];
  variants: Variant[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

const screenWidth = Dimensions.get('window').width;

export default function ProductScreen() {
  const { handle, title: fallbackTitle, image: fallbackImage } = useLocalSearchParams<{
    handle: string;
    title: string;
    image: string;
  }>();
  const navigation = useNavigation();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<Product>(`/api/products/${handle}`)
      .then((data) => {
        setProduct(data);
        navigation.setOptions({ title: data.title });
        const first = data.variants[0];
        if (first) {
          const initial: Record<string, string> = {};
          for (const opt of first.selectedOptions) initial[opt.name] = opt.value;
          setSelected(initial);
        }
      })
      .catch(() => setLoadFailed(true));
  }, [handle, navigation]);

  const activeVariant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)) ??
      product.variants[0] ??
      null
    );
  }, [product, selected]);

  const images = useMemo(() => {
    if (!product) return [];
    const fromMedia = product.media
      .map((m) => (m.type === 'image' ? m.url : m.previewImageUrl))
      .filter((u): u is string => !!u);
    return fromMedia.length > 0 ? fromMedia : product.featuredImage ? [product.featuredImage.url] : [];
  }, [product]);

  function handleAddToCart() {
    if (!product || !activeVariant) return;
    const unitPrice = Number(activeVariant.price);
    addItem({
      kind: 'product',
      variantId: activeVariant.id,
      productTitle: product.title,
      title: product.title,
      subtitle: Object.entries(selected)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · '),
      thumbnail: images[0] ?? '',
      unitLabel: `$${unitPrice.toFixed(2)} each`,
      selectedOptions: selected,
      qty: 1,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
    });
    Alert.alert('Added to cart', product.title, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  }

  if (!product && !loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        {!!fallbackImage && (
          <Image source={{ uri: fallbackImage }} style={styles.fallbackImage} contentFit="cover" />
        )}
        <ActivityIndicator style={{ marginTop: Spacing.three }} />
      </ScreenBackground>
    );
  }

  if (loadFailed || !product) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">
          {fallbackTitle ? `Couldn't load "${fallbackTitle}".` : "Couldn't load this product."}
        </ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {images.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {images.map((url) => (
              <ThemedView key={url} type="backgroundElement" style={styles.galleryImageWrap}>
                <Image source={{ uri: url }} style={styles.galleryImage} contentFit="cover" />
              </ThemedView>
            ))}
          </ScrollView>
        )}

        <ThemedText type="title" style={styles.title}>
          {product.title}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.price}>
          {activeVariant ? `$${Number(activeVariant.price).toFixed(2)}` : 'View options'}
        </ThemedText>

        {activeVariant && !activeVariant.availableForSale && (
          <ThemedText style={styles.soldOut}>Currently unavailable</ThemedText>
        )}

        {product.options.map((opt) => (
          <View key={opt.id} style={styles.optionGroup}>
            <ThemedText type="smallBold" style={styles.optionLabel}>
              {opt.name}
            </ThemedText>
            <View style={styles.optionValues}>
              {opt.values.map((value) => {
                const isActive = selected[opt.name] === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelected((prev) => ({ ...prev, [opt.name]: value }))}
                    style={[styles.chip, isActive && styles.chipActive]}>
                    <ThemedText
                      type="small"
                      style={isActive ? styles.chipTextActive : undefined}
                      themeColor={isActive ? undefined : 'textSecondary'}>
                      {value}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {!!product.descriptionHtml && (
          <ThemedText themeColor="textSecondary" style={styles.description}>
            {stripHtml(product.descriptionHtml)}
          </ThemedText>
        )}

        <Pressable
          style={[styles.cartButton, activeVariant && !activeVariant.availableForSale && styles.cartButtonDisabled]}
          disabled={!activeVariant || !activeVariant.availableForSale}
          onPress={handleAddToCart}>
          <ThemedText type="smallBold" style={styles.cartButtonText}>
            {activeVariant && !activeVariant.availableForSale ? 'Unavailable' : 'Add to Cart'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  fallbackImage: { width: 160, height: 160, borderRadius: Spacing.three },
  content: {
    paddingBottom: Spacing.six,
  },
  gallery: {
    width: screenWidth,
    aspectRatio: 1,
  },
  galleryImageWrap: {
    width: screenWidth,
    height: '100%',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  price: {
    color: Brand.cyan,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  soldOut: {
    color: Brand.magenta,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  optionGroup: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  optionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
  chipTextActive: {
    color: Brand.yellow,
  },
  description: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    lineHeight: 21,
  },
  cartButton: {
    marginTop: Spacing.five,
    marginHorizontal: Spacing.four,
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cartButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  cartButtonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
