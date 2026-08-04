import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, type ColorValue, type TextStyle } from 'react-native';

/** Renders text filled with a horizontal color gradient — RN has no CSS
 * `background-clip: text` equivalent, so this masks a LinearGradient with
 * the text's own glyph shapes (the standard MaskedView technique). Matches
 * the website's `accent-gradient-text` / `bg-clip-text` heading accents.
 *
 * Must NOT be nested inside a <Text> (MaskedView renders a View, and RN
 * doesn't support inline Views inside flowing text) — use it as a sibling
 * in a row-wrapping <View>, not as a nested span. */
export function GradientText({
  children,
  colors,
  style,
}: {
  children: string;
  colors: [ColorValue, ColorValue, ...ColorValue[]];
  style?: TextStyle;
}) {
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
