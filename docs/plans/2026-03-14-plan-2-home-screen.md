# Plan 2: Pantalla Inicio - Lista de Gastos y FAB

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la pantalla principal con el resumen del mes, lista de gastos agrupados por día, y el botón flotante para agregar gastos.

**Architecture:** SectionList de React Native para agrupar gastos por fecha. Hook personalizado `useExpenses` para consultar datos. FAB con posición absoluta. Long press en items para editar/eliminar.

**Tech Stack:** React Native, expo-sqlite (via repository), TypeScript

**Prerequisite:** Plan 1 completado (base de datos, repositorio, utilidades, tabs).

---

## Task 1: Crear hook useExpenses

**Create file:** `hooks/use-expenses.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getExpensesForCurrentMonth } from '../db/repository';
import type { ExpenseWithCategory } from '../types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpensesForCurrentMonth();
      setExpenses(data);
      setTotal(data.reduce((sum, e) => sum + e.amount, 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { expenses, loading, total, refresh };
}
```

**Verify:** No TypeScript errors.

**Commit:** `feat: add useExpenses hook for current month data`

---

## Task 2: Crear componente CategoryBadge

**Create file:** `components/category-badge.tsx`

```typescript
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
```

**Verify:** No errors.

**Commit:** `feat: add CategoryBadge component`

---

## Task 3: Crear componente ExpenseListItem

**Create file:** `components/expense-list-item.tsx`

```typescript
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CategoryBadge } from './category-badge';
import { formatCurrency } from '../utils/format-currency';
import { Colors, FontSize, Spacing } from '../constants/theme';
import type { ExpenseWithCategory } from '../types';

interface ExpenseListItemProps {
  expense: ExpenseWithCategory;
  onLongPress?: (expense: ExpenseWithCategory) => void;
}

export function ExpenseListItem({ expense, onLongPress }: ExpenseListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
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
```

**Verify:** No errors.

**Commit:** `feat: add ExpenseListItem component`

---

## Task 4: Crear componente DaySeparator

**Create file:** `components/day-separator.tsx`

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/theme';
import { formatDayLabel } from '../utils/date-helpers';

interface DaySeparatorProps {
  date: string;
}

export function DaySeparator({ date }: DaySeparatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{formatDayLabel(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
```

**Verify:** No errors.

**Commit:** `feat: add DaySeparator component`

---

## Task 5: Crear componente FabButton

**Create file:** `components/fab-button.tsx`

```typescript
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/theme';

interface FabButtonProps {
  onPress: () => void;
}

export function FabButton({ onPress }: FabButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Ionicons name="add" size={32} color={Colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
    elevation: 3,
  },
});
```

**Verify:** No errors.

**Commit:** `feat: add FabButton floating action button component`

---

## Task 6: Implementar pantalla Home completa

**Edit file:** `app/(tabs)/index.tsx`

```typescript
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

  function handleLongPress(expense: ExpenseWithCategory) {
    Alert.alert(expense.name, '¿Qué deseas hacer?', [
      {
        text: 'Editar',
        onPress: () =>
          router.push({
            pathname: '/modal/add-expense',
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
            <ExpenseListItem expense={item} onLongPress={handleLongPress} />
          )}
          renderSectionHeader={({ section }) => (
            <DaySeparator date={section.title} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FabButton onPress={() => router.push('/modal/add-expense')} />
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
```

**Verify:**
```bash
npx tsc --noEmit
npx expo start --android
```
La pantalla Home debe mostrar el header con el mes y total, un empty state si no hay gastos, y el FAB (+).

**Commit:** `feat: implement Home screen with expense list and FAB`

---

## Resultado Esperado

Al completar este plan tendrás:
- Pantalla Home funcional con header de mes/total
- Lista de gastos agrupados por día con separadores
- Badge de categoría con color en cada gasto
- FAB (+) para navegación al modal de agregar gasto
- Long press para editar/eliminar gastos
- Empty state cuando no hay gastos
