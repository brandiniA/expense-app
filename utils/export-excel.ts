import * as XLSX from 'xlsx';
import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { ExpenseWithCategory, CategorySummary } from '../types';
import { getMonthName } from './date-helpers';

export async function exportMonthToExcel(
  year: number,
  month: number,
  expenses: ExpenseWithCategory[],
  categorySummary: CategorySummary[]
): Promise<void> {
  const monthName = getMonthName(month);

  const expenseRows = expenses.map((e) => ({
    Fecha: e.date,
    Nombre: e.name,
    Categoría: e.category_name,
    Monto: e.amount,
    Notas: e.notes ?? '',
  }));

  const summaryRows = categorySummary.map((c) => ({
    Categoría: c.category_name,
    Total: c.total,
    Porcentaje: `${c.percentage.toFixed(1)}%`,
    'Num. Gastos': c.count,
  }));

  const wb = XLSX.utils.book_new();

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos');

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  if (!cacheDirectory) {
    throw new Error('No se puede acceder al directorio de caché del dispositivo');
  }

  const fileName = `Gastos_${monthName}_${year}.xlsx`;
  const filePath = `${cacheDirectory}${fileName}`;

  await writeAsStringAsync(filePath, wbout, {
    encoding: EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir archivos no está disponible en este dispositivo');
  }

  await Sharing.shareAsync(filePath, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Gastos de ${monthName} ${year}`,
  });
}
