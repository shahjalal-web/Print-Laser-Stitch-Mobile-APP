import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

const SITE_ORIGIN = 'https://www.printlaserstitch.com';

type MenuItem = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
};

export default function MoreScreen() {
  const items: MenuItem[] = [
    {
      label: 'Search',
      description: 'Find a product by name',
      icon: 'search-outline',
      action: () => {
        router.dismiss();
        router.push('/search');
      },
    },
    {
      label: 'Custom Vinyl Stickers',
      description: 'Design your own — shape, size, material, instant pricing',
      icon: 'color-wand-outline',
      action: () => {
        router.dismiss();
        router.push('/vinyl-stickers');
      },
    },
    {
      label: 'Gallery',
      description: 'See our recent work',
      icon: 'images-outline',
      action: () => {
        router.dismiss();
        router.push('/gallery');
      },
    },
    {
      label: 'Vehicle Sticker Kits',
      description: 'Find decals for your exact make, model and year',
      icon: 'car-sport-outline',
      action: () => {
        router.dismiss();
        router.push('/vehicle-stickers/index');
      },
    },
    {
      label: 'All Collections',
      description: 'Browse every product category',
      icon: 'grid-outline',
      action: () => {
        router.dismiss();
        router.push('/shop');
      },
    },
    {
      label: 'Quick Quote Calculator',
      description: 'Multi-panel + material pricing',
      icon: 'calculator-outline',
      action: () => {
        router.dismiss();
        router.push('/decal-quote');
      },
    },
    {
      label: 'Decal Signage Calculator',
      description: 'Print, design & install pricing',
      icon: 'construct-outline',
      action: () => {
        router.dismiss();
        router.push('/signage-quotes');
      },
    },
    {
      label: 'Print Laser Stitch University',
      description: 'Tutorials, walkthroughs and courses',
      icon: 'school-outline',
      action: () => WebBrowser.openBrowserAsync('https://printlaserstitchuniversity.com/'),
    },
    {
      label: 'Blog',
      description: 'Tips, guides and updates',
      icon: 'newspaper-outline',
      action: () => WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/blog`),
    },
    {
      label: 'About Us',
      description: 'Our story and Martin County shop',
      icon: 'information-circle-outline',
      action: () => WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/about`),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.row} onPress={item.action}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={20} color={Brand.cyan} />
          </View>
          <View style={styles.rowText}>
            <ThemedText type="smallBold">{item.label}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.description}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 211, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
