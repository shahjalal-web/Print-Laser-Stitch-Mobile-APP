import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-store';

export default function AccountScreen() {
  const { isHydrated, customer, logout } = useAuth();

  if (!isHydrated) {
    return (
      <ScreenBackground style={styles.container}>
        <SafeAreaView style={styles.centerFlex}>
          <ActivityIndicator />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!customer) {
    return (
      <ScreenBackground style={styles.container}>
        <SafeAreaView style={styles.centerFlex}>
          <ThemedText type="title">Account</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Log in to see your orders, QR codes and profile.
          </ThemedText>
          <Link href="/login" asChild>
            <Pressable style={styles.primaryButton}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Log In
              </ThemedText>
            </Pressable>
          </Link>
          <Link href="/signup">
            <ThemedText type="small" style={{ color: Brand.cyan }}>
              Create an account
            </ThemedText>
          </Link>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <View style={styles.header}>
          <ThemedText type="title">{customer.displayName || customer.firstName || 'My Account'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {customer.email}
          </ThemedText>
        </View>

        <View style={styles.menu}>
          <MenuLink href="/account/orders" label="Orders" />
          <MenuLink href="/account/qr-codes/index" label="QR Codes" />
          <MenuLink href="/account/edit-profile" label="Edit Profile" />
          <MenuLink href="/account/change-password" label="Change Password" />
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <ThemedText type="smallBold" style={{ color: Brand.magenta }}>
            Log Out
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function MenuLink({
  href,
  label,
}: {
  href: '/account/orders' | '/account/qr-codes/index' | '/account/edit-profile' | '/account/change-password';
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.menuItem}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centerFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  header: {
    padding: Spacing.four,
    gap: 2,
  },
  menu: {
    marginTop: Spacing.two,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primaryButton: {
    marginTop: Spacing.three,
    backgroundColor: Brand.yellow,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    margin: Spacing.four,
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: Brand.magenta,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
