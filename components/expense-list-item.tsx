import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CategoryBadge } from './category-badge';
import { formatCurrency } from '../utils/format-currency';
import { Colors, FontSize, Spacing } from '../constants/theme';
import type { ExpenseWithCategory } from '../types';

interface ExpenseListItemProps {
  expense: ExpenseWithCategory;
  onPress?: (expense: ExpenseWithCategory) => void;
  onLongPress?: (expense: ExpenseWithCategory) => void;
}

export function ExpenseListItem({ expense, onPress, onLongPress }: ExpenseListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress?.(expense)}
      onLongPress={() => onLongPress?.(expense)}
      delayLongPress={500}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>{expense.category_icon}</Text>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {expense.name}
          </Text>
          <CategoryBadge
            name={expense.category_name}
            color={expense.category_color}
          />
        </View>
      </View>
      <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
  },
  pressed: {
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
});
