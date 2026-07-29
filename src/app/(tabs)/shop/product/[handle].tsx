import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
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

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EMPTY_UPLOAD_SLOT, pickAndUpload, UploadBox, type UploadSlot } from '@/components/template-fit/upload-box';
import { Brand, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { useCart } from '@/lib/cart-store';
import { downloadAndShareBlankTemplate } from '@/lib/template-fit/blank-template';
import { BLEED_IN } from '@/lib/template-fit/constants';
import { detectTemplateFit, type TemplateFitOverrides } from '@/lib/template-fit/detect';
import { findDimensionOption } from '@/lib/parse-size';
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
  const [frontUpload, setFrontUpload] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [backUpload, setBackUpload] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [printSide, setPrintSide] = useState<'front' | 'both'>('front');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Only seed `selected` once per handle — a background revalidation
  // shouldn't clobber options the customer has already picked.
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
  }, [product, navigation, handle]);

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

  const canCheckout = !!activeVariant && frontReady && backReady && !anyUploading;

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
    if (!product || !activeVariant || !canCheckout) return;
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
      extraProperties: buildExtraProperties(),
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
        qty: 1,
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

        <Pressable
          style={[
            styles.cartButton,
            (!canCheckout || (activeVariant && !activeVariant.availableForSale)) && styles.cartButtonDisabled,
          ]}
          disabled={!canCheckout || !activeVariant || !activeVariant.availableForSale}
          onPress={willUseTemplateFit ? handleContinueToTemplateFit : handleAddToCart}>
          {anyUploading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText type="smallBold" style={styles.cartButtonText}>
              {activeVariant && !activeVariant.availableForSale
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
