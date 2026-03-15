import { useState, useEffect } from 'react';
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
import { ExportConfirmationModal } from '../../components/export-confirmation-modal';
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
  const [showExportModal, setShowExportModal] = useState(false);
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

  async function handleExportConfirm() {
    setExporting(true);
    try {
      await exportMonthToExcel(year, month, expenses, summary);
      setShowExportModal(false);
    } catch {
      setShowExportModal(false);
      Alert.alert(
        'Error al exportar',
        'No se pudo generar o compartir el archivo Excel. Verifica que tengas espacio disponible e intenta de nuevo.'
      );
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
        <Pressable onPress={() => setShowExportModal(true)}>
          <Ionicons name="download-outline" size={24} color={Colors.primary} />
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

      <ExportConfirmationModal
        visible={showExportModal}
        year={year}
        month={month}
        expenseCount={expenses.length}
        total={total}
        exporting={exporting}
        onConfirm={handleExportConfirm}
        onCancel={() => setShowExportModal(false)}
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
