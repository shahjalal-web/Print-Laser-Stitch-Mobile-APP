import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function EditProfileScreen() {
  const { customer, authHeader, updateToken, setCustomer } = useAuth();
  const [firstName, setFirstName] = useState(customer?.firstName ?? '');
  const [lastName, setLastName] = useState(customer?.lastName ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setError(null);
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{
        ok: boolean;
        customer: { id: string; firstName: string | null; lastName: string | null; phone: string | null };
        token?: string;
        expiresAt?: string;
      }>('/api/auth/update-profile', { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() }, authHeader);

      if (res.token) await updateToken(res.token);
      if (customer) {
        setCustomer({ ...customer, firstName: res.customer.firstName, lastName: res.customer.lastName, phone: res.customer.phone });
      }
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenBackground style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {customer?.email}
        </ThemedText>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.input}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.input}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone (e.g. +15551234567)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="phone-pad"
          style={styles.input}
        />

        {!!error && (
          <ThemedView style={styles.errorBox}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} disabled={submitting} onPress={handleSave}>
          {submitting ? <ActivityIndicator color="#000000" /> : <ThemedText type="smallBold" style={styles.buttonText}>Save</ThemedText>}
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: '#f5f5f5',
  },
  errorBox: {
    backgroundColor: 'rgba(217, 76, 179, 0.12)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  errorText: {
    color: Brand.magenta,
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
