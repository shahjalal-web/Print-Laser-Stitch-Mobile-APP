import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/category-card';
import { GradientText } from '@/components/gradient-text';
import { FixedTopBar } from '@/components/menu-button';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useApiQuery } from '@/lib/api-cache';
import { themeForCategory } from '@/lib/category-themes';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';

type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
  productsCount: number;
};

export default function HomeScreen() {
  const { data: collections, isLoading, isRefreshing, error, refetch } = useApiQuery<Collection[]>('/api/collections');
  const loadFailed = !isLoading && !collections && !!error;
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground style={styles.flex}>
      <FixedTopBar />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={Brand.yellow} />}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.six,
          paddingBottom: BottomTabInset + Spacing.four,
        }}>
        <>
          {/* Hero */}
          <View style={styles.hero}>
            <Badge text="We print · We engrave · We stitch" />
            <View style={styles.heroTitleRow}>
              <ThemedText type="title" style={styles.heroTitle}>
                Bringing your{' '}
              </ThemedText>
              <GradientText colors={[Brand.yellow, Brand.cyan]} style={styles.heroTitle}>
                vision
              </GradientText>
              <ThemedText type="title" style={styles.heroTitle}>
                {' '}to life.
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.heroSubtitle}>
              Premium custom printing, laser engraving and stitching — built for businesses, creators and car
              enthusiasts. From vinyl stickers to embroidered polos, we print, stitch or etch it for you.
            </ThemedText>

            <Image
              source={{ uri: `${SITE_ORIGIN}/Hero.jpeg` }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />

            <View style={styles.ctaRow}>
              <CtaButton label="Get a Quote →" colors={[Brand.yellow, Brand.yellowStrong]} onPress={() => router.push('/vinyl-stickers')} />
              <CtaButton label="Browse Products →" colors={[Brand.cyan, Brand.cyanStrong]} onPress={() => router.push('/shop')} />
            </View>
            <Pressable onPress={() => router.push('/gallery')} style={({ pressed }) => [styles.galleryButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.galleryButtonText}>
                View Our Gallery →
              </ThemedText>
            </Pressable>
          </View>

          {/* Custom Sticker Builder banner */}
          <Pressable style={styles.section} onPress={() => router.push('/vinyl-stickers')}>
            <View style={styles.stickerBanner}>
              <LinearGradient
                colors={['#ffb366', '#ffb366', '#ff8c1a', '#ff8c1a']}
                locations={[0, 0.379, 0.381, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.9 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.stickerBannerText}>
                <ThemedText style={styles.stickerBannerTitle}>Custom Vinyl Stickers</ThemedText>
                <ThemedText style={styles.stickerBannerBody} numberOfLines={3}>
                  Upload your artwork, pick a shape, size and finish, then see an instant proof — before you ever
                  check out.
                </ThemedText>
                <View style={styles.stickerBannerCta}>
                  <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                    Start Designing →
                  </ThemedText>
                </View>
              </View>
              <Image
                source={{ uri: `${SITE_ORIGIN}/vinyl-sticker-logo.png` }}
                style={styles.stickerBannerImage}
                contentFit="cover"
              />
            </View>
          </Pressable>

          {/* Category grid */}
          <View style={styles.section}>
            <Badge text="Make your selection" center />
            <View style={styles.sectionTitleRow}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                WHAT CAN WE{' '}
              </ThemedText>
              <GradientText colors={[Brand.yellow, Brand.cyan]} style={styles.sectionTitle}>
                MAKE FOR YOU?
              </GradientText>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.categoryIntro}>
              {collections
                ? `${collections.length} categories — pick one to see every product inside.`
                : 'Browse our full range of custom print, engraving and apparel products.'}
            </ThemedText>

            {!collections && !loadFailed && (
              <ActivityIndicator color={Brand.yellow} style={styles.loader} />
            )}
            {loadFailed && (
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Our catalog couldn&apos;t be loaded right now — please check back shortly.
              </ThemedText>
            )}

            <View style={styles.categoryGrid}>
              {collections?.map((c, i) => (
                <CategoryCard
                  key={c.id}
                  title={c.title}
                  description={c.description}
                  imageUrl={c.image?.url}
                  theme={themeForCategory(c.handle, i)}
                  onPress={() => router.push({ pathname: '/shop/[handle]', params: { handle: c.handle } })}
                />
              ))}
            </View>
          </View>

          {/* Vehicle sticker kits banner */}
          <Pressable style={styles.section} onPress={() => router.push('/vehicle-stickers')}>
            <View style={styles.vehicleBanner}>
              <Badge text="Vehicle-specific decal kits" />
              <View style={styles.bannerTitleRow}>
                <ThemedText type="subtitle" style={styles.vehicleBannerTitle}>
                  Custom Vehicle{' '}
                </ThemedText>
                <GradientText colors={[Brand.cyan, Brand.yellow]} style={styles.vehicleBannerTitle}>
                  Sticker Kits
                </GradientText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.vehicleBannerBody}>
                Pick your make, model and year — see decal sets cut perfectly for your exact vehicle. Hood sets,
                bedsides, full kits and more.
              </ThemedText>
              <Checklist items={['Hood Set', 'Bedside Decals', 'Full Vehicle Set', 'Back Decals']} color={Brand.yellow} />
              <View style={[styles.stickerBannerCta, { backgroundColor: Brand.cyan }]}>
                <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                  Find Your Vehicle →
                </ThemedText>
              </View>
              <Image
                source={{ uri: `${SITE_ORIGIN}/car wrap decal.png` }}
                style={styles.vehicleBannerImage}
                contentFit="cover"
              />
            </View>
          </Pressable>

          {/* Quick Quote Calculator banner */}
          <Pressable style={styles.section} onPress={() => router.push('/decal-quote')}>
            <View style={styles.vehicleBanner}>
              <Badge text="Window film · Wall vinyl" />
              <View style={styles.bannerTitleRow}>
                <ThemedText type="subtitle" style={styles.vehicleBannerTitle}>
                  Quick Quote{' '}
                </ThemedText>
                <GradientText colors={[Brand.cyan, Brand.yellow]} style={styles.vehicleBannerTitle}>
                  Calculator
                </GradientText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.vehicleBannerBody}>
                Add panels for doors, windows, walls, wood or metal — pick a vinyl material and get instant pricing
                with 7% Martin County tax included.
              </ThemedText>
              <Checklist
                items={['Add multiple panels in one quote', '5 vinyl materials + special order', 'Discount + 7% tax handled automatically']}
                color={Brand.cyan}
              />
              <View style={[styles.stickerBannerCta, { backgroundColor: Brand.cyan }]}>
                <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                  Open Quick Quote →
                </ThemedText>
              </View>
              <SampleQuote
                accent={Brand.cyan}
                rows={[
                  { label: '🚪 Door', value: '12″ × 12″' },
                  { label: 'Material', value: 'Full Vinyl' },
                  { label: 'Subtotal', value: '$16.00' },
                  { label: 'Tax (7%)', value: '$1.12' },
                ]}
                totalLabel="Total"
                total="$17.12"
              />
            </View>
          </Pressable>

          {/* Decal Signage Calculator banner */}
          <Pressable style={styles.section} onPress={() => router.push('/signage-quotes')}>
            <View style={[styles.vehicleBanner, { borderColor: 'rgba(217, 240, 0, 0.3)' }]}>
              <Badge text="Print & install quote generator" />
              <View style={styles.bannerTitleRow}>
                <ThemedText type="subtitle" style={styles.vehicleBannerTitle}>
                  Decal Signage{' '}
                </ThemedText>
                <GradientText colors={[Brand.yellow, Brand.magenta]} style={styles.vehicleBannerTitle}>
                  Calculator
                </GradientText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.vehicleBannerBody}>
                Enter width and length, pick a service tier (Print Only, Design &amp; Print, or Full Install), and
                get an instant quote.
              </ThemedText>
              <Checklist
                items={['Toggle between feet and inches', '3 service tiers: $10 / $12 / $18 per sq ft', 'Custom discount support']}
                color={Brand.yellow}
              />
              <View style={styles.stickerBannerCta}>
                <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                  Open Calculator →
                </ThemedText>
              </View>
              <SampleQuote
                accent={Brand.yellow}
                rows={[
                  { label: 'Width × Length', value: '1′ × 1.7′' },
                  { label: 'Service', value: 'Full Install' },
                  { label: 'Rate', value: '$18.00 / sq ft' },
                  { label: 'Quantity', value: '1' },
                ]}
                totalLabel="Grand Total"
                total="$30.60"
              />
            </View>
          </Pressable>

          {/* Print Laser Stitch University banner */}
          <Pressable style={styles.section} onPress={() => WebBrowser.openBrowserAsync('https://printlaserstitchuniversity.com/')}>
            <View style={[styles.vehicleBanner, { borderColor: 'rgba(217, 76, 179, 0.3)' }]}>
              <Image
                source={{ uri: `${SITE_ORIGIN}/university-logo.jpeg` }}
                style={styles.universityImage}
                contentFit="cover"
              />
              <Badge text="Learn the craft" />
              <View style={styles.bannerTitleRow}>
                <ThemedText type="subtitle" style={styles.vehicleBannerTitle}>
                  Print Laser Stitch{' '}
                </ThemedText>
                <GradientText colors={[Brand.magenta, Brand.cyan]} style={styles.vehicleBannerTitle}>
                  University
                </GradientText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.vehicleBannerBody}>
                Want to sharpen your design and print skills? Step into our learning hub for tutorials, walkthroughs
                and courses from the Print Laser Stitch team.
              </ThemedText>
              <View style={[styles.stickerBannerCta, { backgroundColor: Brand.magenta }]}>
                <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                  Visit the University →
                </ThemedText>
              </View>
            </View>
          </Pressable>

          {/* Why order with us */}
          <View style={styles.section}>
            <View style={styles.promiseBand}>
              <PromiseItem num="01" title="Free design proof" text="See your artwork before we ever print it." color={Brand.yellow} />
              <PromiseItem num="02" title="Fast turnaround" text="Most orders printed within 5–12 business days." color={Brand.cyan} />
              <PromiseItem num="03" title="Reprint guarantee" text="Not right? We'll redo it — no hassle." color={Brand.magenta} />
              <PromiseItem num="04" title="Florida print shop" text="Locally run and operated in Martin County, FL." color={Brand.yellow} />
            </View>
          </View>
        </>
      </ScrollView>
    </ScreenBackground>
  );
}

