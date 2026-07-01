import { View, type ViewProps, type ViewStyle, StyleSheet } from 'react-native';

import { Radii } from '@/constants/theme';

type CardProps = ViewProps & {
  /** Inner content padding. Set to 0 for pressable rows that manage their own. */
  contentStyle?: ViewStyle | ViewStyle[];
};

/**
 * The CardDex signature: a 1px hairline bezel wrapping an inner panel, giving
 * surfaces a machined, double-framed edge that reads the same as the web app.
 */
export function Card({ children, style, contentStyle, ...rest }: CardProps) {
  return (
    <View style={[styles.bezel, style]} {...rest}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );
}

export const bezelStyles = StyleSheet.create({
  bezel: {
    padding: 1,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  inner: {
    borderRadius: Radii.lg - 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    backgroundColor: 'rgba(9,9,11,0.35)',
  },
});

const styles = bezelStyles;
