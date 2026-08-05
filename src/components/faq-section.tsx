import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GradientText } from '@/components/gradient-text';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

type Faq = { q: string; a: string };

/** Generic order-FAQ block shown on product pages — mirrors the website's
 * `FAQSection.tsx`, same fixed questions on every page that uses it. */
const FAQS: Faq[] = [
  {
    q: 'Which file types work best?',
    a: 'Send us PNG, JPG, PDF, SVG or AI. For the sharpest print, aim for 300 DPI or higher — and a transparent background helps a lot when you want a clean die-cut.',
  },
  {
    q: 'Do I see the design before it prints?',
    a: 'Always. You get an online proof to review and approve first, and you can ask for tweaks until it looks right. Nothing goes on the press without your go-ahead.',
  },
  {
    q: 'How fast will my order arrive?',
    a: 'Most orders take 5–12 business days from order to delivery. Need it sooner? Email info@printlaserstitch.com about rush options.',
  },
  {
    q: 'Are there bulk discounts?',
    a: "Yes — larger quantities automatically drop the per-unit price. Planning a big run (500+)? Reach out and we'll put together a custom quote for you.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <ThemedText type="smallBold" style={styles.badgeText}>
          GOOD TO KNOW
        </ThemedText>
      </View>

      <View style={styles.headingRow}>
        <ThemedText style={styles.heading}>QUESTIONS,{'\n'}</ThemedText>
        <GradientText colors={[Brand.yellow, Brand.cyan]} style={styles.heading}>
          ANSWERED
        </GradientText>
      </View>

      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        The things customers ask us most before placing an order.
      </ThemedText>

      <View style={styles.list}>
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <View key={item.q} style={[styles.card, isOpen && styles.cardOpen]}>
              <Pressable style={styles.summary} onPress={() => setOpenIndex(isOpen ? null : i)}>
                <ThemedText type="smallBold" style={[styles.index, isOpen && styles.indexOpen]}>
                  {String(i + 1).padStart(2, '0')}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.question}>
                  {item.q}
                </ThemedText>
                <View style={[styles.toggle, isOpen && styles.toggleOpen]}>
                  <ThemedText style={[styles.toggleIcon, isOpen && styles.toggleIconOpen]}>+</ThemedText>
                </View>
              </Pressable>
              {isOpen && (
                <View style={styles.answerWrap}>
                  <ThemedText themeColor="textSecondary" style={styles.answer}>
                    {item.a}
                  </ThemedText>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: 'rgba(217, 240, 0, 0.3)',
    backgroundColor: 'rgba(217, 240, 0, 0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.yellow,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1,
    color: Brand.yellow,
  },
  headingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.three,
  },
  heading: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  cardOpen: {
    borderColor: 'rgba(217, 240, 0, 0.4)',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  index: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  indexOpen: {
    color: Brand.yellow,
  },
  question: {
    flex: 1,
    fontSize: 14,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOpen: {
    borderColor: 'rgba(217, 240, 0, 0.5)',
  },
  toggleIcon: {
    fontSize: 16,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  toggleIconOpen: {
    color: Brand.yellow,
    transform: [{ rotate: '45deg' }],
  },
  answerWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    paddingLeft: Spacing.three + 24 + Spacing.three,
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
  },
});
