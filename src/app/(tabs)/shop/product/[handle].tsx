import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ExpandableText } from '@/components/expandable-text';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EMPTY_UPLOAD_SLOT, pickAndUpload, UploadBox, type UploadSlot } from '@/components/template-fit/upload-box';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { useCart } from '@/lib/cart-store';
import { colorHex, isColorOptionName } from '@/lib/colors';
import { downloadAndShareBlankTemplate } from '@/lib/template-fit/blank-template';
import { HOW_TO_ORDER_VIDEO_IDS } from '@/lib/how-to-order-videos';
import { BLEED_IN } from '@/lib/template-fit/constants';
import { detectTemplateFit, type TemplateFitOverrides } from '@/lib/template-fit/detect';
import { findDimensionOption } from '@/lib/parse-size';
import {
  DEFAULT_APPAREL_MIN_QUANTITY,
  detectMinQuantityFromTitle,
  hasApparelSizes,
  isQuantityOptionName,
  isSizeOptionName,
} from '@/lib/product-quantity';
import type { TemplateFitPayload } from '@/lib/template-fit/types';

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
  templateFitOverrides?: TemplateFitOverrides;
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

  const {
    data: product,
    isLoading,
    isRefreshing,
    error: loadError,
    refetch,
  } = useApiQuery<Product>(handle ? `/api/products/${handle}` : null);
  const loadFailed = !isLoading && !product && !!loadError;
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  // Multi-color mode: every color's quantities live in colorSizeQty (so
  // switching colors never loses what was already entered), but only
  // `activeColor`'s size×qty matrix is shown at a time — better fit for a
  // phone screen than the website's "every added color stays open" layout.
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [colorSizeQty, setColorSizeQty] = useState<Record<string, Record<string, number>>>({});
  const [quantity, setQuantity] = useState(1);
  const [frontUpload, setFrontUpload] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [backUpload, setBackUpload] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [printSide, setPrintSide] = useState<'front' | 'both'>('front');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const sizeOption = useMemo(
    () => product?.options.find((o) => isSizeOptionName(o.name)) ?? null,
    [product],
  );
  // Apparel (Size option with S/M/L-style values) gets a per-size quantity
  // matrix with a minimum order size — everything else (banners, business
  // cards, dimensional "Size" like 4x6…) keeps the single chip picker.
  const isApparel = useMemo(
    () => (sizeOption ? hasApparelSizes(sizeOption.values) : false),
    [sizeOption],
  );
  // Apparel with a Color option gets a "pick your colors" matrix — one
  // size×quantity grid per chosen color — instead of a single-pick Color
  // chip, mirroring the website's TShirtConfigurator multi-color mode.
  const colorOption = useMemo(
    () => product?.options.find((o) => isColorOptionName(o.name)) ?? null,
    [product],
  );
  const multiColor = isApparel && !!colorOption;
  const hasQuantityVariantOption = useMemo(
    () => product?.options.some((o) => isQuantityOptionName(o.name)) ?? false,
    [product],
  );
  const minQuantity = useMemo(() => {
    if (!product) return 1;
    const fromTitle = detectMinQuantityFromTitle(product.title);
    if (isApparel) return fromTitle ?? DEFAULT_APPAREL_MIN_QUANTITY;
    return fromTitle ?? 1;
  }, [product, isApparel]);

  // Only seed `selected`/quantities once per handle — a background
  // revalidation shouldn't clobber options the customer has already picked.
  const initializedHandle = useRef<string | null>(null);
  useEffect(() => {
    if (!product) return;
    navigation.setOptions({ title: product.title });
    if (initializedHandle.current === handle) return;
    initializedHandle.current = handle;
    const first = product.variants[0];
    if (first) {
      const initial: Record<string, string> = {};
      for (const opt of first.selectedOptions) initial[opt.name] = opt.value;
      setSelected(initial);
    }
    setSizeQuantities({});
    setActiveColor(null);
    setColorSizeQty({});
    const fromTitle = detectMinQuantityFromTitle(product.title);
    setQuantity(fromTitle ?? 1);
  }, [product, navigation, handle]);

  const activeVariant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)) ??
      product.variants[0] ??
      null
    );
  }, [product, selected]);

  function findVariantForSize(size: string) {
    if (!product || !sizeOption) return null;
    return (
      product.variants.find((v) =>
        v.selectedOptions.every((o) =>
          o.name === sizeOption.name ? o.value === size : selected[o.name] === o.value,
        ),
      ) ?? null
    );
  }

  // Exact (color, size) match first; if this color has no SKU at this size
  // (e.g. sold out combination), fall back to any variant at that size so
  // there's still a variant_id to attach the line to.
  function findVariantForColorSize(color: string, size: string) {
    if (!product || !sizeOption || !colorOption) return null;
    const exact = product.variants.find((v) =>
      v.selectedOptions.every((o) => {
        if (o.name === sizeOption.name) return o.value === size;
        if (o.name === colorOption.name) return o.value === color;
        return selected[o.name] === o.value;
      }),
    );
    if (exact) return exact;
    const looseMatches = product.variants.filter((v) =>
      v.selectedOptions.every((o) => {
        if (o.name === sizeOption.name) return o.value === size;
        if (o.name === colorOption.name) return true;
        return selected[o.name] === o.value;
      }),
    );
    return looseMatches.find((v) => v.availableForSale) ?? looseMatches[0] ?? null;
  }

  function selectColor(color: string) {
    setActiveColor(color);
    setColorSizeQty((prev) =>
      prev[color] ? prev : { ...prev, [color]: Object.fromEntries((sizeOption?.values ?? []).map((s) => [s, 0])) },
    );
  }
  function setColorSize(color: string, size: string, n: number) {
    setColorSizeQty((prev) => ({ ...prev, [color]: { ...(prev[color] ?? {}), [size]: Math.max(0, n) } }));
  }

  // Flattened (color, size, qty, variant) lines for the multi-color matrix.
  const colorLines = useMemo(() => {
    if (!multiColor) return [];
    const lines: Array<{ color: string; size: string; qty: number; price: number }> = [];
    for (const [color, sizes] of Object.entries(colorSizeQty)) {
      for (const [size, qty] of Object.entries(sizes)) {
        if (qty <= 0) continue;
        const v = findVariantForColorSize(color, size);
        lines.push({ color, size, qty, price: v ? Number(v.price) : 0 });
      }
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiColor, colorSizeQty, selected, product?.variants]);

  const totalSizeQuantity = useMemo(() => {
    if (multiColor) return colorLines.reduce((sum, l) => sum + l.qty, 0);
    return Object.values(sizeQuantities).reduce((sum, n) => sum + n, 0);
  }, [multiColor, colorLines, sizeQuantities]);

  const images = useMemo(() => {
    if (!product) return [];
    const fromMedia = product.media
      .map((m) => (m.type === 'image' ? m.url : m.previewImageUrl))
      .filter((u): u is string => !!u);
    return fromMedia.length > 0 ? fromMedia : product.featuredImage ? [product.featuredImage.url] : [];
  }, [product]);

  const howToOrderVideoId = product ? HOW_TO_ORDER_VIDEO_IDS[product.handle] : undefined;

  const detection = useMemo(() => {
    if (!product) return null;
    return detectTemplateFit(product, selected, product.templateFitOverrides ?? {}, printSide, BLEED_IN);
  }, [product, selected, printSide]);

  const needsFront = detection ? detection.effectiveUploadMode !== 'none' : false;
  const needsBack = detection?.effectiveUploadMode === 'front-back';
  const frontReady = !needsFront || (!!frontUpload.fileUrl && !frontUpload.isUploading);
  const backReady = !needsBack || (!!backUpload.fileUrl && !backUpload.isUploading);
  const anyUploading = frontUpload.isUploading || backUpload.isUploading;
  const willUseTemplateFit = !!detection?.templateFitEnabled && !!detection.sizeInches;

  const orderTotal = multiColor
    ? colorLines.reduce((sum, l) => sum + l.price * l.qty, 0)
    : isApparel
      ? Object.entries(sizeQuantities).reduce((sum, [size, qty]) => {
          if (qty <= 0) return sum;
          const v = findVariantForSize(size);
          return v ? sum + Number(v.price) * qty : sum;
        }, 0)
      : activeVariant
        ? Number(activeVariant.price) * quantity
        : 0;

  const qtyOk = isApparel
    ? totalSizeQuantity >= minQuantity
    : hasQuantityVariantOption || quantity >= minQuantity;
  const canCheckout = !!activeVariant && frontReady && backReady && !anyUploading && qtyOk;

  function buildExtraProperties(): Record<string, string> {
    const extraProperties: Record<string, string> = {};
    if (detection?.effectiveUploadMode === 'single' && frontUpload.fileUrl) {
      extraProperties[`${detection.uploadLabel} File`] = frontUpload.fileUrl;
      if (frontUpload.file?.name) extraProperties[`${detection.uploadLabel} Filename`] = frontUpload.file.name;
    } else if (detection?.effectiveUploadMode === 'front-back') {
      if (frontUpload.fileUrl) {
        extraProperties['Front Design'] = frontUpload.fileUrl;
        if (frontUpload.file?.name) extraProperties['Front Design Filename'] = frontUpload.file.name;
      }
      if (backUpload.fileUrl) {
        extraProperties['Back Design'] = backUpload.fileUrl;
        if (backUpload.file?.name) extraProperties['Back Design Filename'] = backUpload.file.name;
      }
    }
    if (detection?.showSideSelector) {
      extraProperties['Print Sides'] = printSide === 'both' ? 'Front & Back' : 'Front Only';
    }
    if (phone.trim()) extraProperties['Phone Number'] = phone.trim();
    if (instructions.trim()) extraProperties['Instructions'] = instructions.trim();
    return extraProperties;
  }

  function handleAddToCart() {
    if (!product || !canCheckout) return;
    const extraProperties = buildExtraProperties();

    if (multiColor && sizeOption && colorOption) {
      for (const [color, sizes] of Object.entries(colorSizeQty)) {
        for (const [size, qty] of Object.entries(sizes)) {
          if (qty <= 0) continue;
          const variant = findVariantForColorSize(color, size);
          if (!variant) {
            Alert.alert('Missing variant', `No variant found for ${color} / ${size}.`);
            return;
          }
          const unitPrice = Number(variant.price);
          addItem({
            kind: 'product',
            variantId: variant.id,
            productTitle: product.title,
            title: product.title,
            subtitle: [
              ...Object.entries(selected)
                .filter(([k]) => k !== sizeOption.name && k !== colorOption.name)
                .map(([k, v]) => `${k}: ${v}`),
              `${colorOption.name}: ${color}`,
              `${sizeOption.name}: ${size}`,
            ].join(' · '),
            thumbnail: images[0] ?? '',
            unitLabel: `$${unitPrice.toFixed(2)} each`,
            selectedOptions: { ...selected, [colorOption.name]: color, [sizeOption.name]: size },
            qty,
            quantity: qty,
            unitPrice,
            totalPrice: Math.round(unitPrice * qty * 100) / 100,
            extraProperties,
          });
        }
      }
      Alert.alert('Added to cart', `${product.title} — ${totalSizeQuantity} pcs`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') },
      ]);
      return;
    }

    if (isApparel && sizeOption) {
      const lines = Object.entries(sizeQuantities).filter(([, qty]) => qty > 0);
      for (const [size, qty] of lines) {
        const variant = findVariantForSize(size);
        if (!variant) continue;
        const unitPrice = Number(variant.price);
        addItem({
          kind: 'product',
          variantId: variant.id,
          productTitle: product.title,
          title: product.title,
          subtitle: [
            ...Object.entries(selected)
              .filter(([k]) => k !== sizeOption.name)
              .map(([k, v]) => `${k}: ${v}`),
            `${sizeOption.name}: ${size}`,
          ].join(' · '),
          thumbnail: images[0] ?? '',
          unitLabel: `$${unitPrice.toFixed(2)} each`,
          selectedOptions: { ...selected, [sizeOption.name]: size },
          qty,
          quantity: qty,
          unitPrice,
          totalPrice: Math.round(unitPrice * qty * 100) / 100,
          extraProperties,
        });
      }
      Alert.alert('Added to cart', `${product.title} — ${totalSizeQuantity} pcs`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') },
      ]);
      return;
    }

    if (!activeVariant) return;
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
      qty: quantity,
      quantity,
      unitPrice,
      totalPrice: Math.round(unitPrice * quantity * 100) / 100,
      extraProperties,
    });
    Alert.alert('Added to cart', product.title, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  }

  function handleContinueToTemplateFit() {
    if (!product || !activeVariant || !canCheckout || !detection?.sizeInches) return;
    const unitPrice = Number(activeVariant.price);
    const extraProperties: Record<string, string> = {};
    if (detection.showSideSelector) {
      extraProperties['Print Sides'] = printSide === 'both' ? 'Front & Back' : 'Front Only';
    }
    if (phone.trim()) extraProperties['Phone Number'] = phone.trim();
    if (instructions.trim()) extraProperties['Instructions'] = instructions.trim();

    const sides: TemplateFitPayload['sides'] = {};
    if (needsFront && frontUpload.fileUrl) {
      sides.front = { fileUrl: frontUpload.fileUrl, fileName: frontUpload.file?.name ?? null };
    }
    if (needsBack && backUpload.fileUrl) {
      sides.back = { fileUrl: backUpload.fileUrl, fileName: backUpload.file?.name ?? null };
    }

    const payload: TemplateFitPayload = {
      productHandle: product.handle,
      productTitle: product.title,
      widthIn: detection.sizeInches.width,
      heightIn: detection.sizeInches.height,
      uploadLabel: detection.uploadLabel,
      effectiveUploadMode: detection.effectiveUploadMode === 'front-back' ? 'front-back' : 'single',
      sides,
      bleedIn: detection.bleedIn,
      sizeUnit: detection.sizeUnit,
      variants: product.variants.map((v) => ({
        id: v.id,
        price: v.price,
        selectedOptions: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
      })),
      cartItem: {
        title: product.title,
        thumbnail: images[0] ?? '',
        unitPrice,
        qty: quantity,
        variantId: activeVariant.id,
        productTitle: product.title,
        selectedOptions: selected,
        extraProperties,
        editHref: `/shop/product/${product.handle}`,
      },
    };

    router.push({
      pathname: '/template-fit/[handle]',
      params: { handle: product.handle, payload: JSON.stringify(payload) },
    });
  }

  async function handleDownloadBlankTemplate() {
    if (!product || !detection?.sizeInches) return;
    setDownloadingTemplate(true);
    try {
      const sizeOpt = findDimensionOption(product.options);
      const sizeLabel = sizeOpt ? selected[sizeOpt.name] : `${detection.sizeInches.width}x${detection.sizeInches.height}`;
      await downloadAndShareBlankTemplate({
        widthIn: detection.sizeInches.width,
        heightIn: detection.sizeInches.height,
        sizeLabel: sizeLabel ?? `${detection.sizeInches.width}x${detection.sizeInches.height}`,
        productTitle: product.title,
        bleedIn: detection.bleedIn,
      });
    } catch {
      Alert.alert('Could not prepare the template', 'Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
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
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}>
        {images.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {images.map((url) => (
              <ThemedView key={url} type="backgroundElement" style={styles.galleryImageWrap}>
                <Image source={{ uri: url }} style={styles.galleryImage} contentFit="cover" />
              </ThemedView>
            ))}
          </ScrollView>
        )}

        {!!howToOrderVideoId && (
          <View style={styles.howToOrder}>
            <ThemedText type="smallBold" style={styles.howToOrderTitle}>
              How to Order
            </ThemedText>
            <Pressable
              style={styles.videoThumbWrap}
              onPress={() =>
                WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${howToOrderVideoId}`)
              }>
              <Image
                source={{ uri: `https://img.youtube.com/vi/${howToOrderVideoId}/hqdefault.jpg` }}
                style={styles.videoThumb}
                contentFit="cover"
              />
              <View style={styles.playButton}>
                <ThemedText style={styles.playButtonIcon}>▶</ThemedText>
              </View>
            </Pressable>
          </View>
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

        {product.options
          .filter((opt) => !(isApparel && sizeOption && opt.id === sizeOption.id))
          .filter((opt) => !(multiColor && colorOption && opt.id === colorOption.id))
          .map((opt) => (
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

        {multiColor && colorOption && sizeOption && (
          <View style={styles.optionGroup}>
            <View style={styles.sizeSectionHeader}>
              <ThemedText type="smallBold" style={styles.optionLabel}>
                {colorOption.name}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor={totalSizeQuantity >= minQuantity ? 'textSecondary' : undefined}
                style={!(totalSizeQuantity >= minQuantity) ? styles.qtyWarningText : undefined}>
                {totalSizeQuantity} / min {minQuantity}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Pick a color, set a quantity per size, then pick another color to add more.
            </ThemedText>
            <View style={styles.swatchRow}>
              {colorOption.values.map((color) => {
                const isActive = activeColor === color;
                const colorQty = Object.values(colorSizeQty[color] ?? {}).reduce((a, b) => a + b, 0);
                return (
                  <Pressable key={color} onPress={() => selectColor(color)} style={styles.swatchItem}>
                    <View style={[styles.swatch, { backgroundColor: colorHex(color) ?? '#888' }, isActive && styles.swatchActive]}>
                      {colorQty > 0 && <ThemedText style={styles.swatchCheck}>✓</ThemedText>}
                    </View>
                    <ThemedText type="small" numberOfLines={1} style={styles.swatchLabel}>
                      {color}
                      {colorQty > 0 ? ` (${colorQty})` : ''}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {activeColor && (
              <View style={styles.colorBlock}>
                <View style={styles.colorBlockHeader}>
                  <View style={styles.swatchItem}>
                    <View style={[styles.swatch, styles.swatchSmall, { backgroundColor: colorHex(activeColor) ?? '#888' }]} />
                    <ThemedText type="smallBold">{activeColor}</ThemedText>
                  </View>
                </View>
                <View style={styles.sizeMatrix}>
                  {sizeOption.values.map((size) => {
                    const variant = findVariantForColorSize(activeColor, size);
                    const qty = colorSizeQty[activeColor]?.[size] ?? 0;
                    return (
                      <View key={size} style={styles.sizeRow}>
                        <View style={styles.sizeRowLabel}>
                          <ThemedText type="smallBold">{size}</ThemedText>
                          {!!variant && (
                            <ThemedText type="small" themeColor="textSecondary">
                              ${Number(variant.price).toFixed(2)}
                            </ThemedText>
                          )}
                        </View>
                        <QuantityStepper
                          value={qty}
                          min={0}
                          disabled={!variant?.availableForSale}
                          onChange={(n) => setColorSize(activeColor, size, n)}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {totalSizeQuantity > 0 && totalSizeQuantity < minQuantity && (
              <ThemedText type="small" style={styles.qtyWarningText}>
                Add {minQuantity - totalSizeQuantity} more to reach the minimum order of {minQuantity}.
              </ThemedText>
            )}
          </View>
        )}

        {isApparel && !multiColor && sizeOption && (
          <View style={styles.optionGroup}>
            <View style={styles.sizeSectionHeader}>
              <ThemedText type="smallBold" style={styles.optionLabel}>
                {sizeOption.name} & Quantity
              </ThemedText>
              <ThemedText type="small" themeColor={totalSizeQuantity >= minQuantity ? 'textSecondary' : undefined} style={!(totalSizeQuantity >= minQuantity) ? styles.qtyWarningText : undefined}>
                {totalSizeQuantity} / min {minQuantity}
              </ThemedText>
            </View>
            <View style={styles.sizeMatrix}>
              {sizeOption.values.map((size) => {
                const variant = findVariantForSize(size);
                const qty = sizeQuantities[size] ?? 0;
                return (
                  <View key={size} style={styles.sizeRow}>
                    <View style={styles.sizeRowLabel}>
                      <ThemedText type="smallBold">{size}</ThemedText>
                      {!!variant && (
                        <ThemedText type="small" themeColor="textSecondary">
                          ${Number(variant.price).toFixed(2)}
                        </ThemedText>
                      )}
                    </View>
                    <QuantityStepper
                      value={qty}
                      min={0}
                      disabled={!variant?.availableForSale}
                      onChange={(n) => setSizeQuantities((prev) => ({ ...prev, [size]: n }))}
                    />
                  </View>
                );
              })}
            </View>
            {totalSizeQuantity > 0 && totalSizeQuantity < minQuantity && (
              <ThemedText type="small" style={styles.qtyWarningText}>
                Add {minQuantity - totalSizeQuantity} more to reach the minimum order of {minQuantity}.
              </ThemedText>
            )}
          </View>
        )}

        {!isApparel && !hasQuantityVariantOption && (
          <View style={styles.optionGroup}>
            <ThemedText type="smallBold" style={styles.optionLabel}>
              {minQuantity > 1 ? `Quantity (min ${minQuantity})` : 'Quantity'}
            </ThemedText>
            <QuantityStepper value={quantity} min={minQuantity} onChange={setQuantity} />
          </View>
        )}

        {!!product.descriptionHtml && (
          <View style={styles.description}>
            <ExpandableText text={stripHtml(product.descriptionHtml)} style={styles.descriptionText} />
          </View>
        )}

        {detection?.templateFitEnabled && (
          <Pressable
            style={styles.templateDownload}
            disabled={downloadingTemplate || !detection.sizeInches}
            onPress={handleDownloadBlankTemplate}>
            {downloadingTemplate ? (
              <ActivityIndicator color={Brand.cyan} />
            ) : (
              <ThemedText type="small" style={{ color: Brand.cyan }}>
                ⬇ Download a blank template (PDF)
              </ThemedText>
            )}
          </Pressable>
        )}

        {detection?.showSideSelector && (
          <View style={styles.optionGroup}>
            <ThemedText type="smallBold" style={styles.optionLabel}>
              Print side
            </ThemedText>
            <View style={styles.optionValues}>
              {(['front', 'both'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setPrintSide(s)}
                  style={[styles.chip, printSide === s && styles.chipActive]}>
                  <ThemedText
                    type="small"
                    style={printSide === s ? styles.chipTextActive : undefined}
                    themeColor={printSide === s ? undefined : 'textSecondary'}>
                    {s === 'both' ? 'Front & Back' : 'Front Only'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {needsFront && (
          <View style={styles.optionGroup}>
            <ThemedText type="smallBold" style={styles.optionLabel}>
              Upload your design
            </ThemedText>
            <View style={styles.uploadRow}>
              <UploadBox
                label={needsBack ? 'Front design' : undefined}
                slot={frontUpload}
                onSelect={() => pickAndUpload(setFrontUpload, { requirePreviewable: detection?.templateFitEnabled })}
                onClear={() => setFrontUpload(EMPTY_UPLOAD_SLOT)}
                hint={detection?.templateFitEnabled ? 'PNG · JPG' : 'PNG · JPG · SVG · PDF'}
              />
              {needsBack && (
                <UploadBox
                  label="Back design"
                  slot={backUpload}
                  onSelect={() => pickAndUpload(setBackUpload, { requirePreviewable: detection?.templateFitEnabled })}
                  onClear={() => setBackUpload(EMPTY_UPLOAD_SLOT)}
                  hint={detection?.templateFitEnabled ? 'PNG · JPG' : 'PNG · JPG · SVG · PDF'}
                />
              )}
            </View>
          </View>
        )}

        <View style={styles.optionGroup}>
          <ThemedText type="smallBold" style={styles.optionLabel}>
            Phone number (optional)
          </ThemedText>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor="rgba(245,245,245,0.4)"
            keyboardType="phone-pad"
            style={styles.textInput}
          />
        </View>

        <View style={styles.optionGroup}>
          <ThemedText type="smallBold" style={styles.optionLabel}>
            Notes (optional)
          </ThemedText>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Any special requests or details we should know…"
            placeholderTextColor="rgba(245,245,245,0.4)"
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        <View style={styles.bottomBar}>
          {(!isApparel || totalSizeQuantity > 0) && (
            <View style={styles.bottomBarSummary}>
              <ThemedText type="small" themeColor="textSecondary">
                {isApparel ? `${totalSizeQuantity} pcs` : `Qty ${quantity}`}
              </ThemedText>
              <ThemedText type="smallBold">${orderTotal.toFixed(2)}</ThemedText>
            </View>
          )}
          <Pressable
            style={[
              styles.cartButton,
              (!canCheckout || (!isApparel && activeVariant && !activeVariant.availableForSale)) &&
                styles.cartButtonDisabled,
            ]}
            disabled={!canCheckout || (!isApparel && (!activeVariant || !activeVariant.availableForSale))}
            onPress={willUseTemplateFit ? handleContinueToTemplateFit : handleAddToCart}>
            {anyUploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText type="smallBold" style={styles.cartButtonText}>
                {isApparel && totalSizeQuantity < minQuantity
                  ? totalSizeQuantity === 0
                    ? `Select sizes (min ${minQuantity})`
                    : `Add ${minQuantity - totalSizeQuantity} more to reach min ${minQuantity}`
                  : !isApparel && activeVariant && !activeVariant.availableForSale
                    ? 'Unavailable'
                    : !frontReady || !backReady
                      ? `Upload ${needsFront && needsBack ? 'both designs' : 'your design'} to continue`
                      : willUseTemplateFit
                        ? 'Continue →'
                        : 'Add to Cart'}
              </ThemedText>
            )}
          </Pressable>
          {willUseTemplateFit && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.continueHint}>
              Next, you&apos;ll fit your design onto the print template.
            </ThemedText>
          )}
        </View>
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
  howToOrder: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  howToOrderTitle: {
    color: Brand.yellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  videoThumbWrap: {
    aspectRatio: 16 / 9,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonIcon: {
    color: '#fff',
    fontSize: 20,
  },
  bottomBar: {
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  bottomBarSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
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
  sizeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  sizeMatrix: { gap: Spacing.two },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sizeRowLabel: { gap: 2 },
  qtyWarningText: { color: Brand.magenta },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  swatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: Brand.yellow,
  },
  swatchCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 2,
  },
  swatchLabel: {
    maxWidth: 90,
  },
  colorBlock: {
    marginTop: Spacing.two,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  colorBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  descriptionText: {
    lineHeight: 21,
  },
  cartButton: {
    marginTop: Spacing.two,
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
  continueHint: {
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  templateDownload: {
    marginTop: Spacing.four,
    marginHorizontal: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.3)',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
