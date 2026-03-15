# Plan 1: Fundación - Base de Datos, Repositorio y Utilidades

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establecer la capa de datos (SQLite), utilidades de formato y constantes que todas las pantallas necesitan.

**Architecture:** SQLite local con patrón repository para encapsular queries. Las constantes de categorías y tema se definen por separado. Las utilidades de formato de moneda y fechas son funciones puras.

**Tech Stack:** expo-sqlite, TypeScript

---

## Task 1: Instalar dependencias necesarias

**Run:**
```bash
npx expo install expo-sqlite expo-file-system expo-sharing
npm install xlsx @react-native-community/datetimepicker react-native-chart-kit react-native-svg
```

**Verify:**
```bash
npx expo doctor
```
Debe completar sin errores críticos.

**Commit:** `chore: install core dependencies (sqlite, xlsx, chart-kit, datetimepicker)`

---

## Task 2: Definir tipos TypeScript

**Create file:** `types/index.ts`

```typescript
export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  category_id: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DashboardStats {
  total: number;
  daily_average: number;
  top_category: CategorySummary | null;
  category_breakdown: CategorySummary[];
}

export interface MonthSummary {
  month: string;
  year: number;
  month_number: number;
  total: number;
  expense_count: number;
}

export type DateFilter = 'today' | '7days' | 'month' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}
```

**Verify:** No TypeScript errors.
```bash
npx tsc --noEmit
```

**Commit:** `feat: add TypeScript type definitions for data models`

---

## Task 3: Definir constantes de categorías por defecto

**Create file:** `constants/default-categories.ts`

```typescript
export interface DefaultCategory {
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Hogar', color: '#4A90D9', icon: '🏠' },
  { name: 'Entretenimiento', color: '#9B59B6', icon: '🎬' },
  { name: 'Servicios', color: '#3498DB', icon: '📱' },
  { name: 'Auto', color: '#E67E22', icon: '🚗' },
  { name: 'Comida', color: '#E74C3C', icon: '🍽️' },
  { name: 'Salud', color: '#2ECC71', icon: '💊' },
  { name: 'Educación', color: '#1ABC9C', icon: '📚' },
  { name: 'Transporte', color: '#F39C12', icon: '🚌' },
  { name: 'Ropa', color: '#E91E63', icon: '👕' },
];
```

**Verify:** File imports without errors.

**Commit:** `feat: add default category constants with colors and icons`

---

## Task 4: Actualizar constantes de tema

**Edit file:** `constants/theme.ts`

Replace entire contents with:

```typescript
export const Colors = {
  primary: '#4A90D9',
  primaryLight: '#E8F0FE',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#22C55E',
  white: '#FFFFFF',
  shadow: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
```

**Verify:** No TypeScript errors.

**Commit:** `feat: define theme constants (colors, spacing, fonts, radius)`

---

## Task 5: Inicializar base de datos SQLite

**Create file:** `db/database.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../constants/default-categories';

const DB_NAME = 'expenses.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);
  return db;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
  `);

  await seedCategories(database);
}

async function seedCategories(database: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_default = 1'
  );

  if (existing && existing.count > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await database.runAsync(
      'INSERT INTO categories (name, color, icon, is_default) VALUES (?, ?, ?, 1)',
      [cat.name, cat.color, cat.icon]
    );
  }
}
```

**Verify:** No TypeScript errors.
```bash
npx tsc --noEmit
```

**Commit:** `feat: initialize SQLite database with migrations and seed`

---

## Task 6: Crear repositorio de categorías

**Create file:** `db/repository.ts`

```typescript
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
```

**Verify:** No TypeScript errors.
```bash
npx tsc --noEmit
```

**Commit:** `feat: add repository with CRUD operations for expenses and categories`

---

## Task 7: Crear utilidad de formato de moneda

**Create file:** `utils/format-currency.ts`

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

**Verify:** No errors.

**Commit:** `feat: add currency formatting utility for MXN`

---

## Task 8: Crear utilidades de fecha

**Create file:** `utils/date-helpers.ts`

```typescript
export function getTodayString(): string {
  return formatDateString(new Date());
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRangeForFilter(
  filter: 'today' | '7days' | 'month'
): { start: string; end: string } {
  const now = new Date();
  const end = formatDateString(now);

  switch (filter) {
    case 'today':
      return { start: end, end };
    case '7days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: formatDateString(start), end };
    }
    case 'month': {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return { start: `${year}-${month}-01`, end };
    }
  }
}

export function formatDayLabel(dateString: string): string {
  const today = getTodayString();
  if (dateString === today) return 'Hoy';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateString === formatDateString(yesterday)) return 'Ayer';

  const date = new Date(dateString + 'T12:00:00');
  const day = date.getDate();
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  return `${day} ${months[date.getMonth()]}`;
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return months[monthNumber - 1] ?? '';
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getDaysInRange(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function groupExpensesByDate<T extends { date: string }>(
  expenses: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const expense of expenses) {
    const existing = groups.get(expense.date) ?? [];
    existing.push(expense);
    groups.set(expense.date, existing);
  }
  return groups;
}
```

**Verify:** No TypeScript errors.
```bash
npx tsc --noEmit
```

**Commit:** `feat: add date helper utilities (formatting, ranges, grouping)`

---

## Task 9: Limpieza del boilerplate de Expo

**Delete these files** (boilerplate del template que no necesitamos):
- `app/(tabs)/explore.tsx`
- `app/modal.tsx`
- `components/hello-wave.tsx`
- `components/parallax-scroll-view.tsx`
- `components/external-link.tsx`
- `components/haptic-tab.tsx`
- `components/ui/collapsible.tsx`

**Edit file:** `app/(tabs)/_layout.tsx`

Reemplazar con la configuración de 4 tabs (Home, Dashboard, History, Settings). Usar iconos de `@expo/vector-icons`.

**Edit file:** `app/(tabs)/index.tsx`

Reemplazar con un placeholder simple:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inicio - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#6B7280' },
});
```

**Create placeholder files** for the other tabs with similar structure:
- `app/(tabs)/dashboard.tsx` → "Dashboard - Coming Soon"
- `app/(tabs)/history.tsx` → "Historial - Coming Soon"
- `app/(tabs)/settings.tsx` → "Configuración - Coming Soon"

**Verify:**
```bash
npx expo start --android
```
La app debe abrir con 4 tabs funcionales, cada una mostrando su placeholder.

**Commit:** `feat: set up 4-tab navigation and remove boilerplate`

---

## Resultado Esperado

Al completar este plan tendrás:
- Base de datos SQLite inicializada con categorías predefinidas
- Repositorio con todas las operaciones CRUD
- Utilidades de formato y fecha listas para usar
- Navegación de 4 tabs funcional
- Tipos TypeScript definidos para toda la app
