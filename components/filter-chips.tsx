import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { DateFilter } from '../types';

interface FilterChipsProps {
  selected: DateFilter;
  onSelect: (filter: DateFilter) => void;
}

const FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: '7days', label: '7 días' },
  { key: 'month', label: 'Este mes' },
  { key: 'custom', label: 'Personalizado' },
];

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isActive = f.key === selected;
        return (
          <Pressable
            key={f.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(f.key)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  textActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});
