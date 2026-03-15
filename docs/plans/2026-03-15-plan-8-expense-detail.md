# Plan 8: Pantalla Detalle de Gasto

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar una pantalla de detalle de gasto accesible al tocar cualquier item de la lista en Home, con vista completa de todos los campos y acciones de editar y eliminar.

**Architecture:** Nueva ruta `modal/expense-detail.tsx` como screen (no modal) en el Stack de expo-router. Al presionar un item en la lista de Home, se navega a esta pantalla pasando el `expenseId` como parámetro. La pantalla consulta el gasto directamente de Supabase via una nueva función `getExpenseById` en el repositorio. Las acciones de editar/eliminar se muestran como botones en la parte inferior. El `ExpenseListItem` recibe un nuevo prop `onPress` para manejar la navegación.

**Tech Stack:** React Native, expo-router, @supabase/supabase-js, TypeScript

**Prerequisite:** Plans 1-7 completados (Supabase, Home screen, modal de add-expense).

---

## Task 1: Agregar función `getExpenseById` al repositorio

**Edit file:** `db/repository.ts`

Agregar la siguiente función debajo de `deleteExpense`:

```typescript
export async function getExpenseById(
  id: number
): Promise<ExpenseWithCategory | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories!inner (
        name,
        color,
        icon
      )
    `)
    .eq('id', id)
    .single();

  if (error) return null;

  const row = data as any;
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category_id: row.category_id,
    date: row.date,
    notes: row.notes,
    created_at: row.created_at,
    category_name: row.categories.name,
    category_color: row.categories.color,
    category_icon: row.categories.icon,
  };
}
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: add getExpenseById repository function`

---

## Task 2: Agregar función de formato de fecha completa a date-helpers

**Edit file:** `utils/date-helpers.ts`

Agregar al final del archivo:

```typescript
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const day = date.getDate();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const year = date.getFullYear();
  return `${day} de ${months[date.getMonth()]} de ${year}`;
}

export function formatCreatedAt(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate();
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `Registrado el ${day} ${months[date.getMonth()]} ${date.getFullYear()} a las ${hours}:${minutes}`;
}
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: add full date and created_at formatting utilities`

---

## Task 3: Agregar `onPress` al componente `ExpenseListItem`

**Edit file:** `components/expense-list-item.tsx`

Reemplazar **todo** el contenido con:

```typescript
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
```

Los cambios respecto al original:
1. Se agrega `onPress?` a la interfaz `ExpenseListItemProps`
2. Se agrega `onPress={() => onPress?.(expense)}` al `Pressable`

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: add onPress prop to ExpenseListItem component`

---

## Task 4: Actualizar Home screen para navegar al detalle al tocar un gasto

**Edit file:** `app/(tabs)/index.tsx`

Agregar la función `handlePress` y pasarla al `ExpenseListItem`.

En la sección de funciones (después de `useFocusEffect`), agregar:

```typescript
function handlePress(expense: ExpenseWithCategory) {
  router.push({
    pathname: '/modal/expense-detail' as any,
    params: { expenseId: expense.id },
  });
}
```

En el `renderItem` del `SectionList`, cambiar:

```typescript
// ANTES:
<ExpenseListItem expense={item} onLongPress={handleLongPress} />

// DESPUÉS:
<ExpenseListItem expense={item} onPress={handlePress} onLongPress={handleLongPress} />
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: navigate to expense detail on list item press`

---

## Task 5: Registrar la nueva ruta en el layout raíz

**Edit file:** `app/_layout.tsx`

Agregar un nuevo `Stack.Screen` para `expense-detail` **antes** del cierre del `</Stack>`. Esta ruta usa `presentation: 'card'` (no modal) para que tenga animación de push:

```typescript
<Stack.Screen
  name="modal/expense-detail"
  options={{
    presentation: 'card',
    headerShown: false,
  }}
/>
```

