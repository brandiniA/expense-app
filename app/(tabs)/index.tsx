import { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useExpenses } from '../../hooks/use-expenses';
import { ExpenseListItem } from '../../components/expense-list-item';
import { DaySeparator } from '../../components/day-separator';
import { FabButton } from '../../components/fab-button';
import { formatCurrency } from '../../utils/format-currency';
import { groupExpensesByDate } from '../../utils/date-helpers';
import { getMonthName, getCurrentMonthYear } from '../../utils/date-helpers';
import { deleteExpense } from '../../db/repository';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import type { ExpenseWithCategory } from '../../types';

export default function HomeScreen() {
  const { expenses, loading, total, refresh } = useExpenses();
  const router = useRouter();
  const { month, year } = getCurrentMonthYear();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sections = Array.from(groupExpensesByDate(expenses)).map(
    ([date, items]) => ({
      title: date,
      data: items,
    })
  );

  function handlePress(expense: ExpenseWithCategory) {
    router.push({
      pathname: '/modal/expense-detail' as any,
      params: { expenseId: expense.id },
    });
  }

  function handleLongPress(expense: ExpenseWithCategory) {
    Alert.alert(expense.name, '¿Qué deseas hacer?', [
      {
        text: 'Editar',
        onPress: () =>
          router.push({
            pathname: '/modal/add-expense' as any,
            params: { expenseId: expense.id },
          }),
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => confirmDelete(expense),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function confirmDelete(expense: ExpenseWithCategory) {
    Alert.alert(
      'Eliminar gasto',
      `¿Estás segura de eliminar "${expense.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(expense.id);
            refresh();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthLabel}>
          {getMonthName(month)} {year}
        </Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        <Text style={styles.totalLabel}>Total gastado</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>No hay gastos este mes</Text>
          <Text style={styles.emptySubtext}>
            Presiona + para agregar tu primer gasto
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ExpenseListItem expense={item} onPress={handlePress} onLongPress={handleLongPress} />
          )}
          renderSectionHeader={({ section }) => (
            <DaySeparator date={section.title} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FabButton onPress={() => router.push('/modal/add-expense' as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
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
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
});
