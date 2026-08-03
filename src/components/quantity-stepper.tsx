import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function QuantityStepper({
  value,
  min = 1,
  disabled,
  onChange,
}: {
  value: number;
  min?: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Pressable
        disabled={disabled || value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.button}>
        <ThemedText type="smallBold" style={(disabled || value <= min) && styles.buttonTextDisabled}>
          −
        </ThemedText>
      </Pressable>
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
      <Pressable disabled={disabled} onPress={() => onChange(value + 1)} style={styles.button}>
        <ThemedText type="smallBold" style={disabled && styles.buttonTextDisabled}>
          +
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
  },
  rowDisabled: { opacity: 0.4 },
  button: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  buttonTextDisabled: { opacity: 0.4 },
  value: { minWidth: 28, textAlign: 'center' },
});
