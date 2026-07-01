import { View, Text, StyleSheet } from 'react-native';

import { Radii } from '@/constants/theme';

/** The "CD" monogram — a white tile with the wordmark, mirroring the web header. */
export function Monogram({ size = 28 }: { size?: number }) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: Math.max(Radii.xs, size * 0.24) },
      ]}
    >
      <Text style={[styles.mark, { fontSize: size * 0.42 }]}>CD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    // subtle inner top-light like the web's shadow-inner
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  mark: {
    color: '#09090b',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
