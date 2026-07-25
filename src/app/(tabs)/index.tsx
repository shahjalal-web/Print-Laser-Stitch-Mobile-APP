import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButtonRow } from '@/components/menu-button';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';

type Collection = {
  id: string;
  handle: string;
  title: string;
  image: { url: string; altText: string | null } | null;
  productsCount: number;
};

export default function HomeScreen() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    api
      .get<Collection[]>('/api/collections')
      .then(setCollections)
      .catch(() => setLoadFailed(true));
  }, []);

  return (
    <ScreenBackground style={styles.flex}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <MenuButtonRow />
          {/* Hero */}
          <View style={styles.hero}>
            <Badge text="We print · We engrave · We stitch" />
            <ThemedText type="title" style={styles.heroTitle}>
              Bringing your <ThemedText type="title" style={{ color: Brand.yellow }}>vision</ThemedText> to life.
            </ThemedText>
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
              <CtaButton label="Get a Quote" colors={[Brand.yellow, Brand.yellowStrong]} onPress={() => router.push('/shop')} />
              <CtaButton label="Browse Products" colors={[Brand.cyan, Brand.cyanStrong]} onPress={() => router.push('/shop')} />
            </View>
          </View>

          {/* Custom Sticker Builder banner */}
          <Pressable style={styles.section} onPress={() => router.push('/shop')}>
            <View style={styles.stickerBanner}>
              <View style={styles.stickerBannerText}>
                <ThemedText type="smallBold" style={styles.stickerBannerKicker}>
                  Design it yourself
                </ThemedText>
                <ThemedText type="subtitle" style={styles.stickerBannerTitle}>
                  Custom Vinyl Stickers
                </ThemedText>
                <ThemedText style={styles.stickerBannerBody}>
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
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              What can we make for you?
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
              {collections?.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.categoryCard}
                  onPress={() => router.push({ pathname: '/shop/[handle]', params: { handle: c.handle } })}>
                  <ThemedView type="backgroundElement" style={styles.categoryImageWrap}>
                    {c.image && (
                      <Image source={{ uri: c.image.url }} style={styles.categoryImage} contentFit="cover" />
                    )}
                  </ThemedView>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.categoryTitle}>
                    {c.title}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Vehicle sticker kits banner */}
          <Pressable style={styles.section} onPress={() => router.push('/vehicle-stickers/index')}>
            <View style={styles.vehicleBanner}>
              <Badge text="Vehicle-specific decal kits" />
              <ThemedText type="subtitle" style={styles.vehicleBannerTitle}>
                Custom Vehicle Sticker Kits
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.vehicleBannerBody}>
                Pick your make, model and year — see decal sets cut perfectly for your exact vehicle. Hood sets,
                bedsides, full kits and more.
              </ThemedText>
              <Image
                source={{ uri: `${SITE_ORIGIN}/car wrap decal.png` }}
                style={styles.vehicleBannerImage}
                contentFit="cover"
              />
              <View style={[styles.stickerBannerCta, { backgroundColor: Brand.cyan }]}>
                <ThemedText type="smallBold" style={styles.stickerBannerCtaText}>
                  Find Your Vehicle →
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
        </SafeAreaView>
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
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
        <ThemedText type="smallBold" style={styles.ctaButtonText}>
          {label}
        </ThemedText>
      </LinearGradient>
    </Pressable>
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
  heroTitle: {
    lineHeight: 44,
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
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ctaButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
  },
  ctaButtonText: {
    color: '#000000',
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
  sectionTitle: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
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
    borderRadius: Spacing.four,
    overflow: 'hidden',
    backgroundColor: '#ffb366',
  },
  stickerBannerText: {
    flex: 1.2,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  stickerBannerKicker: {
    color: '#8a3e00',
    fontSize: 11,
    letterSpacing: 1,
  },
  stickerBannerTitle: {
    color: '#8a3e00',
  },
  stickerBannerBody: {
    color: '#8a4a1a',
    fontSize: 13,
    lineHeight: 18,
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
  stickerBannerImage: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  categoryCard: {
    width: '47%',
    gap: Spacing.one,
  },
  categoryImageWrap: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryTitle: {
    textAlign: 'center',
  },
  vehicleBanner: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(24, 211, 232, 0.3)',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  vehicleBannerTitle: {
    marginTop: Spacing.one,
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
