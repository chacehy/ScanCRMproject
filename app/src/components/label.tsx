import { Text, type TextProps, StyleSheet } from 'react-native';

import { Fonts, Colors } from '@/constants/theme';

/** Monospace uppercase micro-label with wide tracking — the CardDex utility voice. */
export function Label({ style, ...rest }: TextProps) {
  return <Text style={[styles.label, style]} {...rest} />;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.mono,
    color: Colors.dark.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
