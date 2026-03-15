import { useCallback, useState } from 'react';
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
      pathname: '/modal/month-detail' as any,
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
