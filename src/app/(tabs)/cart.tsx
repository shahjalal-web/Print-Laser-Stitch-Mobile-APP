import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedTopBar } from '@/components/menu-button';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart-store';

export default function CartScreen() {
  const { items, itemCount, total, updateQty, removeItem, isHydrated } = useCart();
  const [email, setEmail] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const insets = useSafeAreaInsets();

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
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} contentFit="cover" />
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
