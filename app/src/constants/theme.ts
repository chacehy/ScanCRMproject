/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// CardDex design system — shared identity with the web dashboard.
// Editorial-tactical dark: near-black canvas, zinc type scale, hairline
// bezels, monospace micro-labels, white primary action, status accents.
// The app is dark-only (like the web), so both schemes resolve to the same
// palette regardless of the device setting.
const carddex = {
  text: '#fafafa',
  background: '#050505',
  backgroundElement: 'rgba(255,255,255,0.02)',
  backgroundSelected: 'rgba(255,255,255,0.08)',
  textSecondary: '#a1a1aa',
  // extended tokens
  muted: '#71717a',
  faint: '#52525b',
  hairline: 'rgba(255,255,255,0.06)',
  bezel: 'rgba(255,255,255,0.015)',
  panel: 'rgba(255,255,255,0.02)',
  primary: '#f4f4f5',
  primaryText: '#09090b',
  danger: '#f87171',
  statusNew: '#60a5fa',
  statusContacted: '#c084fc',
  statusHot: '#fbbf24',
  statusArchived: '#a1a1aa',
} as const;

export const Colors = {
  light: carddex,
  dark: carddex,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

// Calibrated micro-radius scale — deliberately sharp, matching the web.
export const Radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
