import { View, Text, StyleSheet } from 'react-native';
import { FontSize, BorderRadius, Spacing } from '../constants/theme';

interface CategoryBadgeProps {
  name: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({
  name,
  color,
  icon,
  size = 'sm',
}: CategoryBadgeProps) {
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, isMd && styles.badgeMd]}>
      {icon ? <Text style={[styles.icon, isMd && styles.iconMd]}>{icon}</Text> : null}
      <Text style={[styles.text, { color }, isMd && styles.textMd]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  icon: {
    fontSize: FontSize.xs,
  },
  iconMd: {
    fontSize: FontSize.md,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  textMd: {
    fontSize: FontSize.sm,
  },
});
