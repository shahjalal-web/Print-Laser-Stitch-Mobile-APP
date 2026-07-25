import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type Money = { amount: string; currencyCode: string };
type Order = {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Money;
  statusUrl: string;
  lineItems: Array<{ title: string; quantity: number; variantTitle: string | null }>;
};

export default function OrdersScreen() {
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    api
      .get<Order[]>('/api/account/orders', authHeader)
      .then(setOrders)
      .catch(() => setLoadFailed(true));
  }, [authHeader]);

  if (!orders && !loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load your orders.</ThemedText>
      </ScreenBackground>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText type="subtitle">No orders yet</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Browse the shop to place your first order.
        </ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.list}>
        {orders.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <ThemedText type="smallBold">Order #{o.orderNumber}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(o.processedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: Brand.cyan }}>
                ${parseFloat(o.totalPrice.amount).toFixed(2)}
              </ThemedText>
            </View>

            <View style={styles.statusRow}>
              {!!o.financialStatus && <StatusPill label={o.financialStatus} />}
              {!!o.fulfillmentStatus && <StatusPill label={o.fulfillmentStatus} />}
            </View>

            {o.lineItems.map((li, i) => (
              <View key={i} style={styles.lineItem}>
                <ThemedText type="small" style={styles.lineItemTitle} numberOfLines={1}>
                  {li.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  × {li.quantity}
                </ThemedText>
              </View>
            ))}

            <View style={styles.actions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/api/account/invoice/${o.orderNumber}`)}>
                <ThemedText type="small">Invoice</ThemedText>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => WebBrowser.openBrowserAsync(o.statusUrl)}>
                <ThemedText type="small">View Details</ThemedText>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <ThemedText type="small" style={styles.pillText}>
        {label.replace(/_/g, ' ').toLowerCase()}
      </ThemedText>
    </View>
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
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.3)',
    backgroundColor: 'rgba(24, 211, 232, 0.1)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  pillText: {
    color: Brand.cyan,
    textTransform: 'capitalize',
    fontSize: 11,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  lineItemTitle: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
});
