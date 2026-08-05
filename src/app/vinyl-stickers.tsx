import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EMPTY_UPLOAD_SLOT, pickAndUpload, UploadBox, type UploadSlot } from '@/components/template-fit/upload-box';
import { FAQSection } from '@/components/faq-section';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart-store';
import type { VinylStickerCartItem } from '@/lib/cart-types';
import { setProofBridgeListener } from '@/lib/proof-bridge';
import {
  MATERIAL_OPTIONS,
  QUANTITY_OPTIONS,
  SHAPE_OPTIONS,
  SIZE_OPTIONS,
  calcPrice,
  type MaterialKey,
  type QuantityKey,
  type ShapeKey,
  type SizeKey,
} from '@/lib/pricing';
import { isPreviewIncompatible } from '@/lib/template-fit/upload';

type Proof = NonNullable<VinylStickerCartItem['proof']>;
const PROOF_RETURN_SCHEME = 'printlaserstitchmobile://vinyl-stickers-proof';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';
const MIN_CUSTOM_QTY = 25;

type SizeChoice = SizeKey | 'custom';

const SHAPE_ICON: Record<ShapeKey, string> = {
  custom: '/custom_shape-removebg-preview.png',
  circle: '/circle-removebg-preview.png',
  oval: '/oval-removebg-preview.png',
  square: '/square-removebg-preview.png',
  rectangle: '/rectangle-removebg-preview.png',
};

const MATERIAL_ICON: Record<MaterialKey, string> = {
  matte: '/matte-removebg-preview.png',
  gloss: '/glass-removebg-preview.png',
  holographic: '/holographic-removebg-preview.png',
  silver: '/silver-removebg-preview.png',
};

const SIZE_ICON: Record<SizeKey, string> = {
  '2x2': '/small-removebg-preview.png',
  '3x3': '/medium-removebg-preview.png',
  '4x4': '/large-removebg-preview.png',
  '5x5': '/StickerShuttle_cdIcon_gi5w46-removebg-preview.png',
};

const CUSTOM_SIZE_ICON = '/custom_size-removebg-preview.png';

const POPULAR_SIZES: { label: string; w: number; h: number }[] = [
  { label: '5.5"', w: 5.5, h: 5.5 },
  { label: '11" × 3"', w: 11, h: 3 },
  { label: '3" × 2"', w: 3, h: 2 },
  { label: '4" × 3"', w: 4, h: 3 },
];

