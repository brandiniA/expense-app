import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import type { Category } from '../types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <ScrollView
      horizontal={false}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              { borderColor: cat.color },
              isSelected && { backgroundColor: cat.color + '30' },
            ]}
            onPress={() => onSelect(cat)}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text
              style={[
                styles.name,
                { color: isSelected ? cat.color : Colors.textSecondary },
                isSelected && { fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
  },
  icon: {
    fontSize: FontSize.md,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
