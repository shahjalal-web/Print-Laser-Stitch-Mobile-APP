import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

/** Long text (product descriptions, etc.) with a "Show more / Show less"
 * toggle once it exceeds `maxChars` — matches the website's
 * ExpandableDescription (350 chars / 4 lines collapsed). */
export function ExpandableText({
  text,
  maxChars = 350,
  numberOfLinesCollapsed = 4,
  style,
}: {
  text: string;
  maxChars?: number;
  numberOfLinesCollapsed?: number;
  style?: StyleProp<TextStyle>;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.trim().length > maxChars;

  return (
    <View>
      <ThemedText themeColor="textSecondary" style={style} numberOfLines={needsToggle && !expanded ? numberOfLinesCollapsed : undefined}>
        {text}
      </ThemedText>
      {needsToggle && (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8} style={styles.toggle}>
          <ThemedText type="small" style={styles.toggleText}>
            {expanded ? 'Show less' : 'Show more'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
  },
  toggleText: {
    color: Brand.cyan,
    fontWeight: '700',
  },
});
