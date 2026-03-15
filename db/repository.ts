import { getDatabase } from './database';
import type {
  Category,
  Expense,
  ExpenseWithCategory,
  CategorySummary,
  MonthSummary,
} from '../types';

// === CATEGORIES ===

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Category>(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC'
  );
  return rows.map((r) => ({ ...r, is_default: Boolean(r.is_default) }));
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Category>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  return row ? { ...row, is_default: Boolean(row.is_default) } : null;
}

export async function addCategory(
  name: string,
  color: string,
  icon: string
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO categories (name, color, icon, is_default) VALUES (?, ?, ?, 0)',
    [name, color, icon]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  id: number,
  name: string,
  color: string,
  icon: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?',
    [name, color, icon, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0', [
    id,
  ]);
}

// === EXPENSES ===

export async function addExpense(
  name: string,
  amount: number,
  categoryId: number,
  date: string,
  notes: string | null
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO expenses (name, amount, category_id, date, notes) VALUES (?, ?, ?, ?, ?)',
    [name, amount, categoryId, date, notes]
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  id: number,
  name: string,
  amount: number,
  categoryId: number,
  date: string,
  notes: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE expenses SET name = ?, amount = ?, category_id = ?, date = ?, notes = ? WHERE id = ?',
    [name, amount, categoryId, date, notes, id]
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<ExpenseWithCategory[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.date >= ? AND e.date <= ?
     ORDER BY e.date DESC, e.created_at DESC`,
    [startDate, endDate]
  );
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
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    category_id: number;
    category_name: string;
    category_color: string;
    category_icon: string;
    total: number;
    count: number;
  }>(
    `SELECT
      c.id as category_id,
      c.name as category_name,
      c.color as category_color,
      c.icon as category_icon,
      COALESCE(SUM(e.amount), 0) as total,
      COUNT(e.id) as count
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.date >= ? AND e.date <= ?
    GROUP BY c.id
    ORDER BY total DESC`,
    [startDate, endDate]
  );

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
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );
  return result?.total ?? 0;
}

export async function getMonthsList(): Promise<MonthSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<MonthSummary>(
    `SELECT
      strftime('%Y-%m', date) as month,
      CAST(strftime('%Y', date) AS INTEGER) as year,
      CAST(strftime('%m', date) AS INTEGER) as month_number,
      SUM(amount) as total,
      COUNT(*) as expense_count
    FROM expenses
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC`
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
