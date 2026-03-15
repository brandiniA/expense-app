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
