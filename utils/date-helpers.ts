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
