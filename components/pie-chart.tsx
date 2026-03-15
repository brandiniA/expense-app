import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { CategoryBadge } from './category-badge';
import { formatCurrency } from '../utils/format-currency';
import { Colors, FontSize, Spacing } from '../constants/theme';
import type { CategorySummary } from '../types';

interface PieChartProps {
  data: CategorySummary[];
}

const screenWidth = Dimensions.get('window').width;

export function ExpensePieChart({ data }: PieChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin datos para mostrar</Text>
      </View>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category_name,
    amount: item.total,
    color: item.category_color,
    legendFontColor: Colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <RNPieChart
        data={chartData}
        width={screenWidth - Spacing.lg * 2}
        height={200}
        chartConfig={{
          color: () => Colors.primary,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false}
      />

      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.category_id} style={styles.legendItem}>
            <CategoryBadge
              name={item.category_name}
              color={item.category_color}
              icon={item.category_icon}
              size="sm"
            />
            <Text style={styles.legendPercent}>
              {item.percentage.toFixed(1)}%
            </Text>
            <Text style={styles.legendAmount}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  empty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  legend: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendPercent: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 'auto',
    minWidth: 50,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 90,
    textAlign: 'right',
  },
});