El archivo completo debe quedar:

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/add-expense"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/month-detail"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/add-category"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/expense-detail"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: register expense-detail route in root layout`

---

## Task 6: Crear la pantalla de detalle del gasto

**Create file:** `app/modal/expense-detail.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getExpenseById, deleteExpense } from '../../db/repository';
import { CategoryBadge } from '../../components/category-badge';
import { formatCurrency } from '../../utils/format-currency';
import { formatFullDate, formatCreatedAt } from '../../utils/date-helpers';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { ExpenseWithCategory } from '../../types';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ expenseId: string }>();
  const expenseId = Number(params.expenseId);

  const [expense, setExpense] = useState<ExpenseWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadExpense = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenseById(expenseId);
      setExpense(data);
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [loadExpense])
  );

  function handleEdit() {
    router.push({
      pathname: '/modal/add-expense' as any,
      params: { expenseId: expense!.id },
    });
  }

  function handleDelete() {
    if (!expense) return;

    Alert.alert(
      'Eliminar gasto',
      `¿Estás segura de eliminar "${expense.name}" por ${formatCurrency(expense.amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteExpense(expense.id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el gasto');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Gasto no encontrado</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Detalle del Gasto</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.heroSection}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: expense.category_color + '20' },
            ]}
          >
            <Text style={styles.heroIcon}>{expense.category_icon}</Text>
          </View>
          <Text style={styles.heroAmount}>
            {formatCurrency(expense.amount)}
          </Text>
          <Text style={styles.heroName}>{expense.name}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailLabelText}>Categoría</Text>
            </View>
            <CategoryBadge
              name={expense.category_name}
              color={expense.category_color}
              icon={expense.category_icon}
              size="md"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailLabelText}>Fecha</Text>
            </View>
            <Text style={styles.detailValue}>
              {formatFullDate(expense.date)}
            </Text>
          </View>

          {expense.notes ? (
            <>
              <View style={styles.separator} />
              <View style={styles.detailRowVertical}>
                <View style={styles.detailLabel}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailLabelText}>Notas</Text>
                </View>
                <Text style={styles.notesText}>{expense.notes}</Text>
              </View>
            </>
          ) : null}
        </View>

        {expense.created_at ? (
          <Text style={styles.createdAt}>
            {formatCreatedAt(expense.created_at)}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Text>
        </Pressable>
      </View>
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
    backgroundColor: Colors.white,
    gap: Spacing.md,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  backLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  backLinkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 40,
  },
  heroAmount: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text,
  },
  heroName: {
    fontSize: FontSize.lg,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailRowVertical: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabelText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  notesText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    paddingLeft: 26,
  },
  createdAt: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  editButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  editButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteButton: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + '10',
  },
  deleteButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: implement expense detail screen with edit and delete actions`

---

## Task 7: Verificar flujo completo

**Run:**
```bash
npx expo start
```

**Test steps:**
1. Abrir la app → Tab Inicio
2. Si hay gastos, tocar cualquier item de la lista
3. Debe navegar a la pantalla de detalle con:
   - Header con botón de regreso y título "Detalle del Gasto"
   - Emoji grande de la categoría en un círculo con color de fondo
   - Monto en formato grande ($1,234.50)
   - Nombre del gasto debajo del monto
   - Card de detalles con: categoría (badge), fecha formateada, notas (si existen)
   - Texto de "Registrado el..." en gris al fondo
   - Dos botones en el footer: "Editar" (azul) y "Eliminar" (rojo)
4. Presionar "Editar" → debe abrir el modal de edición con los datos pre-llenados
5. Presionar botón de regreso → vuelve a Home
6. Volver al detalle → presionar "Eliminar" → debe mostrar confirmación → confirmar → vuelve a Home sin el gasto
7. Long press en un item de Home → sigue funcionando el Alert de editar/eliminar (no se rompió)

**Commit:** `test: verify expense detail flow works end to end`

---

## Resultado Esperado

Al completar este plan tendrás:
- Items de la lista de gastos clickeables con navegación al detalle
- Pantalla de detalle con vista completa: emoji, monto, nombre, categoría, fecha, notas
- Fecha de registro (created_at) visible como metadata
- Botón "Editar" que redirige al modal de edición existente
- Botón "Eliminar" con confirmación visual y acción destructiva
- Estado de error si el gasto no se encuentra
- Long press sigue funcionando en Home como antes
- Nueva función `getExpenseById` en el repositorio para consultas directas
