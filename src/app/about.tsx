import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

const TEAM: { name: string; role: string; initial: string; color: string; bio: string }[] = [
  {
    name: 'Anthony',
    role: 'Founder & Owner',
    initial: 'A',
    color: Brand.yellow,
    bio: 'I started Print Laser Stitch as a passion project — me in a small space, pressing shirts and experimenting with machines just to see what I could create. Word spread, and what started as an idea grew into a business serving individuals, startups, and companies all over Florida and beyond. I still personally handle the majority of the day-to-day, from designing to printing to wrapping orders.',
  },
  {
    name: 'Ann-Kristie',
    role: 'Apparel Lead · Marketing',
    initial: 'AK',
    color: Brand.magenta,
    bio: "Anthony's wife and partner through it all. She pours so much love into the apparel side — heat-pressing every shirt and making sure each piece is perfect before it goes out. She also handles our marketing and social media, helping us share our story and connect with more people.",
  },
  {
    name: 'Ali',
    role: 'Web Developer',
    initial: 'AL',
    color: Brand.cyan,
    bio: "More than a web developer — Anthony's right-hand man. He's the reason the website works the way it does: easy to browse, easy to order, easy to navigate. Long hours, never complains, and always willing to learn whatever new challenge gets thrown at him.",
  },
  {
    name: 'Jaidyn',
    role: 'Production Specialist',
    initial: 'J',
    color: Brand.yellow,
    bio: 'Smart, driven, and always willing to learn — Jaidyn has mastered nearly all of our machines and plays a hands-on role bringing customers\' ideas to life. Her favorite is the embroidery setup, where she brings precision and creativity to every stitch.',
  },
  {
    name: 'Jerry',
    role: 'Embroidery Digitizer',
    initial: 'JR',
    color: Brand.magenta,
    bio: 'Jerry has been with us for over a year and quickly became a key part of what we do. He handles all our embroidery digitizing with care and precision, redrawing every logo by hand — no shortcuts, no auto-digitizing.',
  },
];

const PROCESS_STEPS: { n: string; title: string; text: string; icon: string }[] = [
  { n: '01', title: 'Upload your logo', text: "Send us your artwork or let's create one together.", icon: '📤' },
  { n: '02', title: 'Print it', text: 'We print in-house with the richest, boldest colors.', icon: '🖨️' },
  { n: '03', title: 'Protect it', text: 'Every sticker gets laminated for max durability.', icon: '🛡️' },
  { n: '04', title: 'Cut it', text: 'Precision cut and quality checked to perfection.', icon: '✂️' },
  { n: '05', title: 'Ship it', text: 'Packed safe and shipped fast — straight to your door.', icon: '📦' },
];

const VALUES: { icon: string; title: string; text: string }[] = [
  { icon: '❤️', title: 'Real humans', text: 'Not a call center. A real person picks up the phone, every time.' },
  {
    icon: '✨',
    title: 'In-house quality',
    text: 'Every order is printed, stitched, or engraved in our Florida shop — never outsourced.',
  },
  {
    icon: '⚡',
    title: 'Fast turnaround',
    text: '5–12 business days for most orders. Need it sooner? Email info@printlaserstitch.com for rush options.',
  },
  { icon: '🤝', title: 'Built on trust', text: "One shirt or a thousand — we treat your project like it's our own business." },
];

