# Plan 9: Modal de Confirmación para Exportar Excel y Compartir

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corregir la exportación a Excel que no funciona, agregar un modal de confirmación antes de exportar, y permitir compartir el archivo vía mensajería (WhatsApp, Telegram, email, etc.) o guardar en archivos.

**Architecture:** Al presionar el botón de exportar en el modal de detalle de mes, se muestra un bottom-sheet de confirmación con resumen del contenido (mes, número de gastos, total). El usuario confirma y se genera el archivo `.xlsx`, que se comparte usando el share sheet nativo del sistema (iOS/Android), el cual permite enviar por WhatsApp, Telegram, correo, Airdrop, guardar en Archivos, etc. Se corrigen los bugs actuales en `export-excel.ts` que usan `as any` para las APIs de `expo-file-system`.

**Tech Stack:** React Native Modal, expo-file-system, expo-sharing, xlsx (SheetJS), TypeScript

**Prerequisite:** Plan 5 completado (historial y exportación base).

---

## Diagnóstico del Bug Actual

El archivo `utils/export-excel.ts` tiene dos problemas:

1. **`(FileSystem as any).cacheDirectory`** — El cast `as any` puede enmascarar que `cacheDirectory` sea `null` en ciertos contextos (emulador sin permisos, web). Si es `null`, el path queda como `"nullGastos_Marzo_2026.xlsx"` y `writeAsStringAsync` falla silenciosamente.

2. **`encoding: 'base64' as any`** — Debería ser `FileSystem.EncodingType.Base64`. El cast `as any` podría pasar un string que la API no reconoce en algunas versiones del SDK.

3. **Sin feedback al usuario si `Sharing.isAvailableAsync()` retorna `false`** — En plataformas donde sharing no está disponible, el archivo se genera pero nunca se muestra al usuario.

4. **Sin modal de confirmación** — El export se dispara inmediatamente al tocar el botón, sin darle al usuario la oportunidad de confirmar o cancelar.

---

## Task 1: Corregir `utils/export-excel.ts` — quitar casts `as any` y agregar validación

**Edit file:** `utils/export-excel.ts`

Reemplazar el contenido completo con:

```typescript
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
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

  if (!FileSystem.cacheDirectory) {
    throw new Error('No se puede acceder al directorio de caché del dispositivo');
  }

  const fileName = `Gastos_${monthName}_${year}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
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
```

**Cambios clave:**
- Quitar `(FileSystem as any)` → usar `FileSystem.cacheDirectory` directo con validación null
- Quitar `'base64' as any` → usar `FileSystem.EncodingType.Base64`
- Lanzar error si `cacheDirectory` es null
- Lanzar error si sharing no está disponible (en vez de fallar silenciosamente)

**Verify:**
```bash
npx tsc --noEmit
```
Debe compilar sin errores.

**Commit:** `fix: remove unsafe casts in export-excel and add null checks`

---

## Task 2: Crear componente de modal de confirmación de exportación

**Create file:** `components/export-confirmation-modal.tsx`

```typescript
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/format-currency';
import { getMonthName } from '../utils/date-helpers';

interface ExportConfirmationModalProps {
  visible: boolean;
  year: number;
  month: number;
  expenseCount: number;
  total: number;
  exporting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExportConfirmationModal({
  visible,
  year,
  month,
  expenseCount,
  total,
  exporting,
  onConfirm,
  onCancel,
}: ExportConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={40} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Exportar a Excel</Text>

          <Text style={styles.description}>
            Se generará un archivo Excel con los gastos de{' '}
            <Text style={styles.bold}>
              {getMonthName(month)} {year}
            </Text>
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={styles.summaryValue}>
                {expenseCount} registro{expenseCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <Text style={styles.hint}>
            Podrás compartir el archivo por WhatsApp, correo, guardarlo en Archivos u otra app.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={exporting}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color={Colors.white} />
                  <Text style={styles.confirmText}>Exportar y compartir</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
});
```

**Verify:**
```bash
npx tsc --noEmit
```
Debe compilar sin errores.

**Commit:** `feat: add export confirmation modal component`

---

## Task 3: Integrar modal de confirmación en `month-detail.tsx`

**Edit file:** `app/modal/month-detail.tsx`

Reemplazar el contenido completo con:

```typescript
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getExpensesByMonth,
  getCategorySummary,
} from '../../db/repository';
import { CategoryBadge } from '../../components/category-badge';
import { ExportConfirmationModal } from '../../components/export-confirmation-modal';
import { getMonthName } from '../../utils/date-helpers';
import { formatCurrency } from '../../utils/format-currency';
import { exportMonthToExcel } from '../../utils/export-excel';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { ExpenseWithCategory, CategorySummary as CS } from '../../types';

