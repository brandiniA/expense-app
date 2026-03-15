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
