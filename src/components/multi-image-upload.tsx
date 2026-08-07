import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { pickAndUpload, type UploadSlot } from '@/components/template-fit/upload-box';
import { Brand, Spacing } from '@/constants/theme';

/** Grid of reference-photo thumbnails with an always-present "Add" tile —
 * mirrors the website's MultiImageUpload, reusing the same upload pipeline
 * (pickAndUpload/UploadBox) as every other design/reference upload in the
 * app. Each photo is its own independent slot, so slots can finish
 * uploading in any order. */
export function MultiImageUpload({
  images,
  onImagesChange,
}: {
  images: UploadSlot[];
  onImagesChange: (updater: (prev: UploadSlot[]) => UploadSlot[]) => void;
}) {
  function addOne() {
    // Nothing is appended to the array until pickAndUpload's callback
    // actually fires — if the user cancels the picker, it never fires, so
    // no dangling empty slot is left behind.
    let index = -1;
    pickAndUpload((slot) => {
      onImagesChange((prev) => {
        if (index === -1) {
          index = prev.length;
          return [...prev, slot];
        }
        const copy = [...prev];
        copy[index] = slot;
        return copy;
      });
    });
  }

  function removeAt(index: number) {
    onImagesChange((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.row}>
      {images.map((slot, i) => (
        <View key={i} style={styles.thumbWrap}>
          {slot.isUploading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Brand.cyan} size="small" />
            </View>
          ) : slot.file ? (
            <Image source={{ uri: slot.file.uri }} style={styles.thumbImage} contentFit="cover" />
          ) : (
            <View style={styles.center}>
              <ThemedText type="small">⚠</ThemedText>
            </View>
          )}
          <Pressable style={styles.removeButton} onPress={() => removeAt(i)} hitSlop={8}>
            <ThemedText type="smallBold" style={styles.removeIcon}>
              ✕
            </ThemedText>
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addTile} onPress={addOne}>
        <ThemedText style={styles.addIcon}>＋</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.addLabel}>
          ADD
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbImage: { flex: 1, width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  removeIcon: { color: '#fff', fontSize: 10 },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addIcon: { fontSize: 18, lineHeight: 20 },
  addLabel: { fontSize: 9, letterSpacing: 0.5 },
});
