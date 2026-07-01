import { View, Text, StyleSheet } from 'react-native';
import { Clock, Check, Flame, Archive } from 'lucide-react-native';

import { Colors, Fonts, Radii } from '@/constants/theme';

const c = Colors.dark;

export const STATUS = {
  new: { color: c.statusNew, label: 'New', Icon: Clock },
  followed_up: { color: c.statusContacted, label: 'Contacted', Icon: Check },
  hot: { color: c.statusHot, label: 'Hot', Icon: Flame },
  archived: { color: c.statusArchived, label: 'Archived', Icon: Archive },
} as const;

export type StatusKey = keyof typeof STATUS;

function resolve(status: string) {
  return STATUS[(status as StatusKey)] ?? STATUS.archived;
}

/** Tinted, outlined status pill with a leading glyph — matches the web badges. */
export function StatusBadge({ status }: { status: string }) {
  const { color, label, Icon } = resolve(status);
  return (
    <View style={[styles.badge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Icon size={10} color={color} strokeWidth={2} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
