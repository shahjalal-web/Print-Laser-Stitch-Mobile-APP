import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Ports the website's AmbientBackground (src/components/AmbientBackground.tsx
// on the Next.js site) — three slow-drifting blurred orbs in the same
// indigo/cyan/pink palette. RN has no CSS blur filter and react-native-svg's
// radial gradients hit a broken native module on this Expo Go build, so each
// orb is approximated with concentric circles of falling opacity — a cheap,
// dependency-free "poor man's radial gradient" that reads the same as a
// blurred glow at this scale.

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const RINGS = 6;

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

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [progress, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + progress.value * driftX },
      { translateY: startY + progress.value * driftY },
    ],
  }));

  return (
    <Animated.View style={[styles.orb, { width: size, height: size }, style]}>
      {Array.from({ length: RINGS }).map((_, i) => {
        // Rings shrink from the outside in; opacity falls off quadratically
        // so the center reads as a soft core rather than a hard disc.
        const t = (RINGS - i) / RINGS;
        const ringSize = size * t;
        const ringOpacity = opacity * (1 - t) * (1 - t) * 3.2;
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
              backgroundColor: color,
              opacity: Math.min(ringOpacity, 1),
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
        opacity={0.45}
        startX={-orbSize * 0.35}
        startY={-orbSize * 0.25}
        driftX={screenWidth * 0.25}
        driftY={screenHeight * 0.08}
        duration={16000}
      />
      <Orb
        size={orbSize * 0.9}
        color="#22d3ee"
        opacity={0.4}
        startX={screenWidth * 0.35}
        startY={screenHeight * 0.22}
        driftX={-screenWidth * 0.3}
        driftY={screenHeight * 0.1}
        duration={19000}
      />
      <Orb
        size={orbSize * 0.8}
        color="#ec4899"
        opacity={0.38}
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