function Badge({ text, center }: { text: string; center?: boolean }) {
  return (
    <View style={[styles.badge, center && styles.badgeCenter]}>
      <View style={styles.badgeDot} />
      <ThemedText type="smallBold" style={styles.badgeText}>
        {text.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function CtaButton({
  label,
  colors,
  onPress,
}: {
  label: string;
  colors: [ColorValue, ColorValue];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ctaButtonWrapper, pressed && styles.pressed]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
        <ThemedText type="smallBold" style={styles.ctaButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
}

function Checklist({ items, color }: { items: string[]; color: string }) {
  return (
    <View style={styles.checklist}>
      {items.map((item) => (
        <View key={item} style={styles.checklistRow}>
          <View style={[styles.checklistCheck, { backgroundColor: `${color}33` }]}>
            <ThemedText style={[styles.checklistCheckMark, { color }]}>✓</ThemedText>
          </View>
          <ThemedText type="small" style={styles.checklistText}>
            {item}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function SampleQuote({
  accent,
  rows,
  totalLabel,
  total,
}: {
  accent: string;
  rows: { label: string; value: string }[];
  totalLabel: string;
  total: string;
}) {
  return (
    <View style={styles.sampleQuote}>
      <View style={styles.sampleQuoteHeader}>
        <View style={[styles.sampleQuoteDot, { backgroundColor: accent }]} />
        <ThemedText type="small" style={styles.sampleQuoteLabel}>
          Sample Quote
        </ThemedText>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.sampleQuoteRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {r.label}
          </ThemedText>
          <ThemedText type="small" style={styles.sampleQuoteValue}>
            {r.value}
          </ThemedText>
        </View>
      ))}
      <View style={styles.sampleQuoteDivider} />
      <View style={styles.sampleQuoteRow}>
        <ThemedText type="smallBold">{totalLabel}</ThemedText>
        <ThemedText type="smallBold" style={{ color: accent }}>
          {total}
        </ThemedText>
      </View>
    </View>
  );
}

function PromiseItem({ num, title, text, color }: { num: string; title: string; text: string; color: string }) {
  return (
    <View style={styles.promiseItem}>
      <ThemedText type="subtitle" style={[styles.promiseNum, { color }]}>
        {num}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.promiseTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  heroTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    lineHeight: 22,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: Spacing.three,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ctaButtonWrapper: {
    flex: 1,
  },
  ctaButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
  },
  ctaButtonText: {
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  galleryButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
  },
  galleryButtonText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  centerText: {
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.four,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.3)',
    backgroundColor: 'rgba(24, 211, 232, 0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  badgeCenter: {
    alignSelf: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.cyan,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1,
    color: Brand.cyan,
  },
  stickerBanner: {
    flexDirection: 'row',
    minHeight: 160,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  stickerBannerText: {
    flex: 1.2,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: 4,
  },
  stickerBannerTitle: {
    color: '#8a3e00',
    fontSize: 19,
    lineHeight: 21,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  stickerBannerBody: {
    color: '#8a4a1a',
    fontSize: 12,
    lineHeight: 16,
  },
  stickerBannerImage: {
    flex: 1,
    margin: Spacing.three,
    borderRadius: Spacing.three,
  },
  stickerBannerCta: {
    marginTop: Spacing.two,
    alignSelf: 'flex-start',
    backgroundColor: '#3fa34d',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  stickerBannerCtaText: {
    color: '#ffffff',
    fontSize: 12,
  },
  categoryIntro: {
    textAlign: 'center',
    marginTop: -Spacing.two,
    marginBottom: Spacing.one,
  },
  categoryGrid: {
    gap: Spacing.three,
  },
  checklist: {
    gap: Spacing.one,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checklistCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistCheckMark: {
    fontSize: 11,
    fontWeight: '900',
  },
  checklistText: {
    flex: 1,
  },
  sampleQuote: {
    marginTop: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Spacing.three,
    gap: Spacing.one + 2,
  },
  sampleQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 2,
  },
  sampleQuoteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sampleQuoteLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  sampleQuoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleQuoteValue: {
    fontWeight: '600',
  },
  sampleQuoteDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 2,
  },
  universityImage: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 220,
    alignSelf: 'center',
    borderRadius: Spacing.three,
    marginBottom: Spacing.one,
  },
  vehicleBanner: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.3)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  vehicleBannerTitle: {
    marginTop: Spacing.one,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  vehicleBannerBody: {
    lineHeight: 20,
  },
  vehicleBannerImage: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  promiseBand: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  promiseItem: {
    padding: Spacing.four,
    gap: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  promiseNum: {
    fontSize: 22,
  },
  promiseTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
