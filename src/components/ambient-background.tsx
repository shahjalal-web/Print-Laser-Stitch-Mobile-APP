import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Ports the website's AmbientBackground (src/components/AmbientBackground.tsx
// on the Next.js site) — three slow-drifting orbs in the same indigo/cyan/pink
// palette. The site blurs them with CSS blur(100px), which spreads a lot of
// low-opacity color over a huge area with no visible edge. RN has no reliable
// equivalent (react-native-svg's RadialGradient is unstable here; expo-blur's
// BlurView doesn't behave like a backdrop blur on Android and made the whole
// screen look washed out instead of just the orbs) — so this fakes the same
// "soft wash, no visible shape" look with many low-opacity, non-overlapping
// ring outlines instead of filled discs, which avoids the alpha-stacking that
// made earlier attempts read as a solid, hard-edged circle.

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// High ring count so the concentric strokes blend into a smooth gradient
// instead of reading as visible "contour line" bands — the website's CSS
// blur(100px) has no discrete steps at all, so more (thinner) rings gets
// closer to that continuous falloff. Kept moderate (not the site's original
// count) since each ring is a real bordered View — this stack gets
// rasterized to a single bitmap below, but the one-time layout/rasterize
// cost per mounted screen still scales with ring count.
const RING_COUNT = 32;

function Orb({
  size,
  color,
  opacity,
  startX,
  startY,
  driftX,
  driftY,
  duration,
}: {
  size: number;
  color: string;
  opacity: number;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  duration: number;
}) {
  const progress = useSharedValue(0);

  // `enableFreeze` (react-native-screens) stops this screen's React tree
  // from re-rendering once it's off-focus, but it does NOT touch an
  // already-running Reanimated animation — withRepeat(-1) keeps ticking on
  // the UI thread forever regardless of React's freeze state, since it
  // doesn't depend on renders to keep going. So every screen the user had
  // ever visited kept animating in the background simultaneously, which is
  // what actually drove the sustained CPU usage behind the watchdog kill —
  // explicitly starting/cancelling the animation on focus/blur is the only
  // way to actually stop it while the screen isn't visible.
  useFocusEffect(
    useCallback(() => {
      progress.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      return () => {
        cancelAnimation(progress);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]),
  );

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + progress.value * driftX },
      { translateY: startY + progress.value * driftY },
    ],
  }));

  const bandWidth = size / 2 / RING_COUNT;

  return (
    <Animated.View
      style={[styles.orb, { width: size, height: size }, style]}
      // The ring stack itself never changes — only its position does — so
      // cache it as a single bitmap and let the compositor translate that,
      // instead of re-stroking every ring's border on every animation frame.
      // Without this, the continuous per-frame CoreGraphics redraw of 3 x
      // dozens of bordered circles was pegging the CPU for as long as any
      // screen using this background stayed mounted, which is what actually
      // triggered the CPU-watchdog app termination on the client's device.
      shouldRasterizeIOS
      renderToHardwareTextureAndroid>
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        // i=0 is the outermost (largest, faintest) ring; higher i is smaller
        // and denser toward the center. Each ring is a hollow outline (not a
        // filled disc), so rings never overlap the same pixels and opacity
        // never compounds — the value below is exactly what's on screen.
        const outerRadius = (size / 2) * (1 - i / RING_COUNT);
        const ringSize = outerRadius * 2;
        const distFromCenter = i / RING_COUNT; // 0 = outer edge, ~1 = center
        const bandOpacity = opacity * Math.pow(distFromCenter, 2.4);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: (size - ringSize) / 2,
              left: (size - ringSize) / 2,
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: bandWidth + 1,
              borderColor: color,
              opacity: Math.min(bandOpacity, 1),
            }}
          />
        );
      })}
    </Animated.View>
  );
}

export function AmbientBackground() {
  const orbSize = screenWidth * 1.3;
  return (
    <View style={styles.container}>
      <Orb
        size={orbSize}
        color="#6366f1"
        opacity={0.12}
        startX={-orbSize * 0.35}
        startY={-orbSize * 0.25}
        driftX={screenWidth * 0.25}
        driftY={screenHeight * 0.08}
        duration={16000}
      />
      <Orb
        size={orbSize * 0.9}
        color="#22d3ee"
        opacity={0.11}
        startX={screenWidth * 0.35}
        startY={screenHeight * 0.22}
        driftX={-screenWidth * 0.3}
        driftY={screenHeight * 0.1}
        duration={19000}
      />
      <Orb
        size={orbSize * 0.8}
        color="#ec4899"
        opacity={0.1}
        startX={-orbSize * 0.15}
        startY={screenHeight * 0.55}
        driftX={screenWidth * 0.3}
        driftY={-screenHeight * 0.08}
        duration={14000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#050505',
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
  },
});
