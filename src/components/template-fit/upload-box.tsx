import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { pickDesignImage, uploadDesignImage, type PickedDesign } from '@/lib/template-fit/upload';

export type UploadSlot = {
  file: PickedDesign | null;
  fileUrl: string | null;
  isUploading: boolean;
  error: string | null;
};

export const EMPTY_UPLOAD_SLOT: UploadSlot = { file: null, fileUrl: null, isUploading: false, error: null };

export async function pickAndUpload(set: (slot: UploadSlot) => void) {
  const picked = await pickDesignImage();
  if (!picked) return;
  set({ file: picked, fileUrl: null, isUploading: true, error: null });
  try {
    const url = await uploadDesignImage(picked);
    set({ file: picked, fileUrl: url, isUploading: false, error: null });
  } catch (err) {
    set({
      file: picked,
      fileUrl: null,
      isUploading: false,
      error: err instanceof Error ? err.message : 'Upload failed. Please try again.',
    });
  }
}

export function UploadBox({
  label,
  slot,
  onSelect,
  onClear,
}: {
  label?: string;
  slot: UploadSlot;
  onSelect: () => void;
  onClear: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <Pressable
        onPress={onSelect}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.box, pressed && styles.boxPressed, slot.error && styles.boxError]}>
        {slot.isUploading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.cyan} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              Uploading…
            </ThemedText>
          </View>
        ) : slot.fileUrl && slot.file ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: slot.file.uri }} style={styles.previewImage} contentFit="cover" />
            <Pressable
              style={styles.clearButton}
              onPress={(e) => {
                e.stopPropagation();
                onClear();
              }}
              hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>
                ✕
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <ThemedText type="smallBold">⬆ Upload design</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              PNG or JPG
            </ThemedText>
          </View>
        )}
      </Pressable>
      {slot.error && (
        <ThemedText type="small" style={styles.errorText}>
          {slot.error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing.one },
  label: { textTransform: 'uppercase', letterSpacing: 0.5 },
  box: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  boxPressed: { backgroundColor: 'rgba(255,255,255,0.07)' },
  boxError: { borderColor: Brand.magenta },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: Spacing.two },
  hint: { textAlign: 'center' },
  previewWrap: { flex: 1 },
  previewImage: { flex: 1, width: '100%', height: '100%' },
  clearButton: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  errorText: { color: Brand.magenta },
});
