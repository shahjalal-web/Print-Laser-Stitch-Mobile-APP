import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AmbientBackground } from './ambient-background';

/** Drop-in replacement for the outermost <ThemedView> on a top-level screen —
 * paints the site's drifting-orb ambient background behind the content.
 *
 * The ambient layer lives in its own unpadded wrapper so it always fills
 * edge-to-edge; `style` (which may include padding, e.g. centered loading
 * states) is applied to an inner View instead, so padding never insets the
 * background itself and leaves a gap at the screen edge. */
export function ScreenBackground({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={styles.flex}>
      <AmbientBackground />
      <View style={[styles.flex, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
