import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

const HOURS: { day: string; time: string }[] = [
  { day: 'Mon', time: '7:30am–5:30pm' },
  { day: 'Tue', time: '7:30am–5:30pm' },
  { day: 'Wed', time: '7:30am–5:30pm' },
  { day: 'Thu', time: '7:30am–5:30pm' },
  { day: 'Fri', time: '7:30am–5:30pm' },
  { day: 'Sat', time: '10am–1:30pm' },
  { day: 'Sun', time: 'Closed' },
];

const SOCIALS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string; color: string }[] = [
  { label: 'Facebook', icon: 'logo-facebook', href: 'https://www.facebook.com/share/1D34YQAGuE/?mibextid=wwXIfr', color: Brand.cyan },
  { label: 'Instagram', icon: 'logo-instagram', href: 'https://www.instagram.com/print_laser_stitch', color: Brand.magenta },
  { label: 'Yelp', icon: 'star', href: 'https://yelp.to/v94oy-jn5w', color: Brand.yellow },
];

/** Compact footer — shop hours, contact and social links. Deliberately
 * lighter than the website's full footer: navigation links (Explore/Account
 * columns) would just duplicate the tab bar + More menu, which mobile
 * already has, so only the genuinely new info (hours/contact/social) is
 * kept. Shown once, at the bottom of the Home tab. */
export function AppFooter() {
  return (
    <View style={styles.container}>
      <View style={styles.socialRow}>
        {SOCIALS.map((s) => (
          <Pressable
            key={s.label}
            onPress={() => Linking.openURL(s.href)}
            style={[styles.socialButton, { borderColor: `${s.color}4d` }]}>
            <Ionicons name={s.icon} size={16} color={s.color} />
          </Pressable>
        ))}
      </View>

      <View style={styles.hoursCard}>
        <ThemedText type="smallBold" style={styles.hoursTitle}>
          Hours <ThemedText themeColor="textSecondary">(Eastern Time)</ThemedText>
        </ThemedText>
        <View style={styles.hoursGrid}>
          {HOURS.map((h) => (
            <View key={h.day} style={styles.hoursRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {h.day}
              </ThemedText>
              <ThemedText type="small" style={h.time === 'Closed' ? styles.hoursClosed : styles.hoursOpen}>
                {h.time}
              </ThemedText>
            </View>
          ))}
        </View>
        <Pressable onPress={() => Linking.openURL('mailto:info@printlaserstitch.com')} style={styles.emailRow}>
          <Ionicons name="mail-outline" size={15} color={Brand.cyan} />
          <ThemedText type="small" style={{ color: Brand.cyan }}>
            info@printlaserstitch.com
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => Linking.openURL('tel:+17729852854')} style={styles.emailRow}>
          <Ionicons name="call-outline" size={15} color={Brand.cyan} />
          <ThemedText type="small" style={{ color: Brand.cyan }}>
            (772) 985-2854
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() =>
            Linking.openURL('https://www.google.com/maps/search/?api=1&query=3141+SE+Dominica+Terrace%2C+Stuart%2C+FL+34997')
          }
          style={styles.emailRow}>
          <Ionicons name="location-outline" size={15} color={Brand.cyan} />
          <ThemedText type="small" style={[{ color: Brand.cyan }, styles.addressText]}>
            3141 SE Dominica Terrace, Stuart, FL 34997
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.copyright}>
        © {new Date().getFullYear()} Print Laser Stitch
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursCard: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  hoursTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.five,
    rowGap: Spacing.one,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '42%',
  },
  hoursOpen: {
    fontWeight: '600',
  },
  hoursClosed: {
    color: 'rgba(245,245,245,0.4)',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  addressText: {
    flexShrink: 1,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 11,
  },
});
