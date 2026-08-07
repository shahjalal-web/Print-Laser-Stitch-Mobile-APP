import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { resizedImageUrl } from '@/lib/image-url';

// Bounded pulse count so the skeleton animation always terminates on its own
// even if onLoad/onError never fires (dead request, offline, etc.) — never
// an unbounded loop like the ambient-background crash this app already hit.
const SKELETON_MAX_PULSES = 30;

/**
 * Shopify/Cloudinary-aware <Image> wrapper: requests a CDN rendition sized
 * for where it'll actually render (instead of downloading the full-res
 * original for a thumbnail slot), and shows a pulsing skeleton in place of
 * the raw background color while the image is in flight — falling back to
 * `fallback` on a missing URL or a failed load instead of staying blank.
 */
export function NetworkImage({
  uri,
  width,
  style,
  contentFit = 'cover',
  fallback,
}: {
  uri?: string | null;
  /** Approximate width (dp) this image renders at — used to pick a CDN size. */
  width: number;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  fallback?: ReactNode;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(uri ? 'loading' : 'error');
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    setStatus(uri ? 'loading' : 'error');
  }, [uri]);

  useEffect(() => {
    if (status !== 'loading') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ]),
      { iterations: SKELETON_MAX_PULSES },
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const targetWidth = Math.round(Math.min(Math.max(width * PixelRatio.get(), 80), 1600));

  return (
    <View style={[styles.base, style]}>
      {status === 'loading' && <Animated.View style={[StyleSheet.absoluteFill, styles.skeleton, { opacity: pulse }]} />}
      {status !== 'error' && !!uri && (
        <Image
          source={{ uri: resizedImageUrl(uri, targetWidth) }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={220}
          cachePolicy="memory-disk"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'error' && fallback}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
