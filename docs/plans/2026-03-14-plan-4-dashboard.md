# Plan 4: Dashboard - Métricas y Gráfica de Pastel

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la pantalla Dashboard con cards de métricas, filtros por período y gráfica de pastel por categoría.

**Architecture:** Hook `useDashboardStats` calcula métricas según filtro seleccionado. FilterChips controla el rango de fechas. PieChart wrapper renderiza react-native-chart-kit. Las cards muestran total, promedio diario y categoría top.

**Tech Stack:** React Native, react-native-chart-kit, react-native-svg, TypeScript

**Prerequisite:** Plan 1 completado (repositorio y utilidades).

---

## Task 1: Crear hook useDashboardStats

**Create file:** `hooks/use-dashboard-stats.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  getCategorySummary,
  getTotalForDateRange,
} from '../db/repository';
import {
  getDateRangeForFilter,
  getDaysInRange,
} from '../utils/date-helpers';
import type { DashboardStats, DateFilter, DateRange } from '../types';

export function useDashboardStats(
  filter: DateFilter,
  customRange?: DateRange
) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    daily_average: 0,
    top_category: null,
    category_breakdown: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let start: string;
      let end: string;

      if (filter === 'custom' && customRange) {
        start = customRange.start;
        end = customRange.end;
      } else if (filter !== 'custom') {
        const range = getDateRangeForFilter(filter);
        start = range.start;
        end = range.end;
      } else {
        return;
      }

      const [total, breakdown] = await Promise.all([
        getTotalForDateRange(start, end),
        getCategorySummary(start, end),
      ]);

      const days = getDaysInRange(start, end);
      const dailyAvg = days > 0 ? total / days : 0;
      const topCategory = breakdown.length > 0 ? breakdown[0] : null;

      setStats({
        total,
        daily_average: dailyAvg,
        top_category: topCategory,
        category_breakdown: breakdown,
      });
    } finally {
      setLoading(false);
    }
  }, [filter, customRange?.start, customRange?.end]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
```

**Verify:** No TypeScript errors.

**Commit:** `feat: add useDashboardStats hook`

---

## Task 2: Crear componente FilterChips

**Create file:** `components/filter-chips.tsx`

```typescript
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
```

**Verify:** No errors.

**Commit:** `feat: add FilterChips component`

---

## Task 3: Crear componente ExpenseSummaryCard

**Create file:** `components/expense-summary-card.tsx`

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface ExpenseSummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function ExpenseSummaryCard({
  title,
  value,
  subtitle,
  color,
}: ExpenseSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, color ? { color } : undefined]}>
        {value}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
```

**Verify:** No errors.

**Commit:** `feat: add ExpenseSummaryCard component`

---

## Task 4: Crear componente PieChart wrapper

**Create file:** `components/pie-chart.tsx`

```typescript
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
```

**Verify:** No errors.

**Commit:** `feat: add PieChart component with legend`

---

## Task 5: Implementar pantalla Dashboard

**Edit file:** `app/(tabs)/dashboard.tsx`

```typescript
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
```

**Verify:**
```bash
npx tsc --noEmit
npx expo start --android
```
Navegar al tab Dashboard → ver métricas y gráfica de pastel con los filtros.

**Commit:** `feat: implement Dashboard screen with metrics and pie chart`

---

## Resultado Esperado

Al completar este plan tendrás:
- Dashboard con 4 filtros de período (Hoy, 7 días, Mes, Personalizado)
- Date range picker para filtro personalizado
- Cards con: total gastado, promedio diario, categoría top
- Gráfica de pastel con distribución por categoría
- Leyenda con badge, porcentaje y monto por categoría
- Auto-refresh al cambiar de tab
