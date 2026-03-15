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
