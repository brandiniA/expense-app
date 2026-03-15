import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDashboardStats } from '../../hooks/use-dashboard-stats';
import { FilterChips } from '../../components/filter-chips';
import { ExpenseSummaryCard } from '../../components/expense-summary-card';
import { ExpensePieChart } from '../../components/pie-chart';
import { formatCurrency } from '../../utils/format-currency';
import { formatDateString } from '../../utils/date-helpers';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import type { DateFilter, DateRange } from '../../types';

export default function DashboardScreen() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const { stats, loading, refresh } = useDashboardStats(filter, customRange);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function handleFilterSelect(newFilter: DateFilter) {
    if (newFilter === 'custom') {
      setShowStartPicker(true);
    }
    setFilter(newFilter);
  }

  function handleStartDate(_: unknown, selectedDate?: Date) {
    setShowStartPicker(false);
    if (selectedDate) {
      const start = formatDateString(selectedDate);
      setCustomRange((prev) => ({
        start,
        end: prev?.end ?? formatDateString(new Date()),
      }));
      setShowEndPicker(true);
    }
  }

  function handleEndDate(_: unknown, selectedDate?: Date) {
    setShowEndPicker(false);
    if (selectedDate) {
      setCustomRange((prev) => ({
        start: prev?.start ?? formatDateString(new Date()),
        end: formatDateString(selectedDate),
      }));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Dashboard</Text>

      <FilterChips selected={filter} onSelect={handleFilterSelect} />

      {showStartPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={handleStartDate}
          maximumDate={new Date()}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={handleEndDate}
          maximumDate={new Date()}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <View style={styles.statsContainer}>
          <View style={styles.cardsRow}>
            <ExpenseSummaryCard
              title="Total gastado"
              value={formatCurrency(stats.total)}
            />
            <ExpenseSummaryCard
              title="Promedio diario"
              value={formatCurrency(stats.daily_average)}
            />
          </View>

          {stats.top_category && (
            <ExpenseSummaryCard
              title="Categoría top"
              value={`${stats.top_category.category_icon} ${stats.top_category.category_name}`}
              subtitle={formatCurrency(stats.top_category.total)}
              color={stats.top_category.category_color}
            />
          )}

          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Distribución por categoría</Text>
            <ExpensePieChart data={stats.category_breakdown} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  screenTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  statsContainer: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  chartSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
});
