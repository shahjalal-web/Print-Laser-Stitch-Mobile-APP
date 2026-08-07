import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { EMPTY_UPLOAD_SLOT, pickAndUpload, UploadBox, type UploadSlot } from '@/components/template-fit/upload-box';
import { Brand, Spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart-store';
import type { DecalCartItem, DecalPanelLine } from '@/lib/cart-types';
import { DECAL_MATERIALS, PANEL_TYPES, TAX_RATE, calcDecalPrice, type MaterialKey, type PanelType } from '@/lib/decal-pricing';

type Panel = {
  id: string;
  type: PanelType;
  width: string;
  height: string;
  description: string;
  imageUrl?: string;
  imageUri?: string;
  note: string;
};

const EMPTY_PANEL_FORM = { type: 'door' as PanelType, width: '', height: '', description: '', note: '' };

export default function DecalQuoteScreen() {
  const { addItem } = useCart();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [form, setForm] = useState(EMPTY_PANEL_FORM);
  const [material, setMaterial] = useState<MaterialKey>('perforated-film');
  const [customPricePerSqFt, setCustomPricePerSqFt] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [panelImage, setPanelImage] = useState<UploadSlot>(EMPTY_UPLOAD_SLOT);
  const [toast, setToast] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const currentMaterial = DECAL_MATERIALS.find((m) => m.key === material) ?? DECAL_MATERIALS[0];

  const result = useMemo(
    () =>
      calcDecalPrice({
        panels: panels.map((p) => ({ type: p.type, width: Number(p.width) || 0, height: Number(p.height) || 0, description: p.description })),
        material,
        discountPercent: Number(discountPercent) || 0,
        customPricePerSqFt: Number(customPricePerSqFt) || 0,
      }),
    [panels, material, discountPercent, customPricePerSqFt],
  );

  function addPanel() {
    const w = Number(form.width);
    const h = Number(form.height);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
      setToast('Please enter valid width and height in inches.');
      return;
    }
    if (panelImage.isUploading) {
      setToast('Please wait for the reference photo to finish uploading.');
      return;
    }
    setPanels((prev) => [
      ...prev,
      {
        id: `panel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: form.type,
        width: form.width,
        height: form.height,
        description: form.description.trim(),
        imageUrl: panelImage.fileUrl ?? undefined,
        imageUri: panelImage.file?.uri,
        note: form.note.trim(),
      },
    ]);
    setForm(EMPTY_PANEL_FORM);
    setPanelImage(EMPTY_UPLOAD_SLOT);
    setToast(null);
  }

  function removePanel(id: string) {
    setPanels((prev) => prev.filter((p) => p.id !== id));
  }

  function handleAddToCart() {
    if (panels.length === 0) {
      setToast('Add at least one panel first.');
      return;
    }
    if (result.quoteOnly) {
      setToast('Enter your quoted price per sq ft, or call (772) 985-2854 for a custom quote.');
      return;
    }
    setToast(null);
    setIsAdding(true);

    const panelLines: DecalPanelLine[] = panels.map((p) => ({
      type: p.type,
      typeLabel: PANEL_TYPES.find((t) => t.key === p.type)?.label ?? p.type,
      width: Number(p.width),
      height: Number(p.height),
      description: p.description || undefined,
      imageUrl: p.imageUrl,
      note: p.note || undefined,
    }));

    const cartItem: Omit<DecalCartItem, 'id' | 'addedAt'> = {
      kind: 'decal',
      title: `Quick Quote · ${currentMaterial.label}`,
      subtitle: `${panelLines.length} ${panelLines.length === 1 ? 'panel' : 'panels'} · ${result.totalAreaSqFt.toFixed(2)} sq ft`,
      thumbnail: '🪟',
      unitLabel: `$${result.pricePerSqFt.toFixed(2)} / sq ft`,
      totalPrice: result.total,
      quantity: panelLines.length,
      panels: panelLines,
      material,
      materialLabel: currentMaterial.label,
      discountPercent: Number(discountPercent) || 0,
      pricePerSqFt: result.pricePerSqFt,
      totalAreaSqFt: result.totalAreaSqFt,
      subtotal: result.subtotal,
      taxAmount: result.taxAmount,
      notes: notes.trim() || undefined,
      editHref: '/shop/decal-quote',
    };

    addItem(cartItem);
    router.push('/cart');
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="smallBold" style={styles.heroKicker}>
            WINDOW FILM · WALL VINYL
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Quick <ThemedText style={[styles.heroTitle, { color: Brand.cyan }]}>Quote</ThemedText>
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.heroBody}>
            Add panels for doors, windows, walls, wood or metal — pick a vinyl material and get instant pricing with
            7% Martin County tax included.
          </ThemedText>
        </View>

        <Section step={1} title="Material & pricing">
          <View style={styles.tileGrid}>
            {DECAL_MATERIALS.map((m) => (
              <Pressable key={m.key} style={[styles.materialTile, material === m.key && styles.tileActive]} onPress={() => setMaterial(m.key)}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {m.label}
                </ThemedText>
                {m.quoteOnly ? (
                  <ThemedText type="small" style={{ color: Brand.magenta }}>
                    Custom Pricing
                  </ThemedText>
                ) : (
                  <ThemedText type="small" style={{ color: Brand.cyan }}>
                    ${m.pricePerSqFt.toFixed(2)}/sq ft
                  </ThemedText>
                )}
                <ThemedText type="small" themeColor="textSecondary">
                  {m.blurb}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {currentMaterial.quoteOnly && (
            <View style={styles.quoteOnlyBox}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
                YOUR QUOTED PRICE ($ / SQ FT)
              </ThemedText>
              <TextInput
                value={customPricePerSqFt}
                onChangeText={setCustomPricePerSqFt}
                keyboardType="decimal-pad"
                placeholder="e.g., 20.00"
                placeholderTextColor="rgba(245,245,245,0.4)"
                style={styles.numberFieldInput}
              />
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
                Special Vinyl is priced per job. Enter the rate we quoted you, or call (772) 985-2854 if you don&apos;t
                have one yet.
              </ThemedText>
            </View>
          )}
        </Section>

        <Section step={2} title="Add panel">
          <View style={styles.chipRow}>
            {PANEL_TYPES.map((t) => (
              <Pressable key={t.key} style={[styles.chip, form.type === t.key && styles.tileActive]} onPress={() => setForm((f) => ({ ...f, type: t.key }))}>
                <ThemedText type="small">
                  {t.icon} {t.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.customSizeInputs}>
            <NumberField label="Width (in)" value={form.width} onChangeText={(v) => setForm((f) => ({ ...f, width: v }))} />
            <NumberField label="Height (in)" value={form.height} onChangeText={(v) => setForm((f) => ({ ...f, height: v }))} />
          </View>
          <View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
              DESCRIPTION (OPTIONAL)
            </ThemedText>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="e.g., Front entrance, Side window"
              placeholderTextColor="rgba(245,245,245,0.4)"
              style={styles.numberFieldInput}
            />
          </View>
          <View style={styles.panelUploadRow}>
            <View style={styles.panelUploadBox}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
                REFERENCE PHOTO (OPTIONAL)
              </ThemedText>
              <UploadBox
                slot={panelImage}
                onSelect={() => pickAndUpload(setPanelImage)}
                onClear={() => setPanelImage(EMPTY_UPLOAD_SLOT)}
                hint="PNG · JPG"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
                NOTE (OPTIONAL)
              </ThemedText>
              <TextInput
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                placeholder="Anything about this photo or panel…"
                placeholderTextColor="rgba(245,245,245,0.4)"
                multiline
                numberOfLines={3}
                style={[styles.numberFieldInput, styles.panelNoteInput]}
              />
            </View>
          </View>
          <Pressable style={styles.addPanelButton} onPress={addPanel}>
            <ThemedText type="smallBold" style={styles.addPanelButtonText}>
              + Add Panel
            </ThemedText>
          </Pressable>
        </Section>

        <Section step={3} title="Panels">
          {panels.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              No panels added yet. Add your first panel above.
            </ThemedText>
          ) : (
            <View style={{ gap: Spacing.two }}>
              {panels.map((p, idx) => {
                const w = Number(p.width) || 0;
                const h = Number(p.height) || 0;
                const sqft = (w * h) / 144;
                const panelPrice = sqft * result.pricePerSqFt;
                return (
                  <View key={p.id} style={styles.panelRow}>
                    <View style={styles.panelRowHeader}>
                      {!!p.imageUri && <Image source={{ uri: p.imageUri }} style={styles.panelThumb} contentFit="cover" />}
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">Panel {idx + 1}</ThemedText>
                        {!!p.description && (
                          <ThemedText type="small" themeColor="textSecondary">
                            {p.description}
                          </ThemedText>
                        )}
                        {!!p.note && (
                          <ThemedText type="small" themeColor="textSecondary" style={styles.panelNote}>
                            {p.note}
                          </ThemedText>
                        )}
                      </View>
                      <Pressable onPress={() => removePanel(p.id)}>
                        <ThemedText type="small" style={{ color: Brand.magenta }}>
                          Delete
                        </ThemedText>
                      </Pressable>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {w}″ × {h}″ · {sqft.toFixed(2)} sq ft
                      {!result.quoteOnly ? ` · $${panelPrice.toFixed(2)}` : ''}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <Section step={4} title="Project notes" optional>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Install location, deadline, special instructions…"
            placeholderTextColor="rgba(245,245,245,0.4)"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </Section>

        <View style={styles.summaryCard}>
          <ThemedText type="smallBold" style={{ color: '#fff' }}>
            Live quote summary
          </ThemedText>
          {panels.length === 0 ? (
            <ThemedText type="small" style={styles.summaryMuted}>
              Add a panel to see your quote
            </ThemedText>
          ) : (
            <>
              <SummaryRow label="Total area" value={`${result.totalAreaSqFt.toFixed(2)} sq ft`} />
              <SummaryRow label="Subtotal" value={`$${result.subtotal.toFixed(2)}`} />
              <View style={styles.discountRow}>
                <ThemedText type="small" style={styles.summaryMuted}>
                  Discount (%)
                </ThemedText>
                <TextInput
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="decimal-pad"
                  style={styles.discountInput}
                />
              </View>
              <SummaryRow label={`Tax (${(TAX_RATE * 100).toFixed(0)}% Martin County)`} value={`$${result.taxAmount.toFixed(2)}`} />
              <View style={styles.totalRow}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  Total
                </ThemedText>
                <ThemedText type="title" style={{ color: '#fff', fontSize: 28 }}>
                  ${result.total.toFixed(2)}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {!result.quoteOnly ? (
          <Pressable style={[styles.cartButton, panels.length === 0 && styles.cartButtonDisabled]} disabled={panels.length === 0 || isAdding} onPress={handleAddToCart}>
            <ThemedText type="smallBold" style={styles.cartButtonText}>
              Add to Cart · ${result.total.toFixed(2)}
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.callButton} onPress={() => Linking.openURL('tel:7729852854')}>
            <ThemedText type="smallBold" style={styles.callButtonText}>
              📞 Call (772) 985-2854 for custom quote
            </ThemedText>
          </Pressable>
        )}

        {!!toast && (
          <ThemedText type="small" style={styles.toast}>
            {toast}
          </ThemedText>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function Section({ step, title, optional, children }: { step: number; title: string; optional?: boolean; children: React.ReactNode }) {
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

function NumberField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
        {label.toUpperCase()}
      </ThemedText>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.numberFieldInput} placeholder="0" placeholderTextColor="rgba(245,245,245,0.4)" />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="small" style={styles.summaryMuted}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: '#fff' }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  hero: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.25)',
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroKicker: { color: Brand.cyan, letterSpacing: 1, fontSize: 11 },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  heroBody: { lineHeight: 20 },
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
    backgroundColor: Brand.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: { color: '#000' },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
  centerText: { textAlign: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  materialTile: {
    width: '47%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: Spacing.three,
    gap: 2,
  },
  tileActive: {
    borderColor: Brand.cyan,
    backgroundColor: 'rgba(24, 211, 232, 0.1)',
  },
  quoteOnlyBox: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(217, 76, 179, 0.3)',
    backgroundColor: 'rgba(217, 76, 179, 0.08)',
    padding: Spacing.three,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  customSizeInputs: { flexDirection: 'row', gap: Spacing.two },
  numberFieldLabel: { fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  numberFieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  addPanelButton: {
    backgroundColor: Brand.cyan,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  addPanelButtonText: { color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  panelRow: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.three,
    gap: 4,
  },
  panelRowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  panelThumb: { width: 40, height: 40, borderRadius: Spacing.one, backgroundColor: 'rgba(255,255,255,0.05)' },
  panelNote: { fontStyle: 'italic' },
  panelUploadRow: { flexDirection: 'row', gap: Spacing.three },
  panelUploadBox: { width: 96 },
  panelNoteInput: { flex: 1, height: 78, textAlignVertical: 'top' },
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
  summaryCard: {
    borderRadius: Spacing.three,
    backgroundColor: Brand.cyanStrong,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  summaryMuted: { color: 'rgba(255,255,255,0.8)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountInput: {
    width: 70,
    textAlign: 'right',
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cartButton: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cartButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cartButtonText: { color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  callButton: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(217, 76, 179, 0.4)',
    backgroundColor: 'rgba(217, 76, 179, 0.15)',
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  callButtonText: { color: '#fce7f6' },
  toast: {
    color: '#fcd34d',
    textAlign: 'center',
  },
});
