import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import {
  isPreviewIncompatible,
  pickDesignFile,
  takeDesignPhoto,
  uploadDesignImage,
  type PickedDesign,
} from '@/lib/template-fit/upload';

export type UploadSlot = {
  file: PickedDesign | null;
  fileUrl: string | null;
  isUploading: boolean;
  error: string | null;
};

export const EMPTY_UPLOAD_SLOT: UploadSlot = { file: null, fileUrl: null, isUploading: false, error: null };

async function runUpload(picked: PickedDesign, set: (slot: UploadSlot) => void) {
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

/** Opens a Take Photo / Choose File chooser, then uploads the result.
 * `requirePreviewable`: reject PDF/SVG for products that need the Fit
 * Studio's visual positioning board (which can't preview those formats) —
 * mirrors the website's requirePreviewable gate in UploadBox.tsx. */
export function pickAndUpload(set: (slot: UploadSlot) => void, opts?: { requirePreviewable?: boolean }) {
  Alert.alert('Upload your design', undefined, [
    {
      text: 'Take Photo',
      onPress: async () => {
        const picked = await takeDesignPhoto();
        if (picked) void runUpload(picked, set);
      },
    },
    {
      text: 'Choose File',
      onPress: async () => {
        const picked = await pickDesignFile();
        if (!picked) return;
        if (opts?.requirePreviewable && isPreviewIncompatible(picked.mimeType)) {
          set({
            file: picked,
            fileUrl: null,
            isUploading: false,
            error:
              "This product uses a visual positioning tool that can't preview PDF/SVG files — please upload a PNG or JPG instead.",
          });
          return;
        }
        void runUpload(picked, set);
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function UploadBox({
  label,
  slot,
  onSelect,
  onClear,
  hint = 'PNG · JPG · SVG · PDF',
}: {
  label?: string;
  slot: UploadSlot;
  onSelect: () => void;
  onClear: () => void;
  hint?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const isImage = slot.file ? !isPreviewIncompatible(slot.file.mimeType) : false;

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
            {isImage ? (
              <Image source={{ uri: slot.file.uri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.center}>
                <ThemedText type="title" style={styles.fileIcon}>
                  📄
                </ThemedText>
                <ThemedText type="small" numberOfLines={2} style={styles.hint}>
                  {slot.file.name}
                </ThemedText>
              </View>
            )}
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
              {hint}
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
  fileIcon: { fontSize: 32 },
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