export default function AboutScreen() {
  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <ThemedText type="small" style={styles.badgeText}>
              STUART, FLORIDA · FAMILY-OWNED
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            The story behind <ThemedText style={[styles.heroTitle, { color: Brand.yellow }]}>Print Laser Stitch</ThemedText>
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.heroBody}>
            Built on late nights, tight deadlines, and a deep belief that your project matters just as much to us as
            it does to you.
          </ThemedText>
        </View>

        <View style={styles.founderCard}>
          <View style={styles.founderAvatar}>
            <ThemedText type="title" style={{ color: '#000' }}>
              A
            </ThemedText>
          </View>
          <View style={styles.founderBadge}>
            <ThemedText type="small" style={{ color: Brand.yellow, letterSpacing: 1, fontSize: 10 }}>
              FROM THE FOUNDER
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.founderTitle}>
            Hey, I&apos;m Anthony
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.founderBody}>
            I&apos;m the owner of Print Laser Stitch — a small print shop here in Stuart, Florida, built from the
            ground up on late nights, tight deadlines, and a deep belief that your project matters just as much to
            us as it does to you.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.founderBody}>
            This shop started as a passion project — me in a small space, pressing shirts and experimenting with
            machines just to see what I could create. Over time, people started to notice the quality, and word
            spread. What was once just an idea became a growing business that now serves individuals, startups, and
            companies all over Florida and beyond.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.founderBody}>
            And while I still personally handle the majority of the day-to-day — from designing to printing to
            wrapping orders — I don&apos;t do it alone.
          </ThemedText>
        </View>

        <SectionHeading kicker="Meet the team" title="The hands behind every order" />
        <ThemedText themeColor="textSecondary" style={styles.sectionIntro}>
          We&apos;re a small team, but we put our whole hearts into every order — whether it&apos;s one shirt or a
          full storefront branding package, we treat it like it&apos;s our own business.
        </ThemedText>
        <View style={{ gap: Spacing.three }}>
          {TEAM.map((member) => (
            <View key={member.name} style={styles.teamCard}>
              <View style={[styles.teamAvatar, { backgroundColor: member.color }]}>
                <ThemedText type="smallBold" style={{ color: '#000' }}>
                  {member.initial}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={styles.teamName}>
                {member.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: member.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {member.role}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.teamBio}>
                {member.bio}
              </ThemedText>
            </View>
          ))}
        </View>

        <SectionHeading kicker="How we work" title="From idea to your door — in five steps" />
        <View style={styles.processGrid}>
          {PROCESS_STEPS.map((step) => (
            <View key={step.n} style={styles.processCard}>
              <ThemedText type="small" style={styles.processNum}>
                {step.n}
              </ThemedText>
              <ThemedText style={{ fontSize: 26 }}>{step.icon}</ThemedText>
              <ThemedText type="smallBold" style={styles.processTitle}>
                {step.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {step.text}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.valuesGrid}>
          {VALUES.map((v) => (
            <View key={v.title} style={styles.valueCard}>
              <ThemedText style={{ fontSize: 22 }}>{v.icon}</ThemedText>
              <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
                {v.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                {v.text}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.contactCard}>
          <ThemedText type="subtitle" style={styles.contactTitle}>
            Call us. A real human will pick up.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.contactBody}>
            Thank you for trusting us. We&apos;re honored to be a part of your project, and we can&apos;t wait to
            help bring your vision to life.
          </ThemedText>

          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('tel:7729852854')}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.contactLabel}>
              PHONE
            </ThemedText>
            <ThemedText type="smallBold">(772) 985-2854</ThemedText>
            <ThemedText type="small" style={{ color: Brand.cyan }}>
              Tap to call →
            </ThemedText>
          </Pressable>
          <View style={styles.contactRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.contactLabel}>
              HOURS
            </ThemedText>
            <ThemedText type="smallBold">Mon – Sat</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              9 AM – 5 PM EST
            </ThemedText>
          </View>
          <View style={styles.contactRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.contactLabel}>
              VISIT
            </ThemedText>
            <ThemedText type="smallBold">Stuart, FL</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Family-owned print shop
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.kickerBadge}>
        <ThemedText type="small" style={styles.kickerText}>
          {kicker.toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.sectionHeadingTitle}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  hero: { gap: Spacing.two, alignItems: 'center', paddingTop: Spacing.three },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.cyan },
  badgeText: { fontSize: 10, letterSpacing: 1 },
  heroTitle: { fontSize: 26, lineHeight: 32, textAlign: 'center' },
  heroBody: { textAlign: 'center', lineHeight: 20 },
  founderCard: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(217, 240, 0, 0.25)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  founderAvatar: {
    width: 64,
    height: 64,
    borderRadius: Spacing.three,
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  founderBadge: { alignSelf: 'flex-start' },
  founderTitle: { marginTop: 2 },
  founderBody: { lineHeight: 20 },
  sectionHeading: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  kickerBadge: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  kickerText: { fontSize: 10, letterSpacing: 1, color: Brand.cyan },
  sectionHeadingTitle: { textAlign: 'center', fontSize: 22 },
  sectionIntro: { textAlign: 'center', marginTop: -Spacing.two },
  teamCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.four,
    gap: 4,
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  teamName: { fontSize: 16 },
  teamBio: { lineHeight: 19, marginTop: Spacing.one },
  processGrid: { gap: Spacing.two },
  processCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.three,
    gap: 4,
  },
  processNum: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  processTitle: { marginTop: 2 },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  valueCard: {
    width: '47%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.three,
  },
  contactCard: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,18,18,0.88)',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  contactTitle: { textAlign: 'center', fontSize: 20 },
  contactBody: { textAlign: 'center', lineHeight: 20 },
  contactRow: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.three,
    gap: 2,
  },
  contactLabel: { letterSpacing: 0.5, fontSize: 10 },
});
