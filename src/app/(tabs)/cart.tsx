import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedTopBar } from '@/components/menu-button';
import { NetworkImage } from '@/components/network-image';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import type { CartDiscount } from '@/lib/discount-types';

export default function CartScreen() {
  const { items, itemCount, subtotal, discount, discountAmount, total, updateQty, removeItem, applyDiscount, clearDiscount, isHydrated } =
    useCart();
  const [email, setEmail] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  async function handleApplyDiscount() {
    setDiscountError(null);
    const trimmed = discountCode.trim();
    if (!trimmed) {
      setDiscountError('Enter a code first.');
      return;
    }
    setApplyingDiscount(true);
    try {
      const res = await api.post<{ ok?: boolean; discount?: CartDiscount }>('/api/discount/validate', {
        code: trimmed,
        subtotal,
      });
      if (!res.discount) {
        setDiscountError('Could not apply that code.');
        return;
      }
      applyDiscount(res.discount);
      setDiscountCode('');
    } catch (err) {
      setDiscountError(err instanceof ApiError ? err.message : 'Could not apply that code.');
    } finally {
      setApplyingDiscount(false);
    }
  }

  async function handleCheckout() {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Email required', 'Enter a valid email so we can send your order confirmation.');
      return;
    }
    setCheckingOut(true);
    try {
      const res = await api.post<{ invoiceUrl: string }>('/api/checkout-cart', {
        items,
        email: trimmed,
        discountCode: discount?.code ?? null,
      });
      await WebBrowser.openBrowserAsync(res.invoiceUrl);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Checkout failed — please try again.';
      Alert.alert('Checkout failed', message);
    } finally {
      setCheckingOut(false);
    }
  }

  if (!isHydrated) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <FixedTopBar />
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <FixedTopBar />
        <ThemedText type="subtitle">Your cart is empty</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Browse the shop and add something to get started.
        </ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <FixedTopBar />
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.list, { paddingTop: insets.top + Spacing.six }]}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <ThemedView type="backgroundElement" style={styles.thumbWrap}>
                {item.thumbnail.startsWith('http') || item.thumbnail.startsWith('/') ? (
                  <NetworkImage
                    uri={item.thumbnail}
                    width={90}
                    style={styles.thumb}
                    contentFit="cover"
                    fallback={<ThemedText style={styles.thumbEmoji}>📦</ThemedText>}
                  />
                ) : (
                  !!item.thumbnail && <ThemedText style={styles.thumbEmoji}>{item.thumbnail}</ThemedText>
                )}
              </ThemedView>
              <View style={styles.rowInfo}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {item.title}
                </ThemedText>
                {!!item.subtitle && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {item.subtitle}
                  </ThemedText>
                )}
                <ThemedText type="small" style={styles.linePrice}>
                  ${item.totalPrice.toFixed(2)}
                </ThemedText>
                <View style={styles.qtyRow}>
                  {item.kind === 'product' ? (
                    <>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => updateQty(item.id, item.quantity - 1)}>
                        <ThemedText type="smallBold">−</ThemedText>
                      </Pressable>
                      <ThemedText type="small" style={styles.qtyValue}>
                        {item.quantity}
                      </ThemedText>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => updateQty(item.id, item.quantity + 1)}>
                        <ThemedText type="smallBold">+</ThemedText>
                      </Pressable>
                    </>
                  ) : null}
                  <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton}>
                    <ThemedText type="small" style={styles.removeText}>
                      Remove
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <ThemedText type="smallBold">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ${subtotal.toFixed(2)}
            </ThemedText>
          </View>

          {discount && discountAmount > 0 && (
            <View style={styles.totalRow}>
              <View style={styles.discountBadgeRow}>
                <ThemedText type="small" style={styles.discountLabel}>
                  Discount
                </ThemedText>
                <View style={styles.discountCodeChip}>
                  <ThemedText type="small" style={styles.discountCodeChipText}>
                    {discount.code}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" style={styles.discountLabel}>
                −${discountAmount.toFixed(2)}
              </ThemedText>
            </View>
          )}

          {discount && discount.scope === 'vinyl-sticker' && discountAmount === 0 && !items.some((i) => i.kind === 'vinyl-sticker') && (
            <View style={styles.discountWarning}>
              <ThemedText type="small" style={styles.discountWarningText}>
                {discount.code} only applies to Custom Vinyl Stickers — add one to your cart to use it.
              </ThemedText>
            </View>
          )}

          {discount ? (
            <View style={styles.discountApplied}>
              <ThemedText type="small" style={styles.discountAppliedText} numberOfLines={1}>
                ✓ {discount.code} applied
              </ThemedText>
              <Pressable onPress={clearDiscount}>
                <ThemedText type="small" style={styles.discountRemoveText}>
                  Remove
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.discountRow}>
              <TextInput
                value={discountCode}
                onChangeText={(t) => setDiscountCode(t.toUpperCase())}
                placeholder="Discount code"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!applyingDiscount}
                style={styles.discountInput}
              />
              <Pressable
                style={[styles.discountApplyButton, applyingDiscount && styles.checkoutButtonDisabled]}
                disabled={applyingDiscount || !discountCode.trim()}
                onPress={handleApplyDiscount}>
                {applyingDiscount ? (
                  <ActivityIndicator color={Brand.cyan} size="small" />
                ) : (
                  <ThemedText type="small" style={styles.discountApplyText}>
                    Apply
                  </ThemedText>
                )}
              </Pressable>
            </View>
          )}
          {discountError && (
            <ThemedText type="small" style={styles.discountErrorText}>
              {discountError}
            </ThemedText>
          )}

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <ThemedText type="smallBold">Total</ThemedText>
            <ThemedText type="subtitle" style={{ color: Brand.cyan }}>
              ${total.toFixed(2)}
            </ThemedText>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email for order confirmation"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.emailInput}
          />

          <Pressable
            style={[styles.checkoutButton, checkingOut && styles.checkoutButtonDisabled]}
            disabled={checkingOut}
            onPress={handleCheckout}>
            {checkingOut ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <ThemedText type="smallBold" style={styles.checkoutButtonText}>
                Checkout
              </ThemedText>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  centerText: { textAlign: 'center' },
  list: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  thumbWrap: {
    width: 84,
    height: 84,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: {
    fontSize: 36,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  linePrice: {
    marginTop: Spacing.one,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: Spacing.two,
  },
  removeText: {
    color: Brand.magenta,
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalRow: {
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  discountBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  discountLabel: {
    color: '#6ee7b7',
  },
  discountCodeChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  discountCodeChipText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '600',
  },
  discountWarning: {
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  discountWarningText: {
    color: '#fcd34d',
  },
  discountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
    textTransform: 'uppercase',
  },
  discountApplyButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountApplyText: {
    color: '#f5f5f5',
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
  },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  discountAppliedText: {
    color: '#6ee7b7',
    fontWeight: '600',
    flexShrink: 1,
  },
  discountRemoveText: {
    color: '#6ee7b7',
    fontWeight: '600',
  },
  discountErrorText: {
    color: '#fca5a5',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#f5f5f5',
  },
  checkoutButton: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