export default function MonthDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ year: string; month: string }>();
  const year = Number(params.year);
  const month = Number(params.month);

  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [summary, setSummary] = useState<CS[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function loadData() {
    setLoading(true);
    try {
      const monthStr = String(month).padStart(2, '0');
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const [expenseData, summaryData] = await Promise.all([
        getExpensesByMonth(year, month),
        getCategorySummary(startDate, endDate),
      ]);

      setExpenses(expenseData);
      setSummary(summaryData);
      setTotal(expenseData.reduce((sum, e) => sum + e.amount, 0));
    } finally {
      setLoading(false);
    }
  }

  async function handleExportConfirm() {
    setExporting(true);
    try {
      await exportMonthToExcel(year, month, expenses, summary);
      setShowExportModal(false);
    } catch {
      setShowExportModal(false);
      Alert.alert(
        'Error al exportar',
        'No se pudo generar o compartir el archivo Excel. Verifica que tengas espacio disponible e intenta de nuevo.'
      );
    } finally {
      setExporting(false);
    }
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
      <View style={styles.handleBar} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {getMonthName(month)} {year}
        </Text>
        <Pressable onPress={() => setShowExportModal(true)}>
          <Ionicons name="download-outline" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total del mes</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        <Text style={styles.totalCount}>
          {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Desglose por categoría</Text>

      <FlatList
        data={summary}
        keyExtractor={(item) => String(item.category_id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.summaryRow}>
            <CategoryBadge
              name={item.category_name}
              color={item.category_color}
              icon={item.category_icon}
              size="md"
            />
            <View style={styles.summaryRight}>
              <Text style={styles.summaryPercent}>
                {item.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          </View>
        )}
      />

      <ExportConfirmationModal
        visible={showExportModal}
        year={year}
        month={month}
        expenseCount={expenses.length}
        total={total}
        exporting={exporting}
        onConfirm={handleExportConfirm}
        onCancel={() => setShowExportModal(false)}
      />
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
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  totalCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  totalCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryPercent: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  summaryAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 90,
    textAlign: 'right',
  },
});
```

**Cambios clave:**
- Nuevo state `showExportModal` controla visibilidad del modal
- El botón de descarga ahora abre el modal en vez de exportar directamente
- `handleExportConfirm()` reemplaza `handleExport()` — cierra el modal al terminar
- Se importa y renderiza `ExportConfirmationModal` al final del JSX
- Mensaje de error más descriptivo

**Verify:**
```bash
npx tsc --noEmit
```
Debe compilar sin errores.

**Commit:** `feat: integrate export confirmation modal in month detail`

---

## Task 4: Verificación end-to-end

**Run:**
```bash
npx expo start --clear
```

**Probar manualmente:**

1. Ir a la pestaña **Historial**
2. Tocar un mes con gastos registrados
3. En el detalle del mes, presionar el ícono de descarga (esquina superior derecha)
4. **Verificar:** Aparece el modal de confirmación con:
   - Ícono de documento
   - Título "Exportar a Excel"
   - Nombre del mes y año
   - Número de gastos y total
   - Hint sobre compartir
   - Botones "Cancelar" y "Exportar y compartir"
5. Presionar **"Cancelar"** → el modal se cierra, nada se exporta
6. Volver a abrir el modal → presionar **"Exportar y compartir"**
7. **Verificar:** Se muestra el spinner en el botón de confirmar
8. **Verificar:** Se abre el share sheet nativo del sistema con el archivo `.xlsx`
9. **Verificar:** Se puede compartir por WhatsApp, Telegram, correo, guardar en Archivos, etc.
10. Tocar fuera del modal (overlay) → el modal se cierra

**Commit:** `test: verify export confirmation flow end-to-end`

---

## Resultado Esperado

Al completar este plan tendrás:
- **Bug fix:** Exportación corregida — sin casts `as any`, con validación de `cacheDirectory`
- **Modal de confirmación:** Aparece al presionar el botón de descarga con resumen del contenido
- **Compartir vía mensajería:** El share sheet nativo permite enviar por WhatsApp, Telegram, correo, Airdrop, guardar en Archivos, y cualquier otra app instalada
- **Error handling mejorado:** Mensajes de error descriptivos si algo falla
- **UX mejorada:** El usuario sabe exactamente qué se va a exportar antes de confirmar

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `utils/export-excel.ts` | Edit — fix bugs, add validation |
| `components/export-confirmation-modal.tsx` | Create — modal component |
| `app/modal/month-detail.tsx` | Edit — integrate modal |
