# Plan 7: Migrar de SQLite a Supabase

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar expo-sqlite con Supabase como backend de datos para que la app funcione en Expo Go sin necesidad de un development build.

**Architecture:** El cliente de Supabase reemplaza `db/database.ts` y `db/repository.ts`. Se mantiene la misma interfaz pública del repositorio para que las pantallas no cambien. No se implementa autenticación (usuario único). Las tablas se crean en Supabase Dashboard con RLS deshabilitado por ahora.

**Tech Stack:** @supabase/supabase-js, Supabase (Postgres hosted), TypeScript

---

## Pre-requisitos: Crear proyecto en Supabase

Antes de ejecutar las tasks, el usuario debe:

1. Ir a https://supabase.com y crear una cuenta gratuita
2. Crear un nuevo proyecto (nombre: `expense-app`, región: la más cercana)
3. Esperar a que el proyecto se inicialice (~2 minutos)
4. Ir a **Project Settings > API** y copiar:
   - `Project URL` (ej: `https://xxxxx.supabase.co`)
   - `anon public key` (ej: `eyJhbGciOiJIUzI1NiIs...`)
5. Ir a **SQL Editor** en el dashboard de Supabase y ejecutar este SQL para crear las tablas:

```sql
-- Tabla de categorías
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de gastos
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- Desactivar RLS (usuario único, sin auth)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sin auth por ahora)
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Seed: categorías predefinidas
INSERT INTO categories (name, color, icon, is_default) VALUES
  ('Hogar', '#4A90D9', '🏠', true),
  ('Entretenimiento', '#9B59B6', '🎬', true),
  ('Servicios', '#3498DB', '📱', true),
  ('Auto', '#E67E22', '🚗', true),
  ('Comida', '#E74C3C', '🍽️', true),
  ('Salud', '#2ECC71', '💊', true),
  ('Educación', '#1ABC9C', '📚', true),
  ('Transporte', '#F39C12', '🚌', true),
  ('Ropa', '#E91E63', '👕', true);
```

6. Verificar en **Table Editor** que las tablas `categories` y `expenses` existen y que `categories` tiene 9 filas.

---

## Task 1: Instalar dependencia de Supabase y crear archivo de entorno

**Run:**
```bash
npm install @supabase/supabase-js
```

**Create file:** `.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**IMPORTANT:** Reemplazar los valores con los del proyecto Supabase real.

**Edit file:** `.gitignore`

Agregar al final:
```
# Environment variables
.env
```

**Verify:**
```bash
node -e "require('@supabase/supabase-js')"
```
Debe completar sin errores.

**Commit:** `chore: install supabase-js and configure environment variables`

---

## Task 2: Crear cliente de Supabase

**Create file:** `db/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Verify:** No TypeScript errors.
```bash
npx tsc --noEmit
```

**Commit:** `feat: add Supabase client initialization`

---

## Task 3: Reescribir el repositorio para Supabase

**Delete file:** `db/database.ts`

Ya no se necesita. La inicialización de la base de datos y el seed se hicieron en el dashboard de Supabase.

**Edit file:** `db/repository.ts`

Reemplazar **todo** el contenido con:

```typescript
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
```

**Verify:**
```bash
npx tsc --noEmit
```
No TypeScript errors.

**Commit:** `feat: replace SQLite repository with Supabase client`

---

## Task 4: Limpiar dependencias de SQLite

**Run:**
```bash
npm uninstall expo-sqlite
```

**Verify** que no queden imports de expo-sqlite en el proyecto:
```bash
rg "expo-sqlite" --type ts --type tsx
```
Debe no encontrar resultados.

**Commit:** `chore: remove expo-sqlite dependency`

---

## Task 5: Verificar que la app arranca en Expo Go

**Run:**
```bash
npx expo start
```

Luego escanear el QR con Expo Go en Android o presionar `a`.

**Expected:**
- La app abre sin el error de SQLite
- Tab Inicio muestra el empty state ("No hay gastos este mes")
- Tab Config muestra las 9 categorías predefinidas
- Se puede agregar un gasto y aparece en la lista

**Si hay errores**, revisar:
1. Que las variables de entorno en `.env` son correctas
2. Que las tablas en Supabase existen con las columnas esperadas
3. Que las políticas de RLS están configuradas (allow all)

**Commit:** `test: verify Supabase integration works in Expo Go`

---

## Resultado Esperado

Al completar este plan tendrás:
- Supabase como backend (Postgres en la nube)
- La app funciona en Expo Go sin necesidad de development build
- Los datos persisten entre sesiones y dispositivos
- La misma interfaz que antes, sin cambios en las pantallas
- Base para agregar autenticación en el futuro
- Se eliminó la dependencia de expo-sqlite
