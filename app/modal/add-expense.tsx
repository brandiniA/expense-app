import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CategoryPicker } from '../../components/category-picker';
import { useCategories } from '../../hooks/use-categories';
import {
  addExpense,
  updateExpense,
  getExpensesByDateRange,
} from '../../db/repository';
import { getTodayString, formatDateString, formatDayLabel } from '../../utils/date-helpers';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { Category } from '../../types';

export default function AddExpenseModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ expenseId?: string }>();
  const isEditing = Boolean(params.expenseId);

  const { categories } = useCategories();

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && categories.length > 0 && params.expenseId) {
      loadExpense(Number(params.expenseId));
    }
  }, [categories, isEditing, params.expenseId]);

  async function loadExpense(id: number) {
    const allExpenses = await getExpensesByDateRange('1900-01-01', '2099-12-31');
    const expense = allExpenses.find((e) => e.id === id);
    if (!expense) return;

    setAmount(String(expense.amount));
    setName(expense.name);
    setDate(new Date(expense.date + 'T12:00:00'));
    setNotes(expense.notes ?? '');
    if (expense.notes) setShowNotes(true);

    const cat = categories.find((c) => c.id === expense.category_id);
    if (cat) setSelectedCategory(cat);
  }

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del gasto');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    setSaving(true);
    try {
      const dateStr = formatDateString(date);
      const trimmedNotes = notes.trim() || null;

      if (isEditing && params.expenseId) {
        await updateExpense(
          Number(params.expenseId),
          name.trim(),
          parseFloat(amount),
          selectedCategory.id,
          dateStr,
          trimmedNotes
        );
      } else {
        await addExpense(
          name.trim(),
          parseFloat(amount),
          selectedCategory.id,
          dateStr,
          trimmedNotes
        );
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el gasto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.handleBar} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Monto</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre del gasto</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Uber, Walmart, Netflix..."
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <CategoryPicker
            categories={categories}
            selectedId={selectedCategory?.id ?? null}
            onSelect={setSelectedCategory}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fecha</Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formatDateString(date) === getTodayString()
                ? 'Hoy'
                : formatDayLabel(formatDateString(date))}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        {!showNotes ? (
          <Pressable onPress={() => setShowNotes(true)}>
            <Text style={styles.addNoteLink}>+ Agregar nota</Text>
          </Pressable>
        ) : (
          <View style={styles.field}>
            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas opcionales..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar gasto'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySign: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    padding: 0,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  addNoteLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