export default function VinylStickersScreen() {
  const { addItem } = useCart();
  const [shape, setShape] = useState<ShapeKey>('custom');
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [material, setMaterial] = useState<MaterialKey>('matte');
  const [size, setSize] = useState<SizeChoice>('3x3');
  const [customWidth, setCustomWidth] = useState(3);
  const [customHeight, setCustomHeight] = useState(3);
  const [quantity, setQuantity] = useState<QuantityKey | 'custom'>(100);
  const [customQty, setCustomQty] = useState(150);
  const [customQtyText, setCustomQtyText] = useState('150');
  const [customWidthText, setCustomWidthText] = useState('3');
  const [customHeightText, setCustomHeightText] = useState('3');
  const [instructions, setInstructions] = useState('');
  const [upload, setUpload] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [isAdding, setIsAdding] = useState(false);
  const [proof, setProof] = useState<Proof | null>(null);
  const [isViewingProof, setIsViewingProof] = useState(false);

  useEffect(() => {
    setProofBridgeListener((result) => {
      if (result.status === 'approved' || result.status === 'changes-requested') {
        setProof({
          status: result.status,
          proofUrl: result.proofUrl,
          cutlineUrl: result.cutlineUrl,
          shape: result.shape,
          borderThickness: result.borderThickness,
          roundedCorners: result.roundedCorners,
          removedBackground: result.removedBackground,
          lowResolution: result.lowResolution,
          changeNote: result.changeNote,
        });
      }
    });
    return () => setProofBridgeListener(null);
  }, []);

  function selectShape(s: ShapeKey) {
    setShape(s);
    setProof(null);
  }

  function selectUpload() {
    setProof(null);
    pickAndUpload(setUpload);
  }

  function clearUpload() {
    setProof(null);
    setUpload(EMPTY_UPLOAD_SLOT);
  }

  const effectiveQty: QuantityKey = useMemo(() => {
    if (quantity !== 'custom') return quantity;
    return QUANTITY_OPTIONS.reduce((a, b) => (Math.abs(b - customQty) < Math.abs(a - customQty) ? b : a));
  }, [quantity, customQty]);

  const orderQty = quantity === 'custom' ? Math.max(MIN_CUSTOM_QTY, customQty) : quantity;

  const price = useMemo(
    () => calcPrice({ size, qty: effectiveQty, shape, material, customWidth, customHeight }),
    [size, effectiveQty, shape, material, customWidth, customHeight],
  );

  const tierPrices = useMemo(
    () =>
      QUANTITY_OPTIONS.map((q) => ({
        qty: q,
        ...calcPrice({ size, qty: q, shape, material, customWidth, customHeight }),
      })),
    [size, shape, material, customWidth, customHeight],
  );

  function applyPopularSize(w: number, h: number) {
    setSize('custom');
    setCustomWidth(w);
    setCustomHeight(h);
    setCustomWidthText(String(w));
    setCustomHeightText(String(h));
  }

  const canCheckout = !!upload.fileUrl && !upload.isUploading && !isAdding;
  const needsProof = !!upload.file && !isPreviewIncompatible(upload.file.mimeType);
  const readyForCart = canCheckout && (!needsProof || !!proof);

  const widthIn = size === 'custom' ? customWidth : SIZE_OPTIONS.find((s) => s.key === size)?.inches ?? 3;
  const heightIn = size === 'custom' ? customHeight : SIZE_OPTIONS.find((s) => s.key === size)?.inches ?? 3;

  async function handleViewProof() {
    if (!upload.fileUrl || isViewingProof) return;
    setIsViewingProof(true);
    try {
      const rounded = (shape === 'square' || shape === 'rectangle') && roundedCorners ? 'soft' : 'none';
      const params = new URLSearchParams({
        imageUrl: upload.fileUrl,
        shape,
        rounded,
        widthIn: String(widthIn),
        heightIn: String(heightIn),
        scheme: PROOF_RETURN_SCHEME,
      });
      // Plain in-app browser, not an auth session: the redirect is caught by
      // the vinyl-stickers-proof route (via proof-bridge) instead of relying
      // on openAuthSessionAsync's native redirect interception, which was
      // unreliable on Android and fell through to expo-router's own
      // deep-link handling (showing "Unmatched Route").
      await WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/mobile-proof?${params.toString()}`);
    } finally {
      setIsViewingProof(false);
    }
  }

  function handleAddToCart() {
    if (!readyForCart || !upload.file) return;
    setIsAdding(true);
    const sizeLabel = size === 'custom' ? `${customWidth}″ × ${customHeight}″` : SIZE_OPTIONS.find((s) => s.key === size)?.label ?? size;
    const shapeLabel = SHAPE_OPTIONS.find((s) => s.key === shape)?.label ?? shape;
    const materialLabel = MATERIAL_OPTIONS.find((m) => m.key === material)?.label ?? material;

    addItem({
      kind: 'vinyl-sticker',
      title: 'Custom Vinyl Stickers',
      subtitle: `${sizeLabel} · ${shapeLabel} · ${materialLabel}`,
      thumbnail: proof?.proofUrl ?? upload.file.uri,
      unitLabel: `$${price.perUnit.toFixed(2)} / sticker`,
      totalPrice: Math.round(price.perUnit * orderQty * 100) / 100,
      quantity: orderQty,
      shape,
      material,
      size,
      customWidth: size === 'custom' ? customWidth : undefined,
      customHeight: size === 'custom' ? customHeight : undefined,
      roundedCorners: shape === 'square' || shape === 'rectangle' ? roundedCorners : null,
      tierQty: effectiveQty,
      perUnit: price.perUnit,
      fileUrl: upload.fileUrl ?? undefined,
      fileName: upload.file.name,
      instructions: instructions || undefined,
      editHref: '/vinyl-stickers',
      proof: proof ?? undefined,
    });
    router.push('/cart');
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="smallBold" style={styles.heroKicker}>
            DESIGN IT YOURSELF
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Custom <ThemedText style={[styles.heroTitle, { color: Brand.yellow }]}>Vinyl Stickers</ThemedText>
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.heroBody}>
            Turn your artwork into tough, weatherproof stickers — cut to the exact shape of your design and built to
            survive sun, rain and everyday wear.
          </ThemedText>
          <View style={styles.heroTags}>
            {['💦 Holds up outdoors', '☀️ UV & fade resistant', '✂️ Precision die-cut'].map((t) => (
              <View key={t} style={styles.heroTag}>
                <ThemedText type="small">{t}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <Section step={1} title="Choose a shape">
          <Pressable
            style={[styles.wideTile, shape === 'custom' && styles.tileActive]}
            onPress={() => selectShape('custom')}>
            <Image source={{ uri: `${SITE_ORIGIN}${SHAPE_ICON.custom}` }} style={styles.wideTileIcon} contentFit="contain" />
            <View style={styles.wideTileText}>
              <ThemedText type="smallBold">Custom Shape</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Die-cut to follow your artwork
              </ThemedText>
            </View>
            {shape === 'custom' && <CheckBadge />}
          </Pressable>

          <View style={styles.tileGrid}>
            {SHAPE_OPTIONS.filter((s) => s.key !== 'custom').map((s) => (
              <OptionTile
                key={s.key}
                icon={`${SITE_ORIGIN}${SHAPE_ICON[s.key as ShapeKey]}`}
                label={s.label}
                active={shape === s.key}
                onPress={() => selectShape(s.key as ShapeKey)}
              />
            ))}
          </View>

          {(shape === 'square' || shape === 'rectangle') && (
            <View style={styles.roundedRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.roundedLabel}>
                ROUNDED CORNERS?
              </ThemedText>
              <View style={styles.tileGrid2}>
                <Pressable style={[styles.smallTile, roundedCorners && styles.tileActive]} onPress={() => setRoundedCorners(true)}>
                  <ThemedText type="smallBold">Yes</ThemedText>
                </Pressable>
                <Pressable style={[styles.smallTile, !roundedCorners && styles.tileActive]} onPress={() => setRoundedCorners(false)}>
                  <ThemedText type="smallBold">No</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </Section>

        <Section step={2} title="Pick a material">
          <View style={styles.tileGrid}>
            {MATERIAL_OPTIONS.map((m) => (
              <OptionTile
                key={m.key}
                icon={`${SITE_ORIGIN}${MATERIAL_ICON[m.key as MaterialKey]}`}
                label={m.label}
                active={material === m.key}
                onPress={() => setMaterial(m.key as MaterialKey)}
              />
            ))}
          </View>
        </Section>

        <Section step={3} title="Select a size">
          <View style={styles.tileGrid}>
            {SIZE_OPTIONS.map((s) => (
              <OptionTile
                key={s.key}
                icon={`${SITE_ORIGIN}${SIZE_ICON[s.key]}`}
                label={s.label}
                active={size === s.key}
                onPress={() => setSize(s.key)}
              />
            ))}
          </View>
          <Pressable style={[styles.customSizeRow, size === 'custom' && styles.tileActive]} onPress={() => setSize('custom')}>
            <Image source={{ uri: `${SITE_ORIGIN}${CUSTOM_SIZE_ICON}` }} style={styles.customSizeIcon} contentFit="contain" />
            <ThemedText type="smallBold">Custom size</ThemedText>
          </Pressable>
          {size === 'custom' && (
            <View style={styles.customSizeBox}>
              <View style={styles.customSizeInputs}>
                <NumberField
                  label="Width (in)"
                  text={customWidthText}
                  onChangeText={setCustomWidthText}
                  onCommit={(v) => setCustomWidth(v)}
                  fallback={customWidth}
                />
                <NumberField
                  label="Height (in)"
                  text={customHeightText}
                  onChangeText={setCustomHeightText}
                  onCommit={(v) => setCustomHeight(v)}
                  fallback={customHeight}
                />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.popularLabel}>
                POPULAR SIZES
              </ThemedText>
              <View style={styles.tileGrid}>
                {POPULAR_SIZES.map((p) => {
                  const active = size === 'custom' && customWidth === p.w && customHeight === p.h;
                  return (
                    <Pressable key={p.label} style={[styles.popularTile, active && styles.tileActive]} onPress={() => applyPopularSize(p.w, p.h)}>
                      <ThemedText type="small">{p.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </Section>

        <Section step={4} title="Quantity">
          <View style={styles.tierList}>
            <Pressable style={[styles.tierRow, quantity === 'custom' && styles.tileActive]} onPress={() => setQuantity('custom')}>
              <ThemedText type="smallBold">Custom</ThemedText>
              {quantity === 'custom' && (
                <ThemedText type="small" themeColor="textSecondary">
                  {orderQty.toLocaleString()} pcs · ${(price.perUnit * orderQty).toFixed(2)}
                </ThemedText>
              )}
            </Pressable>
            {quantity === 'custom' && (
              <NumberField
                label={`Custom quantity (min ${MIN_CUSTOM_QTY})`}
                text={customQtyText}
                onChangeText={setCustomQtyText}
                onCommit={(v) => setCustomQty(Math.floor(v))}
                fallback={customQty}
                min={MIN_CUSTOM_QTY}
              />
            )}
            {tierPrices.map(({ qty, total, savingsPercent }) => (
              <Pressable key={qty} style={[styles.tierRow, quantity === qty && styles.tileActive]} onPress={() => setQuantity(qty)}>
                <ThemedText type="smallBold">{qty.toLocaleString()}</ThemedText>
                <View style={styles.tierPriceRow}>
                  <ThemedText type="smallBold">${total.toFixed(2)}</ThemedText>
                  {savingsPercent > 0 && (
                    <View style={styles.savingsBadge}>
                      <ThemedText type="small" style={styles.savingsText}>
                        Save {savingsPercent}%
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section step={5} title="Upload your artwork">
          <UploadBox slot={upload} onSelect={selectUpload} onClear={clearUpload} hint="PNG · JPG · SVG · PDF" />
          {proof && (
            <View style={styles.proofStatus}>
              <ThemedText type="small" style={{ color: proof.status === 'approved' ? '#34d399' : Brand.yellow }}>
                {proof.status === 'approved' ? '✓ Proof approved' : '✓ Changes requested — we’ll follow up'}
              </ThemedText>
              <Pressable onPress={handleViewProof} disabled={isViewingProof}>
                <ThemedText type="small" style={{ color: Brand.cyan }}>
                  View again
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Section>

        <Section step={6} title="Additional instructions" optional>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Enter any special requests or notes here…"
            placeholderTextColor="rgba(245,245,245,0.4)"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </Section>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <ThemedText type="small" style={{ color: '#fff' }}>
              Total
            </ThemedText>
            <ThemedText type="title" style={{ color: '#fff' }}>
              ${(price.perUnit * orderQty).toFixed(2)}
            </ThemedText>
          </View>
          <ThemedText type="small" style={styles.totalSub}>
            ${price.perUnit.toFixed(2)} / sticker
          </ThemedText>
        </View>

        <Pressable
          style={[styles.cartButton, !canCheckout && styles.cartButtonDisabled]}
          disabled={!canCheckout}
          onPress={needsProof && !proof ? handleViewProof : handleAddToCart}>
          {isAdding || isViewingProof ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText type="smallBold" style={styles.cartButtonText}>
              {upload.isUploading
                ? 'Uploading…'
                : !upload.fileUrl
                  ? 'Upload Artwork to Continue'
                  : needsProof && !proof
                    ? `View Proof · $${(price.perUnit * orderQty).toFixed(2)}`
                    : `Add to Cart · $${(price.perUnit * orderQty).toFixed(2)}`}
            </ThemedText>
          )}
        </Pressable>

        <FAQSection />
      </ScrollView>
    </ScreenBackground>
  );
}

function Section({
  step,
  title,
  optional,
  children,
}: {
  step: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.stepBadge}>
          <ThemedText type="smallBold" style={styles.stepBadgeText}>
            {step}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        {optional && (
          <ThemedText type="small" themeColor="textSecondary">
            (optional)
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

function CheckBadge() {
  return (
    <View style={styles.checkBadge}>
      <ThemedText style={{ color: '#000', fontSize: 12 }}>✓</ThemedText>
    </View>
  );
}

function OptionTile({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.optionTile, active && styles.tileActive]} onPress={onPress}>
      {active && (
        <View style={styles.optionCheck}>
          <ThemedText style={{ color: '#000', fontSize: 10 }}>✓</ThemedText>
        </View>
      )}
      <Image source={{ uri: icon }} style={styles.optionIcon} contentFit="contain" />
      <ThemedText type="small" style={styles.optionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function NumberField({
  label,
  text,
  onChangeText,
  onCommit,
  fallback,
  min = 0.5,
}: {
  label: string;
  text: string;
  onChangeText: (t: string) => void;
  onCommit: (v: number) => void;
  fallback: number;
  min?: number;
}) {
  return (
    <View style={styles.numberField}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
        {label.toUpperCase()}
      </ThemedText>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        onBlur={() => {
          const v = Number(text);
          if (text.trim() === '' || !Number.isFinite(v) || v < min) {
            onChangeText(String(fallback));
            onCommit(fallback);
          } else {
            onCommit(v);
          }
        }}
        keyboardType="decimal-pad"
        style={styles.numberFieldInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  hero: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(217, 240, 0, 0.25)',
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroKicker: { color: Brand.yellow, letterSpacing: 1, fontSize: 11 },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  heroBody: { lineHeight: 20 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  heroTag: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  section: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: { color: '#000' },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tileGrid2: { flexDirection: 'row', gap: Spacing.two },
  optionTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: Spacing.one,
  },
  tileActive: {
    borderColor: Brand.yellow,
    backgroundColor: 'rgba(217, 240, 0, 0.1)',
  },
  optionIcon: { width: 40, height: 40 },
  optionLabel: { textAlign: 'center' },
  optionCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: Spacing.three,
  },
  wideTileIcon: { width: 44, height: 44 },
  wideTileText: { flex: 1 },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedRow: { gap: Spacing.two },
  roundedLabel: { letterSpacing: 0.5 },
  smallTile: {
    flex: 1,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  customSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    padding: Spacing.three,
  },
  customSizeIcon: { width: 24, height: 24 },
  customSizeBox: { gap: Spacing.two },
  customSizeInputs: { flexDirection: 'row', gap: Spacing.two },
  popularLabel: { letterSpacing: 0.5, marginTop: Spacing.one },
  popularTile: {
    width: '47%',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  numberField: { flex: 1, gap: 4 },
  numberFieldLabel: { fontSize: 10, letterSpacing: 0.5 },
  numberFieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  tierList: { gap: Spacing.one },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  tierPriceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  savingsBadge: {
    borderRadius: Spacing.five,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  savingsText: { color: '#34d399', fontSize: 10 },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
    height: 90,
    textAlignVertical: 'top',
  },
  totalCard: {
    borderRadius: Spacing.three,
    backgroundColor: Brand.magenta,
    padding: Spacing.four,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalSub: { color: 'rgba(255,255,255,0.85)', textAlign: 'right', marginTop: 2 },
  cartButton: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cartButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cartButtonText: { color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  proofStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
