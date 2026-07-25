import { Image } from 'expo-image';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { QR_TYPE_ICONS, QR_TYPE_LABELS, type QrCodeType } from '@/lib/qr-encode';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type QrCodeEntry = {
  id: string;
  type: QrCodeType;
  title: string;
  payload: string;
  fields: Record<string, string>;
  createdAt: string;
};

export default function QrCodesScreen() {
  const { authHeader } = useAuth();
  const [codes, setCodes] = useState<QrCodeEntry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ codes: QrCodeEntry[] }>('/api/account/qr-codes', authHeader)
      .then((res) => setCodes(res.codes))
      .catch(() => setLoadFailed(true));
  }, [authHeader]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!codes && !loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load your QR codes.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.list}>
        <Link href="/account/qr-codes/new" asChild>
          <Pressable style={styles.newButton}>
            <ThemedText type="smallBold" style={styles.newButtonText}>
              + New QR Code
            </ThemedText>
          </Pressable>
        </Link>

        {codes && codes.length === 0 && (
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            No QR codes yet — create one above.
          </ThemedText>
        )}

        {codes?.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.qrWrap}>
              <Image
                source={{ uri: `${API_BASE_URL}/api/qr-image?size=200&payload=${encodeURIComponent(entry.payload)}` }}
                style={styles.qrImage}
                contentFit="contain"
              />
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <ThemedText type="small" themeColor="textSecondary">
                  {QR_TYPE_ICONS[entry.type]} {QR_TYPE_LABELS[entry.type]}
                </ThemedText>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {entry.title}
                </ThemedText>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: '/account/qr-codes/[id]/edit', params: { id: entry.id } })}>
                  <ThemedText type="small">Edit</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={async () => {
                    Alert.alert('Delete QR code?', `"${entry.title}" can't be recovered.`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const url = `${API_BASE_URL}/api/account/qr-codes/${entry.id}`;
                            const res = await fetch(url, { method: 'DELETE', headers: { ...authHeader } });
                            if (res.ok) setCodes((prev) => prev?.filter((c) => c.id !== entry.id) ?? null);
                          } catch (err) {
                            Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not delete QR code.');
                          }
                        },
                      },
                    ]);
                  }}>
                  <ThemedText type="small" style={{ color: Brand.magenta }}>
                    Delete
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  centerText: { textAlign: 'center', marginTop: Spacing.six },
  list: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  newButton: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  qrWrap: {
    backgroundColor: '#ffffff',
    padding: Spacing.four,
    alignItems: 'center',
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  deleteButton: {
    borderColor: 'rgba(217, 76, 179, 0.3)',
  },
});
