import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/theme';
import { formatDayLabel } from '../utils/date-helpers';

interface DaySeparatorProps {
  date: string;
}

export function DaySeparator({ date }: DaySeparatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{formatDayLabel(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
