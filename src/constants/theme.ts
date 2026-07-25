/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Ported from the website's neon-black theme (src/app/globals.css on the
// Next.js site). The brand is always this dark palette — it does not adapt
// to the system light/dark setting, so both variants below stay identical.
const brandDark = {
  text: '#f5f5f5',
  textSecondary: 'rgba(245, 245, 245, 0.6)',
  background: '#050505',
  backgroundElement: '#121212',
  backgroundSelected: '#1e1e1e',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
} as const;

export const Colors = {
  light: brandDark,
  dark: brandDark,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Neon brand accents used across CTAs, glows, and gradients on the website.
export const Brand = {
  yellow: '#d9f000',
  yellowStrong: '#b8cc00',
  cyan: '#18d3e8',
  cyanStrong: '#14b8ce',
  magenta: '#d94cb3',
  magentaStrong: '#b83a96',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
