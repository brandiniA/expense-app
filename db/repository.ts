import { supabase } from './supabase';
import type {
  Category,
  ExpenseWithCategory,
  CategorySummary,
  MonthSummary,
} from '../types';

// === CATEGORIES ===

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function addCategory(
  name: string,
  color: string,
  icon: string
): Promise<number> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, color, icon, is_default: false })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateCategory(
  id: number,
  name: string,
  color: string,
  icon: string
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name, color, icon })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('is_default', false);

  if (error) throw error;
}

// === EXPENSES ===

export async function addExpense(
  name: string,
  amount: number,
  categoryId: number,
  date: string,
  notes: string | null
): Promise<number> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ name, amount, category_id: categoryId, date, notes })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateExpense(
  id: number,
  name: string,
  amount: number,
  categoryId: number,
  date: string,
  notes: string | null
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ name, amount, category_id: categoryId, date, notes })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteExpense(id: number): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<ExpenseWithCategory[]> {
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
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
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
  }));
}

export async function getExpensesForCurrentMonth(): Promise<
  ExpenseWithCategory[]
> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;
  return getExpensesByDateRange(startDate, endDate);
}

export async function getCategorySummary(
  startDate: string,
  endDate: string
): Promise<CategorySummary[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      amount,
      category_id,
      categories!inner (
        id,
        name,
        color,
        icon
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  const grouped = new Map<number, {
    category_id: number;
    category_name: string;
    category_color: string;
    category_icon: string;
    total: number;
    count: number;
  }>();

  for (const row of data ?? []) {
    const cat = (row as any).categories;
    const catId = cat.id;
    const existing = grouped.get(catId);

    if (existing) {
      existing.total += Number(row.amount);
      existing.count += 1;
    } else {
      grouped.set(catId, {
        category_id: catId,
        category_name: cat.name,
        category_color: cat.color,
        category_icon: cat.icon,
        total: Number(row.amount),
        count: 1,
      });
    }
  }

  const rows = Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

export async function getTotalForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function getMonthsList(): Promise<MonthSummary[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('date, amount')
    .order('date', { ascending: false });

  if (error) throw error;

  const grouped = new Map<string, MonthSummary>();

  for (const row of data ?? []) {
    const d = new Date(row.date + 'T12:00:00');
    const year = d.getFullYear();
    const monthNum = d.getMonth() + 1;
    const key = `${year}-${String(monthNum).padStart(2, '0')}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.total += Number(row.amount);
      existing.expense_count += 1;
    } else {
      grouped.set(key, {
        month: key,
        year,
        month_number: monthNum,
        total: Number(row.amount),
        expense_count: 1,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
}

export async function getExpensesByMonth(
  year: number,
  month: number
): Promise<ExpenseWithCategory[]> {
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;
  return getExpensesByDateRange(startDate, endDate);
}
