import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function ChangePasswordScreen() {
  const { authHeader, updateToken } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setError(null);
    if (password.length < 5) {
      setError('Password must be at least 5 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; token?: string }>('/api/auth/change-password', { password }, authHeader);
      if (res.token) await updateToken(res.token);
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenBackground style={styles.flex}>
      <View style={styles.container}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm new password"
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
          style={styles.input}
        />

        {!!error && (
          <ThemedView style={styles.errorBox}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {success && (
          <ThemedText type="small" style={{ color: Brand.cyan }}>
            Password updated.
          </ThemedText>
        )}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} disabled={submitting} onPress={handleSave}>
          {submitting ? <ActivityIndicator color="#000000" /> : <ThemedText type="smallBold" style={styles.buttonText}>Update Password</ThemedText>}
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
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
