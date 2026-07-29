import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useCart } from '@/lib/cart-store';
import type { SignageCartItem } from '@/lib/cart-types';
import { SERVICE_PLANS, calcSignageQuotePrice, type MeasurementUnit, type ServicePlanKey } from '@/lib/signage-pricing';

const PLAN_VISUALS: Record<ServicePlanKey, { icon: string; color: string; perks: string[] }> = {
  'print-only': { icon: '🖨️', color: Brand.cyan, perks: ['High-resolution print', 'You handle install'] },
  'design-print': { icon: '✏️', color: Brand.magenta, perks: ['Custom artwork', 'Free proof', 'Print included'] },
  'full-install': { icon: '🚀', color: Brand.yellow, perks: ['Design + print', 'Pro installation', 'Hands-off'] },
};

export default function SignageQuotesScreen() {
  const { addItem } = useCart();
  const [unit, setUnit] = useState<MeasurementUnit>('ft');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [servicePlan, setServicePlan] = useState<ServicePlanKey>('full-install');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const result = useMemo(
    () =>
      calcSignageQuotePrice({
        width: Number(width) || 0,
        length: Number(length) || 0,
        unit,
        quantity,
        servicePlan,
        discountPercent: Number(discountPercent) || 0,
      }),
    [width, length, unit, quantity, servicePlan, discountPercent],
  );

  const w = Number(width) || 0;
  const l = Number(length) || 0;
  const dimsEntered = w > 0 && l > 0;
  const currentPlan = SERVICE_PLANS.find((p) => p.key === servicePlan) ?? SERVICE_PLANS[0];
  const visual = PLAN_VISUALS[servicePlan];

  function handleAddToCart() {
    if (!dimsEntered) {
      setToast('Enter both width and length first.');
      return;
    }
    setToast(null);

    const cartItem: Omit<SignageCartItem, 'id' | 'addedAt'> = {
      kind: 'signage',
      title: `Decal Signage · ${currentPlan.label}`,
      subtitle: `${w}${unit} × ${l}${unit} · qty ${quantity}`,
      thumbnail: '🪧',
      unitLabel: `$${result.pricePerSqFt.toFixed(2)} / sq ft`,
      totalPrice: result.total,
      quantity,
      width: w,
      length: l,
      unit,
      qty: quantity,
      servicePlan: currentPlan.key,
      servicePlanLabel: currentPlan.label,
      pricePerSqFt: result.pricePerSqFt,
      unitAreaSqFt: result.unitAreaSqFt,
      totalAreaSqFt: result.totalAreaSqFt,
      discountPercent: Number(discountPercent) || 0,
      subtotal: result.subtotal,
      notes: notes.trim() || undefined,
      editHref: '/signage-quotes',
    };

    addItem(cartItem);
    router.push('/cart');
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText type="smallBold" style={styles.heroKicker}>
            PRINT &amp; INSTALL QUOTE GENERATOR
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Decal <ThemedText style={[styles.heroTitle, { color: Brand.yellow }]}>Signage</ThemedText> Calculator
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.heroBody}>
            Tell us the size, pick a service tier, get your price instantly.
          </ThemedText>
        </View>

        <Section step={1} title="Size your sign">
          <View style={styles.unitToggle}>
            <Pressable style={[styles.unitButton, unit === 'ft' && styles.unitButtonActive]} onPress={() => setUnit('ft')}>
              <ThemedText type="smallBold" style={unit === 'ft' ? styles.unitButtonTextActive : undefined}>
                Feet
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.unitButton, unit === 'in' && styles.unitButtonActive]} onPress={() => setUnit('in')}>
              <ThemedText type="smallBold" style={unit === 'in' ? styles.unitButtonTextActive : undefined}>
                Inches
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.customSizeInputs}>
            <BigField label="Width" value={width} onChangeText={setWidth} suffix={unit} />
            <BigField label="Length" value={length} onChangeText={setLength} suffix={unit} />
          </View>

          <View style={styles.customSizeInputs}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
                QUANTITY
              </ThemedText>
              <View style={styles.stepperRow}>
                <Pressable style={styles.stepperButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <ThemedText type="smallBold">−</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.stepperValue}>
                  {quantity}
                </ThemedText>
                <Pressable style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
                  <ThemedText type="smallBold">+</ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.numberFieldLabel}>
                DISCOUNT (%)
              </ThemedText>
              <TextInput value={discountPercent} onChangeText={setDiscountPercent} keyboardType="decimal-pad" style={styles.numberFieldInput} />
            </View>
          </View>

          {dimsEntered && (
            <View style={styles.previewBox}>
              <ThemedText type="small" themeColor="textSecondary">
                {result.unitAreaSqFt.toFixed(2)} sq ft each · {result.totalAreaSqFt.toFixed(2)} sq ft total
              </ThemedText>
            </View>
          )}
        </Section>

        <Section step={2} title="Service tier">
          <View style={{ gap: Spacing.two }}>
            {SERVICE_PLANS.map((plan) => {
              const active = servicePlan === plan.key;
              const v = PLAN_VISUALS[plan.key];
              return (
                <Pressable key={plan.key} style={[styles.planTile, active && { borderColor: v.color, backgroundColor: 'rgba(255,255,255,0.06)' }]} onPress={() => setServicePlan(plan.key)}>
                  <View style={styles.planTileHeader}>
                    <ThemedText style={{ fontSize: 22 }}>{v.icon}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{plan.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {plan.description}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={{ color: v.color }}>
                      ${plan.pricePerSqFt}/sf
                    </ThemedText>
                  </View>
                  <View style={styles.perkRow}>
                    {v.perks.map((perk) => (
                      <ThemedText key={perk} type="small" themeColor="textSecondary" style={styles.perkChip}>
                        ✓ {perk}
                      </ThemedText>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section step={3} title="Notes" optional>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Install location, deadline, special instructions…"
            placeholderTextColor="rgba(245,245,245,0.4)"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </Section>

        <View style={[styles.summaryCard, { backgroundColor: visual.color }]}>
          <View style={styles.summaryHeaderRow}>
            <ThemedText type="small" style={styles.summaryHeaderText}>
              YOUR QUOTE
            </ThemedText>
            <View style={styles.planBadge}>
              <ThemedText type="small" style={styles.planBadgeText}>
                {visual.icon} {currentPlan.label}
              </ThemedText>
            </View>
          </View>

          {!dimsEntered ? (
            <ThemedText type="small" style={styles.summaryDark}>
              Enter width and length to see your quote
            </ThemedText>
          ) : (
            <>
              <ThemedText type="title" style={styles.summaryTotal}>
                ${result.total.toFixed(2)}
              </ThemedText>
              <ThemedText type="small" style={styles.summaryDark}>
                {result.totalAreaSqFt.toFixed(2)} sq ft total · ${result.pricePerSqFt.toFixed(2)}/sq ft
              </ThemedText>
              <View style={styles.summaryBreakdown}>
                <SummaryRow label="Each panel" value={`${result.unitAreaSqFt.toFixed(2)} sq ft`} />
                <SummaryRow label="Quantity" value={`× ${quantity}`} />
                <SummaryRow label="Subtotal" value={`$${result.subtotal.toFixed(2)}`} />
                {result.discountAmount > 0 && <SummaryRow label={`Discount (${discountPercent}%)`} value={`−$${result.discountAmount.toFixed(2)}`} />}
              </View>
            </>
          )}
        </View>

        <Pressable style={[styles.cartButton, !dimsEntered && styles.cartButtonDisabled]} disabled={!dimsEntered} onPress={handleAddToCart}>
          <ThemedText type="smallBold" style={styles.cartButtonText}>
            Add to Cart · ${result.total.toFixed(2)}
          </ThemedText>
        </Pressable>

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

function BigField({ label, value, onChangeText, suffix }: { label: string; value: string; onChangeText: (v: string) => void; suffix: string }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={styles.bigFieldWrap}>
        <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="rgba(245,245,245,0.4)" style={styles.bigFieldInput} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.bigFieldSuffix}>
          {suffix}
        </ThemedText>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRowInner}>
      <ThemedText type="small" style={styles.summaryDark}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: '#000' }}>
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
    borderColor: 'rgba(217, 240, 0, 0.25)',
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroKicker: { color: Brand.yellow, letterSpacing: 1, fontSize: 11 },
  heroTitle: { fontSize: 24, lineHeight: 30 },
  heroBody: { lineHeight: 20 },
  section: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: '#000' },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5 },
  unitToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 3,
  },
  unitButton: { borderRadius: Spacing.five, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  unitButtonActive: { backgroundColor: Brand.cyan },
  unitButtonTextActive: { color: '#000' },
  customSizeInputs: { flexDirection: 'row', gap: Spacing.two },
  numberFieldLabel: { fontSize: 10, letterSpacing: 0.5 },
  numberFieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  bigFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bigFieldInput: { flex: 1, paddingVertical: Spacing.three, fontSize: 20, fontWeight: '700', color: '#f5f5f5' },
  bigFieldSuffix: { textTransform: 'uppercase' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
  },
  stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { flex: 1, textAlign: 'center' },
  previewBox: {
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  planTile: {
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  planTileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  perkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  perkChip: { fontSize: 11 },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: { borderRadius: Spacing.three, padding: Spacing.four, gap: 4 },
  summaryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryHeaderText: { color: 'rgba(0,0,0,0.6)', letterSpacing: 1, fontSize: 11 },
  planBadge: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: Spacing.five, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  planBadgeText: { color: '#000' },
  summaryTotal: { color: '#000', fontSize: 36, marginTop: Spacing.one },
  summaryDark: { color: 'rgba(0,0,0,0.65)' },
  summaryBreakdown: {
    marginTop: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: 4,
  },
  summaryRowInner: { flexDirection: 'row', justifyContent: 'space-between' },
  cartButton: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  cartButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.16)' },
  cartButtonText: { color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  toast: { color: '#fcd34d', textAlign: 'center' },
});
