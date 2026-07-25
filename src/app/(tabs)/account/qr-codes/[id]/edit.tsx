import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import {
  encodeQrPayload,
  QR_TYPE_FIELDS,
  QR_TYPE_ICONS,
  QR_TYPE_LABELS,
  QR_TYPES,
  type QrCodeType,
} from '@/lib/qr-encode';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type QrCodeEntry = {
  id: string;
  type: QrCodeType;
  title: string;
  payload: string;
  fields: Record<string, string>;
};

export default function EditQrCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authHeader } = useAuth();

  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [type, setType] = useState<QrCodeType>('url');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ code: QrCodeEntry }>(`/api/account/qr-codes/${id}`, authHeader)
      .then((res) => {
        setType(res.code.type);
        setTitle(res.code.title);
        setFields(res.code.fields);
        setLoaded(true);
      })
      .catch(() => setLoadFailed(true));
  }, [id, authHeader]);

  const payload = useMemo(() => encodeQrPayload(type, fields), [type, fields]);

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError('Name is required.');
      return;
    }
    if (!payload.trim()) {
      setError('Please fill in the required fields.');
      return;
    }
    setSaving(true);
    try {
      const url = `${API_BASE_URL}/api/account/qr-codes/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ type, title: title.trim(), fields }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new ApiError((data && data.error) || 'Could not update QR code.', res.status, data);
      }
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update QR code.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded && !loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  if (loadFailed) {
    return (
      <ScreenBackground style={styles.centerFlex}>
        <ThemedText themeColor="textSecondary">Couldn&apos;t load this QR code.</ThemedText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Type
        </ThemedText>
        <View style={styles.chipRow}>
          {QR_TYPES.map((t) => {
            const isActive = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  setFields({});
                }}
                style={[styles.chip, isActive && styles.chipActive]}>
                <ThemedText type="small" themeColor={isActive ? undefined : 'textSecondary'} style={isActive ? { color: Brand.yellow } : undefined}>
                  {QR_TYPE_ICONS[t]} {QR_TYPE_LABELS[t]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Name (for your reference)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.input}
        />

        {QR_TYPE_FIELDS[type].map((f) =>
          f.type === 'select' ? (
            <View key={f.key} style={styles.fieldGroup}>
              <ThemedText type="small" themeColor="textSecondary">
                {f.label}
              </ThemedText>
              <View style={styles.chipRow}>
                {f.options?.map((opt) => {
                  const isActive = (fields[f.key] ?? f.options?.[0]) === opt;
                  return (
                    <Pressable key={opt} onPress={() => setField(f.key, opt)} style={[styles.chip, isActive && styles.chipActive]}>
                      <ThemedText type="small" themeColor={isActive ? undefined : 'textSecondary'} style={isActive ? { color: Brand.yellow } : undefined}>
                        {opt}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <TextInput
              key={f.key}
              value={fields[f.key] ?? ''}
              onChangeText={(v) => setField(f.key, v)}
              placeholder={f.label + (f.required ? ' *' : '')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.input, f.type === 'textarea' && styles.inputMultiline]}
              multiline={f.type === 'textarea'}
              keyboardType={f.type === 'number' ? 'numeric' : f.type === 'email' ? 'email-address' : f.type === 'tel' ? 'phone-pad' : 'default'}
              secureTextEntry={f.key === 'password'}
              autoCapitalize={f.type === 'email' || f.type === 'url' ? 'none' : 'sentences'}
            />
          ),
        )}

        {!!payload.trim() && (
          <View style={styles.previewSection}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Preview
            </ThemedText>
            <ThemedView style={styles.previewWrap}>
              <Image
                source={{ uri: `${API_BASE_URL}/api/qr-image?size=220&payload=${encodeURIComponent(payload)}` }}
                style={styles.previewImage}
                contentFit="contain"
              />
            </ThemedView>
          </View>
        )}

        {!!error && (
          <ThemedView style={styles.errorBox}>
            <ThemedText type="small" style={{ color: Brand.magenta }}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        <Pressable style={[styles.button, saving && styles.buttonDisabled]} disabled={saving} onPress={handleSave}>
          {saving ? <ActivityIndicator color="#000000" /> : <ThemedText type="smallBold" style={styles.buttonText}>Save Changes</ThemedText>}
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
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
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: '#f5f5f5',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    gap: Spacing.two,
  },
  previewSection: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  previewWrap: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignSelf: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
  },
  errorBox: {
    backgroundColor: 'rgba(217, 76, 179, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  button: {
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
