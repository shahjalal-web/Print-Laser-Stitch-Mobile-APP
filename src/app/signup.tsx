import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-store';

export default function SignupScreen() {
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    const result = await signup({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      router.back();
    } else {
      setError(result.error);
    }
  }

  return (
    <ScreenBackground style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
          placeholder="Last name (optional)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 8 characters)"
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

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} disabled={submitting} onPress={handleSubmit}>
          {submitting ? <ActivityIndicator color="#000000" /> : <ThemedText type="smallBold" style={styles.buttonText}>Create Account</ThemedText>}
        </Pressable>

        <Link href="/login" replace>
          <ThemedText type="small" themeColor="textSecondary">
            Already have an account? <ThemedText type="small" style={{ color: Brand.cyan }}>Log in</ThemedText>
          </ThemedText>
        </Link>
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
