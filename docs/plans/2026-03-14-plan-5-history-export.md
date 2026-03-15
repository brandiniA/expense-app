# Plan 5: Historial y Exportación a Excel

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la pantalla de historial con lista de meses, detalle de mes con desglose por categoría, y exportación a Excel (.xlsx).

**Architecture:** La pantalla Historial muestra una FlatList de meses. Al tocar uno, navega a un modal con detalle del mes (total, desglose, lista de gastos). Botón de exportar genera un .xlsx con SheetJS, lo guarda con expo-file-system y lo comparte con expo-sharing.

**Tech Stack:** React Native, xlsx (SheetJS), expo-file-system, expo-sharing, TypeScript

**Prerequisite:** Plan 1 completado (repositorio y utilidades).

---

## Task 1: Crear utilidad de exportación Excel

**Create file:** `utils/export-excel.ts`

```typescript
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ExpenseWithCategory, CategorySummary } from '../types';
import { getMonthName } from './date-helpers';

export async function exportMonthToExcel(
  year: number,
  month: number,
  expenses: ExpenseWithCategory[],
  categorySummary: CategorySummary[]
): Promise<void> {
  const monthName = getMonthName(month);

  const expenseRows = expenses.map((e) => ({
    Fecha: e.date,
    Nombre: e.name,
    Categoría: e.category_name,
    Monto: e.amount,
    Notas: e.notes ?? '',
  }));

  const summaryRows = categorySummary.map((c) => ({
    Categoría: c.category_name,
    Total: c.total,
    Porcentaje: `${c.percentage.toFixed(1)}%`,
    'Num. Gastos': c.count,
  }));

  const wb = XLSX.utils.book_new();

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos');

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  const fileName = `Gastos_${monthName}_${year}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Gastos de ${monthName} ${year}`,
    });
  }
}
```

**Verify:** No TypeScript errors.

**Commit:** `feat: add Excel export utility using SheetJS`

---

## Task 2: Implementar pantalla Historial

**Edit file:** `app/(tabs)/history.tsx`

```typescript
import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthsList } from '../../db/repository';
import { getMonthName } from '../../utils/date-helpers';
import { formatCurrency } from '../../utils/format-currency';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { MonthSummary } from '../../types';

export default function HistoryScreen() {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadMonths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonthsList();
      setMonths(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonths();
    }, [loadMonths])
  );

  function handleMonthPress(item: MonthSummary) {
    router.push({
      pathname: '/modal/month-detail',
      params: { year: item.year, month: item.month_number },
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>

      {months.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No hay historial todavía</Text>
          <Text style={styles.emptySubtext}>
            Los meses aparecerán aquí conforme registres gastos
          </Text>
        </View>
      ) : (
        <FlatList
          data={months}
          keyExtractor={(item) => item.month}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.monthCard,
                pressed && styles.monthCardPressed,
              ]}
              onPress={() => handleMonthPress(item)}
            >
              <View>
                <Text style={styles.monthName}>
                  {getMonthName(item.month_number)} {item.year}
                </Text>
                <Text style={styles.monthCount}>
                  {item.expense_count} gasto{item.expense_count !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.monthTotal}>
                {formatCurrency(item.total)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  monthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  monthCardPressed: {
    opacity: 0.7,
  },
  monthName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  monthCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  monthTotal: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
```

**Verify:** No errors.

**Commit:** `feat: implement History screen with month list`

---

## Task 3: Implementar modal detalle de mes

**Create file:** `app/modal/month-detail.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getExpensesByMonth,
  getCategorySummary,
} from '../../db/repository';
import { CategoryBadge } from '../../components/category-badge';
import { getMonthName } from '../../utils/date-helpers';
import { formatCurrency } from '../../utils/format-currency';
import { exportMonthToExcel } from '../../utils/export-excel';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { ExpenseWithCategory, CategorySummary as CS } from '../../types';

export default function MonthDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ year: string; month: string }>();
  const year = Number(params.year);
  const month = Number(params.month);

  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [summary, setSummary] = useState<CS[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function loadData() {
    setLoading(true);
    try {
      const monthStr = String(month).padStart(2, '0');
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const [expenseData, summaryData] = await Promise.all([
        getExpensesByMonth(year, month),
        getCategorySummary(startDate, endDate),
      ]);

      setExpenses(expenseData);
      setSummary(summaryData);
      setTotal(expenseData.reduce((sum, e) => sum + e.amount, 0));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportMonthToExcel(year, month, expenses, summary);
    } catch {
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.handleBar} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {getMonthName(month)} {year}
        </Text>
        <Pressable onPress={handleExport} disabled={exporting}>
          <Ionicons
            name="download-outline"
            size={24}
            color={exporting ? Colors.textMuted : Colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total del mes</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        <Text style={styles.totalCount}>
          {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Desglose por categoría</Text>

      <FlatList
        data={summary}
        keyExtractor={(item) => String(item.category_id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.summaryRow}>
            <CategoryBadge
              name={item.category_name}
              color={item.category_color}
              icon={item.category_icon}
              size="md"
            />
            <View style={styles.summaryRight}>
              <Text style={styles.summaryPercent}>
                {item.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  totalCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  totalCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryPercent: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  summaryAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 90,
    textAlign: 'right',
  },
});
```

**Verify:**
```bash
npx tsc --noEmit
npx expo start --android
```
Probar: Historial → tocar un mes → ver detalle → presionar botón de descarga → compartir archivo Excel.

**Commit:** `feat: implement month detail modal with Excel export`

---

## Resultado Esperado

Al completar este plan tendrás:
- Pantalla Historial con lista de meses (nombre, total, conteo)
- Modal de detalle de mes con total y desglose por categoría
- Botón de exportar Excel (superior derecho) que genera .xlsx
- Excel con 2 hojas: "Gastos" (detalle) y "Resumen" (por categoría)
- Compartir vía diálogo nativo de Android
